-- Create a recovery function to fix the stuck accounts
CREATE OR REPLACE FUNCTION public.recover_stuck_account(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
    new_user_id UUID;
    temp_password TEXT;
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
    
    -- Generate a new user ID and temp password
    new_user_id := gen_random_uuid();
    temp_password := encode(gen_random_bytes(16), 'hex');
    
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
        'message', 'Account recovery prepared - auth user needs to be created manually',
        'user_id', new_user_id,
        'email', p_email,
        'package_type', signup_record.package_type,
        'temp_password', temp_password,
        'stripe_customer_id', signup_record.stripe_customer_id,
        'note', 'Use the temp_password to create auth user via Supabase Admin API'
    );
END;
$$;