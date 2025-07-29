
-- Add missing stripe_subscription_id recovery and validation
CREATE OR REPLACE FUNCTION public.enhancedSafeSaveStripeCustomerId(
    p_user_id uuid,
    p_email text,
    p_stripe_customer_id text,
    p_package_type text,
    p_subscription_status text,
    p_subscription_end text,
    p_stripe_subscription_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    operation_success boolean := false;
    error_message text;
BEGIN
    -- Enhanced upsert with subscription ID
    BEGIN
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
            p_user_id,
            p_email,
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
    
    -- Update profiles table immediately for instant display
    IF operation_success THEN
        UPDATE public.profiles
        SET 
            package_type = p_package_type::package_type,
            subscription_status = p_subscription_status::subscription_status_type,
            subscription_end_date = CASE WHEN p_subscription_end IS NOT NULL THEN p_subscription_end::timestamptz ELSE NULL END,
            updated_at = now()
        WHERE id = p_user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', operation_success,
        'error_message', error_message,
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id
    );
END;
$$;

-- Add immediate profile sync trigger for real-time updates
CREATE OR REPLACE FUNCTION public.sync_profile_on_subscriber_change()
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
    
    RETURN NEW;
END;
$$;

-- Create trigger for immediate profile sync
DROP TRIGGER IF EXISTS trigger_sync_profile_on_subscriber_change ON public.subscribers;
CREATE TRIGGER trigger_sync_profile_on_subscriber_change
    AFTER INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_on_subscriber_change();

-- Add function to recover missing subscription IDs
CREATE OR REPLACE FUNCTION public.recover_missing_subscription_ids()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recovery_count integer := 0;
    missing_record RECORD;
BEGIN
    -- Find subscribers with customer IDs but missing subscription IDs
    FOR missing_record IN 
        SELECT 
            user_id,
            email,
            stripe_customer_id,
            subscription_tier
        FROM public.subscribers
        WHERE stripe_customer_id IS NOT NULL 
        AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '')
        AND subscribed = true
        AND subscription_tier NOT IN ('free', 'freepro')
    LOOP
        -- Log for manual Stripe API recovery
        INSERT INTO public.recovery_log (
            email,
            action_taken,
            success,
            details
        ) VALUES (
            missing_record.email,
            'missing_subscription_id_identified',
            true,
            jsonb_build_object(
                'user_id', missing_record.user_id,
                'stripe_customer_id', missing_record.stripe_customer_id,
                'subscription_tier', missing_record.subscription_tier,
                'requires_stripe_api_lookup', true
            )
        );
        
        recovery_count := recovery_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'identified_missing_ids', recovery_count,
        'message', 'Missing subscription IDs identified for manual recovery'
    );
END;
$$;
