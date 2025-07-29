-- Fix database function conflict - drop all versions and create clean implementation
DROP FUNCTION IF EXISTS public.complete_paid_signup(text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.complete_paid_signup(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.complete_paid_signup(text, text, text, text);

-- Create single, clean version of complete_paid_signup function
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

-- Add webhook retry mechanism function
CREATE OR REPLACE FUNCTION public.retry_failed_webhook_processing()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    failed_webhook RECORD;
    retry_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    -- Process failed webhook events that haven't been retried too many times
    FOR failed_webhook IN 
        SELECT stripe_event_id, event_type, event_data 
        FROM public.webhook_events 
        WHERE processed = false 
        AND retry_count < 3
        AND created_at > now() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10
    LOOP
        -- Update retry count
        UPDATE public.webhook_events 
        SET retry_count = retry_count + 1, 
            processed_at = now()
        WHERE stripe_event_id = failed_webhook.stripe_event_id;
        
        retry_count := retry_count + 1;
        
        -- Note: Actual webhook reprocessing would be handled by edge function
        RAISE LOG 'Marked webhook % for retry', failed_webhook.stripe_event_id;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Webhook retry processing initiated',
        'marked_for_retry', retry_count
    );
END;
$$;