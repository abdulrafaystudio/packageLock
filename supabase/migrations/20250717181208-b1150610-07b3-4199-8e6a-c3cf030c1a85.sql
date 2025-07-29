-- Phase 4: Data Consistency Guarantees
-- Create a database trigger that prevents subscribers records without stripe_customer_id for paid users

CREATE OR REPLACE FUNCTION public.validate_subscriber_customer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only enforce for paid subscriptions
    IF NEW.subscribed = true AND NEW.subscription_tier != 'free' AND NEW.subscription_tier != 'freepro' THEN
        -- Check if stripe_customer_id is missing
        IF NEW.stripe_customer_id IS NULL OR NEW.stripe_customer_id = '' THEN
            -- Try to recover from incomplete_signups
            DECLARE
                recovered_customer_id text;
            BEGIN
                SELECT stripe_customer_id INTO recovered_customer_id
                FROM public.incomplete_signups
                WHERE email = NEW.email
                AND stripe_customer_id IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 1;
                
                IF recovered_customer_id IS NOT NULL THEN
                    NEW.stripe_customer_id := recovered_customer_id;
                    RAISE LOG '[TRIGGER] Auto-recovered customer ID for %: %', NEW.email, recovered_customer_id;
                ELSE
                    RAISE EXCEPTION 'Cannot create paid subscriber without stripe_customer_id for email: %', NEW.email;
                END IF;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply trigger to subscribers table
CREATE TRIGGER validate_subscriber_customer_id_trigger
    BEFORE INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_subscriber_customer_id();

-- Phase 4: Auto-healing system for missing customer IDs
CREATE OR REPLACE FUNCTION public.auto_heal_missing_customer_ids()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    healed_count integer := 0;
    missing_record RECORD;
BEGIN
    -- Find subscribers without customer IDs who have them in incomplete_signups
    FOR missing_record IN 
        SELECT DISTINCT 
            s.user_id,
            s.email,
            i.stripe_customer_id
        FROM public.subscribers s
        LEFT JOIN public.incomplete_signups i ON s.email = i.email
        WHERE s.stripe_customer_id IS NULL 
        AND i.stripe_customer_id IS NOT NULL
        AND s.subscribed = true
        AND s.subscription_tier NOT IN ('free', 'freepro')
    LOOP
        UPDATE public.subscribers
        SET 
            stripe_customer_id = missing_record.stripe_customer_id,
            updated_at = now()
        WHERE email = missing_record.email;
        
        healed_count := healed_count + 1;
        
        RAISE LOG '[AUTO-HEAL] Recovered customer ID for %: %', missing_record.email, missing_record.stripe_customer_id;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'healed_count', healed_count,
        'timestamp', now()
    );
END;
$$;

-- Phase 5: Pre-upgrade validation function
CREATE OR REPLACE FUNCTION public.validate_upgrade_prerequisites(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscriber_record public.subscribers%ROWTYPE;
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
    
    -- Check for customer ID
    customer_id := subscriber_record.stripe_customer_id;
    
    -- If missing, try to recover it
    IF customer_id IS NULL OR customer_id = '' THEN
        SELECT stripe_customer_id INTO customer_id
        FROM public.incomplete_signups
        WHERE email = p_email
        AND stripe_customer_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- If found, update the subscriber record
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
        ELSE
            RETURN jsonb_build_object(
                'valid', false,
                'error', 'no_customer_id',
                'message', 'No stripe_customer_id found for this user'
            );
        END IF;
    END IF;
    
    -- All validations passed
    RETURN jsonb_build_object(
        'valid', true,
        'customer_id', customer_id,
        'message', 'Upgrade prerequisites validated'
    );
END;
$$;