-- Create the missing enhanced_safe_save_stripe_customer_id function
CREATE OR REPLACE FUNCTION public.enhanced_safe_save_stripe_customer_id(
    p_user_id uuid, 
    p_email text, 
    p_stripe_customer_id text, 
    p_subscription_tier text DEFAULT NULL::text, 
    p_subscription_status subscription_status_type DEFAULT 'active'::subscription_status_type,
    p_subscription_end timestamp with time zone DEFAULT NULL,
    p_current_period_end timestamp with time zone DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    operation_success boolean := false;
    error_message text;
    retry_count integer := 0;
    max_retries integer := 3;
BEGIN
    -- Enhanced version with subscription end date handling
    WHILE retry_count < max_retries AND NOT operation_success LOOP
        BEGIN
            -- Try to upsert subscriber record with enhanced data
            INSERT INTO public.subscribers (
                user_id,
                email,
                stripe_customer_id,
                subscribed,
                subscription_tier,
                subscription_status,
                subscription_end,
                current_period_end,
                created_at,
                updated_at
            ) VALUES (
                p_user_id,
                p_email,
                p_stripe_customer_id,
                true,
                p_subscription_tier,
                p_subscription_status,
                p_subscription_end,
                p_current_period_end,
                now(),
                now()
            ) ON CONFLICT (email) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                stripe_customer_id = EXCLUDED.stripe_customer_id,
                subscribed = EXCLUDED.subscribed,
                subscription_tier = EXCLUDED.subscription_tier,
                subscription_status = EXCLUDED.subscription_status,
                subscription_end = COALESCE(EXCLUDED.subscription_end, subscribers.subscription_end),
                current_period_end = COALESCE(EXCLUDED.current_period_end, subscribers.current_period_end),
                updated_at = now();
            
            operation_success := true;
            
        EXCEPTION WHEN OTHERS THEN
            retry_count := retry_count + 1;
            error_message := SQLERRM;
            
            -- Log the retry attempt
            RAISE LOG '[enhanced_safe_save_stripe_customer_id] Retry % for %: %', retry_count, p_email, error_message;
            
            -- Short delay between retries
            PERFORM pg_sleep(0.1 * retry_count);
            
            -- If max retries reached, try fallback update only
            IF retry_count >= max_retries THEN
                BEGIN
                    UPDATE public.subscribers
                    SET 
                        stripe_customer_id = p_stripe_customer_id,
                        subscription_tier = COALESCE(p_subscription_tier, subscription_tier),
                        subscription_status = p_subscription_status,
                        subscription_end = COALESCE(p_subscription_end, subscription_end),
                        current_period_end = COALESCE(p_current_period_end, current_period_end),
                        updated_at = now()
                    WHERE email = p_email;
                    
                    IF FOUND THEN
                        operation_success := true;
                    END IF;
                    
                EXCEPTION WHEN OTHERS THEN
                    error_message := error_message || ' | Final fallback failed: ' || SQLERRM;
                END;
            END IF;
        END;
    END LOOP;
    
    -- Also update profiles table if successful
    IF operation_success THEN
        UPDATE public.profiles
        SET 
            subscription_end_date = COALESCE(p_subscription_end, subscription_end_date),
            subscription_status = p_subscription_status,
            updated_at = now()
        WHERE id = p_user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', operation_success,
        'retry_count', retry_count,
        'error_message', error_message,
        'stripe_customer_id', p_stripe_customer_id,
        'function', 'enhanced_safe_save_stripe_customer_id'
    );
END;
$function$;

