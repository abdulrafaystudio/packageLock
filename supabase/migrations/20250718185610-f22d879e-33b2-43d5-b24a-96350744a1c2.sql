-- Fix the sync function to handle customer ID validation properly
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
            s.subscription_status,
            s.stripe_customer_id
        FROM public.profiles p
        LEFT JOIN public.subscribers s ON p.id = s.user_id
        WHERE (
            p.package_type::text != COALESCE(s.subscription_tier, 'free') OR
            s.subscription_tier IS NULL
        )
    LOOP
        mismatched_count := mismatched_count + 1;
        
        -- Only update profiles to match free tiers or when we have proper customer data
        IF user_record.subscriber_tier IS NOT NULL THEN
            -- For free tiers or when we have customer ID, update profiles
            IF user_record.subscriber_tier IN ('free', 'freepro') OR 
               (user_record.stripe_customer_id IS NOT NULL AND user_record.stripe_customer_id != '') THEN
                
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
            ELSE
                RAISE LOG '[SYNC] Skipped user % - missing customer ID for paid tier %', 
                    user_record.email, 
                    user_record.subscriber_tier;
            END IF;
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