-- Phase 1: Enhanced complete_paid_signup function with better error handling and validation
CREATE OR REPLACE FUNCTION public.complete_paid_signup(
    p_email text, 
    p_stripe_customer_id text, 
    p_stripe_subscription_id text, 
    p_subscription_tier text,
    p_full_name text DEFAULT NULL,
    p_company_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    temp_password TEXT;
    clean_package_type package_type;
BEGIN
    -- Enhanced logging
    RAISE LOG '[complete_paid_signup] Starting for email: %', p_email;
    
    -- Get the incomplete signup record with better validation
    SELECT * INTO signup_record
    FROM public.incomplete_signups
    WHERE email = lower(trim(p_email)) 
    AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF signup_record.id IS NULL THEN
        RAISE LOG '[complete_paid_signup] No pending signup found for email: %', p_email;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_pending_signup',
            'message', 'No pending signup found for this email',
            'email', p_email
        );
    END IF;
    
    -- Validate package type conversion
    BEGIN
        clean_package_type := signup_record.package_type;
        RAISE LOG '[complete_paid_signup] Package type validation successful: %', clean_package_type;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG '[complete_paid_signup] Package type validation failed: %, defaulting to standard', signup_record.package_type;
        clean_package_type := 'standard'::package_type;
    END;
    
    -- Generate a secure temporary password (12+ chars, mixed case, numbers, symbols)
    temp_password := 'TempPass' || floor(random() * 900000 + 100000)::text || '!' || upper(chr(65 + floor(random() * 26)::int));
    
    RAISE LOG '[complete_paid_signup] Generated temp password for email: % (length: %)', p_email, length(temp_password);
    
    -- Mark signup as completed with atomic update
    UPDATE public.incomplete_signups
    SET 
        status = 'completed',
        stripe_customer_id = p_stripe_customer_id,
        updated_at = now()
    WHERE id = signup_record.id;
    
    IF NOT FOUND THEN
        RAISE LOG '[complete_paid_signup] Failed to update signup record for email: %', p_email;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'update_failed',
            'message', 'Failed to update signup record'
        );
    END IF;
    
    RAISE LOG '[complete_paid_signup] Successfully completed for email: %', p_email;
    
    -- Return comprehensive data for webhook processing
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paid signup marked as completed - ready for auth creation',
        'package_type', clean_package_type,
        'billing_frequency', signup_record.billing_frequency,
        'temp_password', temp_password,
        'full_name', COALESCE(trim(p_full_name), trim(signup_record.full_name), ''),
        'company_name', COALESCE(trim(p_company_name), trim(signup_record.company_name), ''),
        'email', lower(trim(p_email)),
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id,
        'subscription_tier', p_subscription_tier,
        'requires_auth_creation', true,
        'signup_id', signup_record.id
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[complete_paid_signup] Exception occurred: % - %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', 'function_exception',
        'message', 'Database function error: ' || SQLERRM,
        'sqlstate', SQLSTATE
    );
END;
$$;

-- Enhanced manual recovery function for stuck accounts
CREATE OR REPLACE FUNCTION public.recover_stuck_paid_account(
    p_email text,
    p_force_recovery boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    temp_password TEXT;
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
    
    -- Generate secure temp password
    temp_password := 'Recovery' || floor(random() * 900000 + 100000)::text || '!' || upper(chr(65 + floor(random() * 26)::int));
    
    -- Mark as recovered
    UPDATE public.incomplete_signups
    SET 
        status = 'recovered',
        updated_at = now()
    WHERE id = signup_record.id;
    
    RAISE LOG '[recover_stuck_paid_account] Marked signup as recovered for email: %', p_email;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account ready for manual auth creation',
        'email', lower(trim(p_email)),
        'package_type', clean_package_type,
        'temp_password', temp_password,
        'full_name', COALESCE(trim(signup_record.full_name), ''),
        'company_name', COALESCE(trim(signup_record.company_name), ''),
        'stripe_customer_id', signup_record.stripe_customer_id,
        'billing_frequency', signup_record.billing_frequency,
        'signup_id', signup_record.id,
        'requires_manual_auth_creation', true
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[recover_stuck_paid_account] Exception: % - %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', 'recovery_exception',
        'message', 'Recovery failed: ' || SQLERRM
    );
END;
$$;