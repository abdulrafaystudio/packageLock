
-- Fix the enhanced transaction function to properly update profiles table
CREATE OR REPLACE FUNCTION public.enhancedsafesavestripecustomerid(
    p_user_id uuid, 
    p_email text, 
    p_stripe_customer_id text, 
    p_package_type text, 
    p_subscription_status text, 
    p_subscription_end text, 
    p_stripe_subscription_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    operation_success boolean := false;
    error_message text;
    final_user_id uuid;
    calculated_end_date timestamptz;
    clean_package_type package_type;
BEGIN
    -- Get user_id if not provided
    IF p_user_id IS NULL THEN
        SELECT id INTO final_user_id
        FROM public.profiles
        WHERE email = lower(trim(p_email))
        LIMIT 1;
        
        IF final_user_id IS NULL THEN
            error_message := 'No user found for email: ' || p_email;
            operation_success := false;
            final_user_id := p_user_id;
        END IF;
    ELSE
        final_user_id := p_user_id;
    END IF;
    
    -- Calculate subscription end date
    IF p_subscription_end IS NOT NULL AND p_subscription_end != '' THEN
        calculated_end_date := p_subscription_end::timestamptz;
    ELSE
        calculated_end_date := now() + interval '1 year';
    END IF;
    
    -- Validate package type
    BEGIN
        clean_package_type := p_package_type::package_type;
    EXCEPTION WHEN OTHERS THEN
        clean_package_type := 'standard'::package_type;
    END;
    
    IF final_user_id IS NOT NULL THEN
        BEGIN
            -- Update subscribers table (this will trigger the sync trigger)
            INSERT INTO public.subscribers (
                user_id,
                email,
                stripe_customer_id,
                stripe_subscription_id,
                subscribed,
                subscription_tier,
                subscription_status,
                subscription_end,
                created_at,
                updated_at
            ) VALUES (
                final_user_id,
                lower(trim(p_email)),
                p_stripe_customer_id,
                p_stripe_subscription_id,
                true,
                p_package_type,
                p_subscription_status::subscription_status_type,
                calculated_end_date,
                now(),
                now()
            ) ON CONFLICT (email) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                stripe_customer_id = EXCLUDED.stripe_customer_id,
                stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                subscribed = EXCLUDED.subscribed,
                subscription_tier = EXCLUDED.subscription_tier,
                subscription_status = EXCLUDED.subscription_status,
                subscription_end = EXCLUDED.subscription_end,
                updated_at = now();
            
            -- CRITICAL: Also directly update profiles table as backup
            UPDATE public.profiles
            SET 
                package_type = clean_package_type,
                subscription_status = p_subscription_status::subscription_status_type,
                subscription_end_date = calculated_end_date,
                updated_at = now()
            WHERE id = final_user_id;
            
            operation_success := true;
            
            -- Log successful upgrade
            INSERT INTO public.subscription_events (
                user_id,
                event_type,
                metadata
            ) VALUES (
                final_user_id,
                'upgrade_webhook_processed',
                jsonb_build_object(
                    'package_type', p_package_type,
                    'subscription_id', p_stripe_subscription_id,
                    'customer_id', p_stripe_customer_id,
                    'processed_at', now(),
                    'profiles_updated', true
                )
            );
            
        EXCEPTION WHEN OTHERS THEN
            error_message := SQLERRM;
            operation_success := false;
        END;
    END IF;
    
    RETURN jsonb_build_object(
        'success', operation_success,
        'error_message', error_message,
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id,
        'user_id', final_user_id,
        'subscription_end', calculated_end_date,
        'profiles_updated', operation_success
    );
END;
$function$;

-- Ensure the trigger is properly attached to subscribers table
DROP TRIGGER IF EXISTS trigger_immediate_profile_sync_on_upgrade ON public.subscribers;
CREATE TRIGGER trigger_immediate_profile_sync_on_upgrade
    AFTER INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.immediate_profile_sync_on_upgrade();

-- Create additional trigger for profiles table to broadcast cache invalidation
CREATE OR REPLACE FUNCTION public.broadcast_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    notification_payload text;
BEGIN
    -- Create properly formatted JSON string for pg_notify
    notification_payload := json_build_object(
        'user_id', NEW.id::text,
        'package_type', NEW.package_type::text,
        'subscription_status', COALESCE(NEW.subscription_status::text, 'active'),
        'subscription_end', COALESCE(NEW.subscription_end_date::text, null),
        'updated_at', NEW.updated_at::text,
        'trigger_source', 'profiles_update',
        'timestamp', extract(epoch from now())
    )::text;
    
    -- Broadcast profile update notification
    PERFORM pg_notify('profile_upgrade_complete', notification_payload);
    
    RAISE LOG '[broadcast_profile_update] Profile update notification sent: %', notification_payload;
    
    RETURN NEW;
END;
$function$;

-- Attach trigger to profiles table for immediate notifications
DROP TRIGGER IF EXISTS trigger_broadcast_profile_update ON public.profiles;
CREATE TRIGGER trigger_broadcast_profile_update
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.package_type IS DISTINCT FROM NEW.package_type OR 
          OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
    EXECUTE FUNCTION public.broadcast_profile_update();

-- Enable realtime for profiles table to ensure real-time updates work
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
