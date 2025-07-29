
-- Phase 1: Add password storage to incomplete_signups table
ALTER TABLE public.incomplete_signups 
ADD COLUMN password_hash TEXT;

-- Update create_incomplete_signup function to accept and store password hash
CREATE OR REPLACE FUNCTION public.create_incomplete_signup(
    p_email text, 
    p_full_name text, 
    p_package_type package_type, 
    p_billing_frequency text, 
    p_company_name text DEFAULT NULL::text, 
    p_stripe_session_id text DEFAULT NULL::text,
    p_password_hash text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    signup_id UUID;
BEGIN
    INSERT INTO public.incomplete_signups (
        email,
        full_name,
        company_name,
        package_type,
        billing_frequency,
        stripe_session_id,
        password_hash,
        status,
        expires_at
    ) VALUES (
        p_email,
        p_full_name,
        p_company_name,
        p_package_type,
        p_billing_frequency,
        p_stripe_session_id,
        p_password_hash,
        'pending',
        now() + INTERVAL '24 hours'
    ) RETURNING id INTO signup_id;
    
    RETURN signup_id;
END;
$function$;

-- Update complete_paid_signup function to return the stored password instead of generating random ones
CREATE OR REPLACE FUNCTION public.complete_paid_signup(
    p_email text, 
    p_stripe_customer_id text, 
    p_stripe_subscription_id text, 
    p_subscription_tier text, 
    p_full_name text DEFAULT ''::text, 
    p_company_name text DEFAULT ''::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    clean_package_type package_type;
BEGIN
    RAISE LOG '[complete_paid_signup] DEFINITIVE VERSION - Starting for email: %', p_email;
    
    -- Get the incomplete signup record
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
    
    -- Check if password was stored
    IF signup_record.password_hash IS NULL THEN
        RAISE LOG '[complete_paid_signup] No password hash found for email: %', p_email;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_password_hash',
            'message', 'No password found for this signup - contact support',
            'email', p_email
        );
    END IF;
    
    -- Validate package type with enhanced error handling
    BEGIN
        clean_package_type := signup_record.package_type;
        RAISE LOG '[complete_paid_signup] Package type validated: %', clean_package_type;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG '[complete_paid_signup] Package type validation failed, defaulting to standard: %', SQLERRM;
        clean_package_type := 'standard'::package_type;
    END;
    
    -- Atomic update of signup record
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
    
    RAISE LOG '[complete_paid_signup] SUCCESSFULLY completed for email: %', p_email;
    
    -- Return comprehensive data for auth creation with the stored password
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paid signup completed successfully - ready for auth creation',
        'package_type', clean_package_type,
        'billing_frequency', signup_record.billing_frequency,
        'stored_password', signup_record.password_hash,  -- Return the stored password hash
        'full_name', COALESCE(trim(p_full_name), trim(signup_record.full_name), ''),
        'company_name', COALESCE(trim(p_company_name), trim(signup_record.company_name), ''),
        'email', lower(trim(p_email)),
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id,
        'subscription_tier', p_subscription_tier,
        'requires_auth_creation', true,
        'signup_id', signup_record.id,
        'function_version', 'definitive_v2_with_password'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[complete_paid_signup] CRITICAL EXCEPTION: % - %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', 'function_exception',
        'message', 'Database function error: ' || SQLERRM,
        'sqlstate', SQLSTATE
    );
END;
$function$;
