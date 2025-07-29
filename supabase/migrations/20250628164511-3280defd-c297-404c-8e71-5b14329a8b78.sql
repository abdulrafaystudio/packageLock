
-- Fixed Phase 1: Critical Database Fixes

-- 1. Create the missing get_stripe_price_id function that's blocking paid subscriptions
CREATE OR REPLACE FUNCTION public.get_stripe_price_id(
    p_package_type package_type,
    p_billing_frequency TEXT
)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT stripe_price_id 
    FROM public.subscription_plans 
    WHERE package_type = p_package_type 
    AND billing_frequency = p_billing_frequency 
    AND is_active = true
    LIMIT 1;
$$;

-- 2. Ensure incomplete_signups table has proper structure for the paid signup flow
ALTER TABLE public.incomplete_signups 
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'web_form';

-- 3. Create indexes for better performance on critical lookup operations
CREATE INDEX IF NOT EXISTS idx_incomplete_signups_status_expires ON public.incomplete_signups(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_lookup ON public.subscription_plans(package_type, billing_frequency, is_active);

-- 4. Add function to properly handle paid signup flow (fixed parameter order)
CREATE OR REPLACE FUNCTION public.create_incomplete_signup(
    p_email TEXT,
    p_full_name TEXT,
    p_package_type package_type,
    p_billing_frequency TEXT,
    p_company_name TEXT DEFAULT NULL,
    p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS UUID
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
        status,
        expires_at
    ) VALUES (
        p_email,
        p_full_name,
        p_company_name,
        p_package_type,
        p_billing_frequency,
        p_stripe_session_id,
        'pending',
        now() + INTERVAL '24 hours'
    ) RETURNING id INTO signup_id;
    
    RETURN signup_id;
END;
$$;

-- 5. Function to complete paid signup after successful payment
CREATE OR REPLACE FUNCTION public.complete_paid_signup(
    p_email TEXT,
    p_stripe_customer_id TEXT,
    p_stripe_subscription_id TEXT,
    p_subscription_tier TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signup_record public.incomplete_signups%ROWTYPE;
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
    
    -- Mark signup as completed
    UPDATE public.incomplete_signups
    SET 
        status = 'completed',
        stripe_customer_id = p_stripe_customer_id,
        updated_at = now()
    WHERE id = signup_record.id;
    
    -- Create subscriber record
    INSERT INTO public.subscribers (
        email,
        stripe_customer_id,
        subscribed,
        subscription_tier,
        subscription_status,
        stripe_subscription_id,
        created_at,
        updated_at
    ) VALUES (
        p_email,
        p_stripe_customer_id,
        true,
        p_subscription_tier,
        'active',
        p_stripe_subscription_id,
        now(),
        now()
    ) ON CONFLICT (email) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        subscribed = EXCLUDED.subscribed,
        subscription_tier = EXCLUDED.subscription_tier,
        subscription_status = EXCLUDED.subscription_status,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        updated_at = now();
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paid signup completed successfully',
        'package_type', signup_record.package_type,
        'billing_frequency', signup_record.billing_frequency
    );
END;
$$;
