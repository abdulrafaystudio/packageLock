-- Fix complete_paid_signup to NOT create database records, only mark signup as completed
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
BEGIN
    -- Get the incomplete signup record
    SELECT * INTO signup_record
    FROM public.incomplete_signups
    WHERE email = p_email AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF signup_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_pending_signup',
            'message', 'No pending signup found for this email'
        );
    END IF;
    
    -- Generate a temporary password
    temp_password := 'TempPass' || floor(random() * 100000)::text || '!';
    
    -- Mark signup as completed - webhook will handle the rest
    UPDATE public.incomplete_signups
    SET 
        status = 'completed',
        stripe_customer_id = p_stripe_customer_id,
        updated_at = now()
    WHERE id = signup_record.id;
    
    -- Return data for webhook to use for account creation
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paid signup marked as completed',
        'package_type', signup_record.package_type,
        'billing_frequency', signup_record.billing_frequency,
        'temp_password', temp_password,
        'full_name', COALESCE(p_full_name, signup_record.full_name, ''),
        'company_name', COALESCE(p_company_name, signup_record.company_name, ''),
        'email', p_email,
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id,
        'subscription_tier', p_subscription_tier,
        'requires_auth_creation', true
    );
END;
$$;