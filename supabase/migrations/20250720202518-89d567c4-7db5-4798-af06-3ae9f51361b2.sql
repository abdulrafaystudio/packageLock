-- Add PostgreSQL NOTIFY function for real-time upgrade notifications
CREATE OR REPLACE FUNCTION public.notify_profile_upgrade_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Broadcast profile upgrade completion immediately
    PERFORM pg_notify('profile_upgrade_complete', json_build_object(
        'user_id', NEW.user_id,
        'package_type', NEW.subscription_tier,
        'subscription_status', NEW.subscription_status,
        'subscription_end', NEW.subscription_end,
        'updated_at', now(),
        'trigger_source', 'subscriber_update'
    )::text);
    
    RETURN NEW;
END;
$function$;

-- Create trigger on subscribers table for immediate upgrade notifications
DROP TRIGGER IF EXISTS notify_upgrade_complete ON public.subscribers;
CREATE TRIGGER notify_upgrade_complete
    AFTER UPDATE ON public.subscribers
    FOR EACH ROW
    WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier OR 
          OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
    EXECUTE FUNCTION public.notify_profile_upgrade_complete();

-- Enhanced pg_notify function for manual notifications
CREATE OR REPLACE FUNCTION public.send_upgrade_notification(
    p_user_id uuid,
    p_package_type text,
    p_subscription_status text DEFAULT 'active',
    p_subscription_end timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    PERFORM pg_notify('profile_upgrade_complete', json_build_object(
        'user_id', p_user_id,
        'package_type', p_package_type,
        'subscription_status', p_subscription_status,
        'subscription_end', p_subscription_end,
        'updated_at', now(),
        'trigger_source', 'manual_notification'
    )::text);
    
    RETURN true;
END;
$function$;