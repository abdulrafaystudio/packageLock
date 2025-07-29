-- Fix PostgreSQL NOTIFY Event Formatting
-- Update send_upgrade_notification to properly format JSON
CREATE OR REPLACE FUNCTION public.send_upgrade_notification(
    p_user_id uuid, 
    p_package_type text, 
    p_subscription_status text DEFAULT 'active'::text, 
    p_subscription_end timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    notification_payload text;
BEGIN
    -- Create properly formatted JSON string for pg_notify
    notification_payload := json_build_object(
        'user_id', p_user_id::text,
        'package_type', p_package_type,
        'subscription_status', p_subscription_status,
        'subscription_end', COALESCE(p_subscription_end::text, null),
        'updated_at', now()::text,
        'trigger_source', 'manual_notification',
        'timestamp', extract(epoch from now())
    )::text;
    
    -- Send notification with properly formatted JSON string
    PERFORM pg_notify('profile_upgrade_complete', notification_payload);
    
    RAISE LOG '[send_upgrade_notification] Sent notification: %', notification_payload;
    
    RETURN true;
END;
$function$;

-- Update immediate_profile_sync_on_upgrade to properly format JSON
CREATE OR REPLACE FUNCTION public.immediate_profile_sync_on_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    notification_payload text;
BEGIN
    -- Immediately sync profile when subscriber data changes (upgrades)
    UPDATE public.profiles
    SET 
        package_type = NEW.subscription_tier::package_type,
        subscription_status = NEW.subscription_status,
        subscription_end_date = NEW.subscription_end,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Create properly formatted JSON string for pg_notify
    notification_payload := json_build_object(
        'user_id', NEW.user_id::text,
        'package_type', NEW.subscription_tier,
        'subscription_status', NEW.subscription_status::text,
        'subscription_end', COALESCE(NEW.subscription_end::text, null),
        'updated_at', now()::text,
        'trigger_source', 'upgrade_webhook',
        'timestamp', extract(epoch from now())
    )::text;
    
    -- Broadcast real-time update with properly formatted JSON
    PERFORM pg_notify('profile_upgrade_complete', notification_payload);
    
    RAISE LOG '[immediate_profile_sync_on_upgrade] Profile synced and notification sent: %', notification_payload;
    
    RETURN NEW;
END;
$function$;