-- Phase 3: Update database functions to eliminate temporary password generation
-- Remove temp_password from recover_stuck_account function
CREATE OR REPLACE FUNCTION public.recover_stuck_account(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    new_user_id UUID;
    result JSONB;
BEGIN
    -- Get the most recent incomplete signup for this email
    SELECT * INTO signup_record
    FROM public.incomplete_signups
    WHERE email = p_email 
    AND stripe_customer_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF signup_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_signup_found',
            'message', 'No incomplete signup found for this email'
        );
    END IF;
    
    -- Generate a new user ID
    new_user_id := gen_random_uuid();
    
    -- Create profile record
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        company_name,
        package_type,
        subscription_status,
        subscription_start_date,
        is_active,
        email_verified,
        signup_source,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        p_email,
        COALESCE(signup_record.full_name, ''),
        COALESCE(signup_record.company_name, ''),
        signup_record.package_type,
        'active'::subscription_status_type,
        now(),
        true,
        true,
        'manual_recovery',
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create subscriber record
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
        new_user_id,
        p_email,
        signup_record.stripe_customer_id,
        true,
        signup_record.package_type::text,
        'active'::subscription_status_type,
        now(),
        now()
    ) ON CONFLICT (email) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        subscribed = EXCLUDED.subscribed,
        subscription_tier = EXCLUDED.subscription_tier,
        subscription_status = EXCLUDED.subscription_status,
        updated_at = now();
    
    -- Mark signup as recovered
    UPDATE public.incomplete_signups
    SET 
        status = 'recovered',
        updated_at = now()
    WHERE id = signup_record.id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account recovery prepared - user must use password reset to access account',
        'user_id', new_user_id,
        'email', p_email,
        'package_type', signup_record.package_type,
        'stripe_customer_id', signup_record.stripe_customer_id,
        'requires_password_reset', true,
        'note', 'Use the Forgot Password feature to set your password'
    );
END;
$function$;

-- Remove temp_password from recover_stuck_paid_account function  
CREATE OR REPLACE FUNCTION public.recover_stuck_paid_account(p_email text, p_force_recovery boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    new_user_id UUID;
    clean_package_type package_type;
BEGIN
    RAISE LOG '[recover_stuck_paid_account] Starting recovery for email: %', p_email;
    
    -- Find incomplete signup with payment
    SELECT * INTO signup_record
    FROM public.incomplete_signups
    WHERE email = lower(trim(p_email))
    AND stripe_customer_id IS NOT NULL
    AND status IN ('pending', 'completed')
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF signup_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_paid_signup',
            'message', 'No paid signup found for this email'
        );
    END IF;
    
    -- Check if user already exists in auth (we can't query auth.users directly, but we can check profiles)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = lower(trim(p_email))) AND NOT p_force_recovery THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'user_already_exists',
            'message', 'User profile already exists. Use force_recovery=true to override.'
        );
    END IF;
    
    -- Validate and clean package type
    BEGIN
        clean_package_type := signup_record.package_type;
    EXCEPTION WHEN OTHERS THEN
        clean_package_type := 'standard'::package_type;
    END;
    
    -- Mark as recovered
    UPDATE public.incomplete_signups
    SET 
        status = 'recovered',
        updated_at = now()
    WHERE id = signup_record.id;
    
    RAISE LOG '[recover_stuck_paid_account] Marked signup as recovered for email: %', p_email;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account ready for manual auth creation - user must use password reset',
        'email', lower(trim(p_email)),
        'package_type', clean_package_type,
        'full_name', COALESCE(trim(signup_record.full_name), ''),
        'company_name', COALESCE(trim(signup_record.company_name), ''),
        'stripe_customer_id', signup_record.stripe_customer_id,
        'billing_frequency', signup_record.billing_frequency,
        'signup_id', signup_record.id,
        'requires_password_reset', true,
        'note', 'Use the Forgot Password feature to set your password'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[recover_stuck_paid_account] Exception: % - %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', 'recovery_exception',
        'message', 'Recovery failed: ' || SQLERRM
    );
END;
$function$;