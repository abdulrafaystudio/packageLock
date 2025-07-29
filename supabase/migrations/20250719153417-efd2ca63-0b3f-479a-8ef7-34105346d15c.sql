-- Fix the validation trigger to handle customer ID recovery more robustly
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
            -- Try to recover from incomplete_signups (including completed/recovered ones)
            DECLARE
                recovered_customer_id text;
            BEGIN
                SELECT stripe_customer_id INTO recovered_customer_id
                FROM public.incomplete_signups
                WHERE email = NEW.email
                AND stripe_customer_id IS NOT NULL
                AND stripe_customer_id != ''
                ORDER BY created_at DESC
                LIMIT 1;
                
                IF recovered_customer_id IS NOT NULL THEN
                    NEW.stripe_customer_id := recovered_customer_id;
                    RAISE LOG '[TRIGGER] Auto-recovered customer ID for %: %', NEW.email, recovered_customer_id;
                ELSE
                    -- If no customer ID found in incomplete_signups, allow creation for manual recovery scenarios
                    -- The edge functions will handle creating Stripe customers when needed
                    RAISE LOG '[TRIGGER] No customer ID found for % - allowing creation for manual recovery', NEW.email;
                END IF;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;