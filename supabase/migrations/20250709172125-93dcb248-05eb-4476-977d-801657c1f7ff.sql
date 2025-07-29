-- Phase 2: Update database schema and functions for raw password storage

-- Step 1: Rename password_hash column to password in incomplete_signups table
ALTER TABLE public.incomplete_signups 
RENAME COLUMN password_hash TO password;

-- Step 2: Drop existing create_incomplete_signup function and recreate with raw passwords
DROP FUNCTION IF EXISTS public.create_incomplete_signup(text,text,package_type,text,text,text,text);

CREATE OR REPLACE FUNCTION public.create_incomplete_signup(
    p_email text, 
    p_full_name text, 
    p_package_type package_type, 
    p_billing_frequency text, 
    p_company_name text DEFAULT NULL::text, 
    p_stripe_session_id text DEFAULT NULL::text, 
    p_password text DEFAULT NULL::text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        password,
        status,
        expires_at
    ) VALUES (
        p_email,
        p_full_name,
        p_company_name,
        p_package_type,
        p_billing_frequency,
        p_stripe_session_id,
        p_password,
        'pending',
        now() + INTERVAL '24 hours'
    ) RETURNING id INTO signup_id;
    
    RETURN signup_id;
END;
$$;

-- Step 3: Update complete_paid_signup function to work with raw passwords
CREATE OR REPLACE FUNCTION public.complete_paid_signup(
    p_email text, 
    p_stripe_customer_id text, 
    p_stripe_subscription_id text, 
    p_subscription_tier text,
    p_full_name text DEFAULT NULL,
    p_company_name text DEFAULT NULL,
    p_password text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    clean_package_type package_type;
BEGIN
    RAISE LOG '[complete_paid_signup] Starting for email: %', p_email;
    
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
    IF signup_record.password IS NULL THEN
        RAISE LOG '[complete_paid_signup] No password found for email: %', p_email;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_password',
            'message', 'No password found for this signup - contact support',
            'email', p_email
        );
    END IF;
    
    -- Validate package type
    BEGIN
        clean_package_type := signup_record.package_type;
        RAISE LOG '[complete_paid_signup] Package type validated: %', clean_package_type;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG '[complete_paid_signup] Package type validation failed, defaulting to standard: %', SQLERRM;
        clean_package_type := 'standard'::package_type;
    END;
    
    -- Update signup record as completed
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
    
    -- Return comprehensive data for auth creation with the stored password
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paid signup completed successfully - ready for auth creation',
        'package_type', clean_package_type,
        'billing_frequency', signup_record.billing_frequency,
        'stored_password', signup_record.password,
        'full_name', COALESCE(trim(p_full_name), trim(signup_record.full_name), ''),
        'company_name', COALESCE(trim(p_company_name), trim(signup_record.company_name), ''),
        'email', lower(trim(p_email)),
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id,
        'subscription_tier', p_subscription_tier,
        'requires_auth_creation', true,
        'signup_id', signup_record.id,
        'function_version', 'raw_password_v1'
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
$$;

-- Step 4: Add cleanup function for expired records with raw passwords (security measure)
CREATE OR REPLACE FUNCTION public.cleanup_expired_incomplete_signups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete expired incomplete signups to remove stored raw passwords
    DELETE FROM public.incomplete_signups
    WHERE expires_at < now()
    AND status = 'pending';
    
    RAISE LOG '[cleanup_expired_incomplete_signups] Cleaned up expired incomplete signups';
END;
$$;