-- Create circuit breaker state tracking table
CREATE TABLE IF NOT EXISTS public.circuit_breaker_state (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name text NOT NULL UNIQUE,
    state text NOT NULL DEFAULT 'closed',
    failure_count integer NOT NULL DEFAULT 0,
    last_failure_time timestamp with time zone,
    next_retry_time timestamp with time zone,
    success_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on circuit breaker state
ALTER TABLE public.circuit_breaker_state ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage circuit breaker state" 
ON public.circuit_breaker_state 
FOR ALL 
USING (current_setting('role'::text) = 'service_role'::text);

-- Create circuit breaker management function
CREATE OR REPLACE FUNCTION public.check_circuit_breaker(
    p_service_name text,
    p_failure_threshold integer DEFAULT 5,
    p_timeout_seconds integer DEFAULT 60
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    breaker_state RECORD;
    current_state text;
    can_proceed boolean := true;
BEGIN
    -- Get or create circuit breaker state
    INSERT INTO public.circuit_breaker_state (service_name)
    VALUES (p_service_name)
    ON CONFLICT (service_name) DO NOTHING;
    
    SELECT * INTO breaker_state
    FROM public.circuit_breaker_state
    WHERE service_name = p_service_name;
    
    current_state := breaker_state.state;
    
    -- Check circuit breaker logic
    CASE current_state
        WHEN 'closed' THEN
            -- Normal operation
            can_proceed := true;
            
        WHEN 'open' THEN
            -- Circuit is open, check if timeout has passed
            IF breaker_state.next_retry_time IS NULL OR now() >= breaker_state.next_retry_time THEN
                -- Move to half-open state
                UPDATE public.circuit_breaker_state
                SET 
                    state = 'half_open',
                    updated_at = now()
                WHERE service_name = p_service_name;
                
                current_state := 'half_open';
                can_proceed := true;
            ELSE
                can_proceed := false;
            END IF;
            
        WHEN 'half_open' THEN
            -- Allow limited requests
            can_proceed := true;
    END CASE;
    
    RETURN jsonb_build_object(
        'can_proceed', can_proceed,
        'state', current_state,
        'failure_count', breaker_state.failure_count,
        'next_retry_time', breaker_state.next_retry_time
    );
END;
$function$;

-- Create function to record circuit breaker success
CREATE OR REPLACE FUNCTION public.record_circuit_breaker_success(p_service_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.circuit_breaker_state
    SET 
        state = 'closed',
        failure_count = 0,
        success_count = success_count + 1,
        last_failure_time = NULL,
        next_retry_time = NULL,
        updated_at = now()
    WHERE service_name = p_service_name;
END;
$function$;

-- Create function to record circuit breaker failure
CREATE OR REPLACE FUNCTION public.record_circuit_breaker_failure(
    p_service_name text,
    p_failure_threshold integer DEFAULT 5,
    p_timeout_seconds integer DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    new_failure_count integer;
BEGIN
    UPDATE public.circuit_breaker_state
    SET 
        failure_count = failure_count + 1,
        last_failure_time = now(),
        updated_at = now()
    WHERE service_name = p_service_name
    RETURNING failure_count INTO new_failure_count;
    
    -- If failure threshold exceeded, open the circuit
    IF new_failure_count >= p_failure_threshold THEN
        UPDATE public.circuit_breaker_state
        SET 
            state = 'open',
            next_retry_time = now() + (p_timeout_seconds || ' seconds')::interval,
            updated_at = now()
        WHERE service_name = p_service_name;
    END IF;
END;
$function$;

-- Create error recovery and retry management table
CREATE TABLE IF NOT EXISTS public.error_recovery_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name text NOT NULL,
    operation_type text NOT NULL,
    error_message text,
    retry_count integer NOT NULL DEFAULT 0,
    max_retries integer NOT NULL DEFAULT 3,
    exponential_backoff_seconds integer NOT NULL DEFAULT 1,
    next_retry_time timestamp with time zone,
    resolved boolean NOT NULL DEFAULT false,
    user_id uuid,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on error recovery log
ALTER TABLE public.error_recovery_log ENABLE ROW LEVEL SECURITY;

-- Create policies for error recovery log
CREATE POLICY "Service role can manage error recovery log" 
ON public.error_recovery_log 
FOR ALL 
USING (current_setting('role'::text) = 'service_role'::text);

CREATE POLICY "Users can view their own error recovery logs" 
ON public.error_recovery_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function for exponential backoff retry logic
CREATE OR REPLACE FUNCTION public.schedule_retry_with_backoff(
    p_service_name text,
    p_operation_type text,
    p_error_message text,
    p_user_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL,
    p_max_retries integer DEFAULT 3
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    existing_log RECORD;
    new_retry_count integer;
    backoff_seconds integer;
    next_retry timestamp with time zone;
BEGIN
    -- Check for existing retry log
    SELECT * INTO existing_log
    FROM public.error_recovery_log
    WHERE service_name = p_service_name 
    AND operation_type = p_operation_type
    AND user_id = p_user_id
    AND resolved = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF existing_log.id IS NOT NULL THEN
        -- Update existing log
        new_retry_count := existing_log.retry_count + 1;
        
        IF new_retry_count > p_max_retries THEN
            -- Mark as resolved (failed permanently)
            UPDATE public.error_recovery_log
            SET 
                resolved = true,
                error_message = p_error_message || ' (Max retries exceeded)',
                updated_at = now()
            WHERE id = existing_log.id;
            
            RETURN jsonb_build_object(
                'should_retry', false,
                'reason', 'max_retries_exceeded',
                'retry_count', new_retry_count
            );
        END IF;
        
        -- Calculate exponential backoff: 2^retry_count seconds
        backoff_seconds := POWER(2, new_retry_count)::integer;
        next_retry := now() + (backoff_seconds || ' seconds')::interval;
        
        UPDATE public.error_recovery_log
        SET 
            retry_count = new_retry_count,
            exponential_backoff_seconds = backoff_seconds,
            next_retry_time = next_retry,
            error_message = p_error_message,
            metadata = COALESCE(p_metadata, metadata),
            updated_at = now()
        WHERE id = existing_log.id;
        
    ELSE
        -- Create new retry log
        new_retry_count := 1;
        backoff_seconds := 2; -- Start with 2 seconds
        next_retry := now() + (backoff_seconds || ' seconds')::interval;
        
        INSERT INTO public.error_recovery_log (
            service_name,
            operation_type,
            error_message,
            retry_count,
            max_retries,
            exponential_backoff_seconds,
            next_retry_time,
            user_id,
            metadata
        ) VALUES (
            p_service_name,
            p_operation_type,
            p_error_message,
            new_retry_count,
            p_max_retries,
            backoff_seconds,
            next_retry,
            p_user_id,
            p_metadata
        );
    END IF;
    
    RETURN jsonb_build_object(
        'should_retry', true,
        'retry_count', new_retry_count,
        'backoff_seconds', backoff_seconds,
        'next_retry_time', next_retry
    );
END;
$function$;

-- Create function to mark retry as successful
CREATE OR REPLACE FUNCTION public.mark_retry_resolved(
    p_service_name text,
    p_operation_type text,
    p_user_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.error_recovery_log
    SET 
        resolved = true,
        updated_at = now()
    WHERE service_name = p_service_name 
    AND operation_type = p_operation_type
    AND user_id = p_user_id
    AND resolved = false;
END;
$function$;

-- Create trigger to update updated_at columns
CREATE TRIGGER update_circuit_breaker_state_updated_at
    BEFORE UPDATE ON public.circuit_breaker_state
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_error_recovery_log_updated_at
    BEFORE UPDATE ON public.error_recovery_log
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();