-- Update complete_paid_signup to properly signal auth creation requirement
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
    temp_password TEXT;
    result JSONB;
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
    
    -- Generate a temporary password if not provided
    temp_password := COALESCE(p_password, encode(gen_random_bytes(16), 'base64'));
    
    -- Mark signup as completed
    UPDATE public.incomplete_signups
    SET 
        status = 'completed',
        stripe_customer_id = p_stripe_customer_id,
        updated_at = now()
    WHERE id = signup_record.id;
    
    -- Return success with auth creation flag
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paid signup completed successfully',
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