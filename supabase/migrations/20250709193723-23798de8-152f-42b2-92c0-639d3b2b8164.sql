-- Final cleanup: Remove function signature ambiguity for complete_paid_signup
-- Drop ALL possible versions to ensure clean state
DROP FUNCTION IF EXISTS public.complete_paid_signup(text, text, text, text);
DROP FUNCTION IF EXISTS public.complete_paid_signup(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.complete_paid_signup(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.complete_paid_signup(text, text, text, text, text, text, text);

-- Recreate ONLY the definitive version with password parameter (6 parameters total)
CREATE OR REPLACE FUNCTION public.complete_paid_signup(
    p_email text, 
    p_stripe_customer_id text, 
    p_stripe_subscription_id text, 
    p_subscription_tier text,
    p_full_name text DEFAULT '',
    p_company_name text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    temp_password TEXT;
    clean_package_type package_type;
BEGIN
    RAISE LOG '[complete_paid_signup] FINAL VERSION - Starting for email: %', p_email;
    
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
    
    -- Validate package type
    BEGIN
        clean_package_type := signup_record.package_type;
        RAISE LOG '[complete_paid_signup] Package type validated: %', clean_package_type;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG '[complete_paid_signup] Package type validation failed, defaulting to standard: %', SQLERRM;
        clean_package_type := 'standard'::package_type;
    END;
    
    -- Generate secure temporary password
    temp_password := 'SecurePass' || floor(random() * 900000 + 100000)::text || '!' || upper(chr(65 + floor(random() * 26)::int));
    
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
    
    -- Return comprehensive data for auth creation
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paid signup completed successfully - ready for auth creation',
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
        'signup_id', signup_record.id,
        'function_version', 'final_no_ambiguity_v1'
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

-- Add comment for documentation
COMMENT ON FUNCTION public.complete_paid_signup(text, text, text, text, text, text) IS 
'Final version of complete_paid_signup function with no signature ambiguity. Processes successful Stripe payments and prepares account data for auth user creation.';