-- 1. Create real-time database triggers for immediate profile updates
CREATE OR REPLACE FUNCTION public.trigger_immediate_profile_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Immediately sync profile when subscriber data changes
    UPDATE public.profiles
    SET 
        package_type = NEW.subscription_tier::package_type,
        subscription_status = NEW.subscription_status,
        subscription_end_date = NEW.subscription_end,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Broadcast real-time update
    PERFORM pg_notify('profile_updated', json_build_object(
        'user_id', NEW.user_id,
        'package_type', NEW.subscription_tier,
        'subscription_status', NEW.subscription_status,
        'updated_at', now()
    )::text);
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS immediate_profile_sync_trigger ON public.subscribers;

-- Create trigger for immediate profile updates
CREATE TRIGGER immediate_profile_sync_trigger
    AFTER INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_immediate_profile_sync();

-- 2. Fix the enhanced safe save function to handle conflicts properly
CREATE OR REPLACE FUNCTION public.enhancedsafesavestripecustomerid(
    p_user_id uuid, 
    p_email text, 
    p_stripe_customer_id text, 
    p_package_type text, 
    p_subscription_status text, 
    p_subscription_end text, 
    p_stripe_subscription_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    operation_success boolean := false;
    error_message text;
    final_user_id uuid;
BEGIN
    -- Get user_id if not provided
    IF p_user_id IS NULL THEN
        SELECT id INTO final_user_id
        FROM public.profiles
        WHERE email = lower(trim(p_email))
        LIMIT 1;
        
        IF final_user_id IS NULL THEN
            error_message := 'No user found for email: ' || p_email;
            operation_success := false;
        ELSE
            final_user_id := p_user_id;
        END IF;
    ELSE
        final_user_id := p_user_id;
    END IF;
    
    IF final_user_id IS NOT NULL THEN
        BEGIN
            -- Use UPSERT with proper conflict handling
            INSERT INTO public.subscribers (
                user_id,
                email,
                stripe_customer_id,
                stripe_subscription_id,
                subscribed,
                subscription_tier,
                subscription_status,
                subscription_end,
                created_at,
                updated_at
            ) VALUES (
                final_user_id,
                lower(trim(p_email)),
                p_stripe_customer_id,
                p_stripe_subscription_id,
                true,
                p_package_type,
                p_subscription_status::subscription_status_type,
                CASE WHEN p_subscription_end IS NOT NULL THEN p_subscription_end::timestamptz ELSE NULL END,
                now(),
                now()
            ) ON CONFLICT (email) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                stripe_customer_id = EXCLUDED.stripe_customer_id,
                stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                subscribed = EXCLUDED.subscribed,
                subscription_tier = EXCLUDED.subscription_tier,
                subscription_status = EXCLUDED.subscription_status,
                subscription_end = EXCLUDED.subscription_end,
                updated_at = now();
            
            operation_success := true;
            
        EXCEPTION WHEN OTHERS THEN
            error_message := SQLERRM;
            operation_success := false;
        END;
    END IF;
    
    RETURN jsonb_build_object(
        'success', operation_success,
        'error_message', error_message,
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id,
        'user_id', final_user_id
    );
END;
$$;

-- 3. Create webhook retry mechanism table
CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_event_id text NOT NULL,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    next_retry_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    last_error text,
    status text DEFAULT 'pending' -- pending, processing, completed, failed
);

-- Enable RLS
ALTER TABLE public.webhook_retry_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage webhook retry queue
CREATE POLICY "service_role_webhook_retry_all" ON public.webhook_retry_queue
FOR ALL
USING (current_setting('role') = 'service_role');

-- 4. Create function for webhook retry processing
CREATE OR REPLACE FUNCTION public.process_webhook_retries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    retry_record RECORD;
    processed_count integer := 0;
BEGIN
    -- Process pending retries that are due
    FOR retry_record IN 
        SELECT * FROM public.webhook_retry_queue
        WHERE status = 'pending'
        AND next_retry_at <= now()
        AND retry_count < max_retries
        ORDER BY created_at
        LIMIT 10
    LOOP
        -- Mark as processing
        UPDATE public.webhook_retry_queue
        SET status = 'processing', retry_count = retry_count + 1
        WHERE id = retry_record.id;
        
        processed_count := processed_count + 1;
        
        -- Schedule next retry with exponential backoff
        UPDATE public.webhook_retry_queue
        SET 
            next_retry_at = now() + (power(2, retry_count) * interval '1 minute'),
            status = 'pending'
        WHERE id = retry_record.id;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', processed_count
    );
END;
$$;