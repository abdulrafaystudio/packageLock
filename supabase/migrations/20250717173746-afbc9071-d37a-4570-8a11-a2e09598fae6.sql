-- Create comprehensive system for managing Stripe Customer IDs

-- 1. Create function to ensure stripe_customer_id is always populated
CREATE OR REPLACE FUNCTION public.ensure_stripe_customer_id(p_user_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    customer_id text;
    subscriber_record public.subscribers%ROWTYPE;
    signup_record public.incomplete_signups%ROWTYPE;
BEGIN
    -- Get subscriber record
    SELECT * INTO subscriber_record
    FROM public.subscribers
    WHERE user_id = p_user_id OR email = p_email;
    
    -- If subscriber has customer_id, return it
    IF subscriber_record.stripe_customer_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'stripe_customer_id', subscriber_record.stripe_customer_id,
            'source', 'existing_subscriber'
        );
    END IF;
    
    -- Try to get customer_id from incomplete_signups
    SELECT * INTO signup_record
    FROM public.incomplete_signups
    WHERE email = p_email 
    AND stripe_customer_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF signup_record.stripe_customer_id IS NOT NULL THEN
        -- Update subscriber with found customer_id
        UPDATE public.subscribers
        SET 
            stripe_customer_id = signup_record.stripe_customer_id,
            updated_at = now()
        WHERE user_id = p_user_id OR email = p_email;
        
        RETURN jsonb_build_object(
            'success', true,
            'stripe_customer_id', signup_record.stripe_customer_id,
            'source', 'recovered_from_signup'
        );
    END IF;
    
    -- No customer_id found
    RETURN jsonb_build_object(
        'success', false,
        'error', 'no_customer_id_found',
        'user_id', p_user_id,
        'email', p_email
    );
END;
$function$;

-- 2. Create function to safely save stripe_customer_id with retries
CREATE OR REPLACE FUNCTION public.safe_save_stripe_customer_id(
    p_user_id uuid, 
    p_email text, 
    p_stripe_customer_id text,
    p_subscription_tier text DEFAULT NULL,
    p_subscription_status subscription_status_type DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    operation_success boolean := false;
    error_message text;
BEGIN
    -- Try to upsert subscriber record
    BEGIN
        INSERT INTO public.subscribers (
            user_id,
            email,
            stripe_customer_id,
            subscribed,
            subscription_tier,
            subscription_status,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_email,
            p_stripe_customer_id,
            true,
            p_subscription_tier,
            p_subscription_status,
            now(),
            now()
        ) ON CONFLICT (email) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            stripe_customer_id = EXCLUDED.stripe_customer_id,
            subscribed = EXCLUDED.subscribed,
            subscription_tier = EXCLUDED.subscription_tier,
            subscription_status = EXCLUDED.subscription_status,
            updated_at = now();
        
        operation_success := true;
        
    EXCEPTION WHEN OTHERS THEN
        error_message := SQLERRM;
        
        -- Fallback: Try update only
        BEGIN
            UPDATE public.subscribers
            SET 
                stripe_customer_id = p_stripe_customer_id,
                subscription_tier = COALESCE(p_subscription_tier, subscription_tier),
                subscription_status = p_subscription_status,
                updated_at = now()
            WHERE email = p_email;
            
            IF FOUND THEN
                operation_success := true;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_message := error_message || ' | Fallback failed: ' || SQLERRM;
        END;
    END;
    
    -- Also update profiles table
    IF operation_success THEN
        UPDATE public.profiles
        SET updated_at = now()
        WHERE id = p_user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', operation_success,
        'error_message', error_message,
        'stripe_customer_id', p_stripe_customer_id
    );
END;
$function$;

-- 3. Create recovery function for missing customer IDs
CREATE OR REPLACE FUNCTION public.recover_missing_stripe_customer_ids()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    recovery_count integer := 0;
    missing_record RECORD;
BEGIN
    -- Find subscribers without stripe_customer_id who have it in incomplete_signups
    FOR missing_record IN 
        SELECT DISTINCT 
            s.user_id,
            s.email,
            i.stripe_customer_id
        FROM public.subscribers s
        LEFT JOIN public.incomplete_signups i ON s.email = i.email
        WHERE s.stripe_customer_id IS NULL 
        AND i.stripe_customer_id IS NOT NULL
        AND s.subscribed = true
    LOOP
        UPDATE public.subscribers
        SET 
            stripe_customer_id = missing_record.stripe_customer_id,
            updated_at = now()
        WHERE user_id = missing_record.user_id;
        
        recovery_count := recovery_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'recovered_count', recovery_count
    );
END;
$function$;

-- 4. Add constraint to ensure paid subscribers have customer_id (with grace period)
-- Note: We add this as a function that can be called to validate, not as a constraint
-- to avoid blocking operations during the transition period
CREATE OR REPLACE FUNCTION public.validate_paid_subscribers_have_customer_id()
RETURNS TABLE(user_id uuid, email text, issue text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        s.user_id,
        s.email,
        'missing_stripe_customer_id'::text as issue
    FROM public.subscribers s
    WHERE s.subscribed = true 
    AND s.stripe_customer_id IS NULL
    AND s.created_at < now() - INTERVAL '1 hour'; -- Grace period for new signups
END;
$function$;

-- 5. Create index for faster stripe_customer_id lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id 
ON public.subscribers(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- 6. Create index for incomplete_signups customer_id recovery
CREATE INDEX IF NOT EXISTS idx_incomplete_signups_customer_recovery 
ON public.incomplete_signups(email, stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;