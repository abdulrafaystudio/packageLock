
-- Phase 1: Create helper function for just-in-time Stripe customer creation
CREATE OR REPLACE FUNCTION public.create_stripe_customer_for_upgrade(
    p_email text,
    p_full_name text DEFAULT '',
    p_company_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function prepares data for Stripe customer creation
    -- The actual Stripe API call will be made in the edge function
    RETURN jsonb_build_object(
        'success', true,
        'email', lower(trim(p_email)),
        'full_name', COALESCE(trim(p_full_name), ''),
        'company_name', COALESCE(trim(p_company_name), ''),
        'requires_stripe_creation', true,
        'timestamp', now()
    );
END;
$$;

-- Phase 2: Update validate_upgrade_prerequisites to handle just-in-time customer creation
CREATE OR REPLACE FUNCTION public.validate_upgrade_prerequisites(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscriber_record public.subscribers%ROWTYPE;
    profile_record public.profiles%ROWTYPE;
    customer_id text;
    validation_result jsonb;
BEGIN
    -- Get subscriber record
    SELECT * INTO subscriber_record
    FROM public.subscribers
    WHERE email = p_email;
    
    IF subscriber_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'no_subscriber_record',
            'message', 'No subscriber record found'
        );
    END IF;
    
    -- Get profile for additional user info
    SELECT * INTO profile_record
    FROM public.profiles
    WHERE email = p_email;
    
    -- Check for existing customer ID
    customer_id := subscriber_record.stripe_customer_id;
    
    -- If missing, try to recover from incomplete_signups first
    IF customer_id IS NULL OR customer_id = '' THEN
        SELECT stripe_customer_id INTO customer_id
        FROM public.incomplete_signups
        WHERE email = p_email
        AND stripe_customer_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- If found in incomplete_signups, update subscriber record
        IF customer_id IS NOT NULL THEN
            UPDATE public.subscribers
            SET 
                stripe_customer_id = customer_id,
                updated_at = now()
            WHERE email = p_email;
            
            RETURN jsonb_build_object(
                'valid', true,
                'recovered', true,
                'customer_id', customer_id,
                'message', 'Customer ID recovered from incomplete signups'
            );
        END IF;
        
        -- No existing customer found - prepare for just-in-time creation
        RETURN jsonb_build_object(
            'valid', true,
            'requires_customer_creation', true,
            'customer_data', jsonb_build_object(
                'email', p_email,
                'full_name', COALESCE(profile_record.full_name, ''),
                'company_name', COALESCE(profile_record.company_name, '')
            ),
            'message', 'Customer creation required for upgrade'
        );
    END IF;
    
    -- Customer ID exists - all validations passed
    RETURN jsonb_build_object(
        'valid', true,
        'customer_id', customer_id,
        'message', 'Upgrade prerequisites validated'
    );
END;
$$;

-- Phase 3: Create function to save newly created Stripe customer ID
CREATE OR REPLACE FUNCTION public.save_just_in_time_customer_id(
    p_email text,
    p_stripe_customer_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    operation_success boolean := false;
BEGIN
    -- Update subscriber record with new customer ID
    UPDATE public.subscribers
    SET 
        stripe_customer_id = p_stripe_customer_id,
        updated_at = now()
    WHERE email = p_email;
    
    IF FOUND THEN
        operation_success := true;
        
        -- Log the just-in-time customer creation
        INSERT INTO public.subscription_audit (
            user_id,
            action_type,
            new_values,
            source
        ) VALUES (
            (SELECT user_id FROM public.subscribers WHERE email = p_email),
            'just_in_time_customer_creation',
            jsonb_build_object(
                'email', p_email,
                'stripe_customer_id', p_stripe_customer_id,
                'created_at', now()
            ),
            'upgrade_flow'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', operation_success,
        'stripe_customer_id', p_stripe_customer_id,
        'message', CASE 
            WHEN operation_success THEN 'Customer ID saved successfully'
            ELSE 'Failed to save customer ID'
        END
    );
END;
$$;
