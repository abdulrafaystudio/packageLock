-- Fix data consistency for test20@gmail.com
-- Update subscribers table to change subscription_tier from 'premium' to 'standard'
UPDATE public.subscribers 
SET subscription_tier = 'standard', 
    updated_at = now()
WHERE email = 'test20@gmail.com' 
AND subscription_tier = 'premium';

-- Ensure profiles and subscribers are in sync
UPDATE public.profiles 
SET package_type = 'standard',
    updated_at = now()
WHERE email = 'test20@gmail.com';

-- Add data consistency check function
CREATE OR REPLACE FUNCTION public.ensure_subscription_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When subscribers table is updated, sync with profiles
    IF TG_TABLE_NAME = 'subscribers' THEN
        UPDATE public.profiles 
        SET 
            package_type = NEW.subscription_tier::package_type,
            subscription_status = NEW.subscription_status,
            subscription_end_date = NEW.subscription_end,
            updated_at = now()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to maintain consistency
DROP TRIGGER IF EXISTS sync_subscription_data ON public.subscribers;
CREATE TRIGGER sync_subscription_data
    AFTER UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_subscription_consistency();