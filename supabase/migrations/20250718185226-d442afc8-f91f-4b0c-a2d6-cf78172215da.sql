-- Phase 2: Data Synchronization Improvements
-- Add function to sync profiles and subscribers data
CREATE OR REPLACE FUNCTION public.sync_profile_subscriber_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sync_result jsonb;
    mismatched_count integer := 0;
    fixed_count integer := 0;
    user_record RECORD;
BEGIN
    -- Find and fix mismatched subscription data between profiles and subscribers
    FOR user_record IN 
        SELECT 
            p.id as user_id,
            p.email,
            p.package_type as profile_package,
            s.subscription_tier as subscriber_tier,
            s.subscribed,
            s.subscription_status
        FROM public.profiles p
        LEFT JOIN public.subscribers s ON p.id = s.user_id
        WHERE (
            p.package_type::text != COALESCE(s.subscription_tier, 'free') OR
            s.subscription_tier IS NULL
        )
    LOOP
        mismatched_count := mismatched_count + 1;
        
        -- Update profiles to match subscribers (subscribers is source of truth)
        IF user_record.subscriber_tier IS NOT NULL THEN
            UPDATE public.profiles
            SET 
                package_type = user_record.subscriber_tier::package_type,
                subscription_status = user_record.subscription_status,
                updated_at = now()
            WHERE id = user_record.user_id;
            
            fixed_count := fixed_count + 1;
            
            RAISE LOG '[SYNC] Fixed profile for user %: % -> %', 
                user_record.email, 
                user_record.profile_package, 
                user_record.subscriber_tier;
        END IF;
    END LOOP;
    
    sync_result := jsonb_build_object(
        'success', true,
        'mismatched_found', mismatched_count,
        'profiles_fixed', fixed_count,
        'timestamp', now()
    );
    
    RETURN sync_result;
END;
$$;

-- Add validation function to check data consistency
CREATE OR REPLACE FUNCTION public.validate_subscription_consistency()
RETURNS TABLE(
    user_id uuid,
    email text,
    issue_type text,
    profile_data jsonb,
    subscriber_data jsonb,
    recommended_action text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Find users with subscription data mismatch
    SELECT 
        p.id,
        p.email,
        'subscription_tier_mismatch'::text,
        jsonb_build_object(
            'package_type', p.package_type,
            'subscription_status', p.subscription_status
        ),
        jsonb_build_object(
            'subscription_tier', s.subscription_tier,
            'subscribed', s.subscribed,
            'subscription_status', s.subscription_status
        ),
        'sync_from_subscribers_table'::text
    FROM public.profiles p
    LEFT JOIN public.subscribers s ON p.id = s.user_id
    WHERE p.package_type::text != COALESCE(s.subscription_tier, 'free')
       OR (s.subscription_tier IS NOT NULL AND p.subscription_status != s.subscription_status);
       
    RETURN QUERY
    -- Find paid subscribers without customer IDs
    SELECT 
        s.user_id,
        s.email,
        'missing_stripe_customer_id'::text,
        NULL::jsonb,
        jsonb_build_object(
            'subscription_tier', s.subscription_tier,
            'subscribed', s.subscribed,
            'stripe_customer_id', s.stripe_customer_id
        ),
        'recover_customer_id'::text
    FROM public.subscribers s
    WHERE s.subscribed = true 
      AND s.subscription_tier NOT IN ('free', 'freepro')
      AND (s.stripe_customer_id IS NULL OR s.stripe_customer_id = '');
END;
$$;