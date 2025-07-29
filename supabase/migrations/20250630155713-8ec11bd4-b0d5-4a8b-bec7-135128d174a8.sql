
-- Phase 1: Fix existing free users and ensure proper sync
-- Create missing subscriber records for existing free users
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_status, created_at, updated_at)
SELECT 
    p.id as user_id,
    p.email,
    false as subscribed,
    p.package_type::text as subscription_tier,
    'active'::subscription_status_type as subscription_status,
    p.created_at,
    now() as updated_at
FROM public.profiles p
LEFT JOIN public.subscribers s ON p.id = s.user_id
WHERE s.id IS NULL;

-- Create trigger to automatically create subscriber records when profiles are created
CREATE OR REPLACE FUNCTION public.handle_profile_subscriber_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create corresponding subscriber record
    INSERT INTO public.subscribers (
        user_id,
        email,
        subscribed,
        subscription_tier,
        subscription_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        CASE WHEN NEW.package_type IN ('free', 'freepro') THEN false ELSE true END,
        NEW.package_type::text,
        COALESCE(NEW.subscription_status, 'active'::subscription_status_type),
        NEW.created_at,
        NEW.updated_at
    ) ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        subscription_tier = EXCLUDED.subscription_tier,
        subscription_status = EXCLUDED.subscription_status,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$;

-- Create trigger for profile creation
DROP TRIGGER IF EXISTS profile_subscriber_sync_trigger ON public.profiles;
CREATE TRIGGER profile_subscriber_sync_trigger
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_profile_subscriber_sync();

-- Fix subscribers table to ensure user_id is unique
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_unique;
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_user_id_unique UNIQUE (user_id);

-- Create function to get package type from Stripe price ID (for webhook fallback)
CREATE OR REPLACE FUNCTION public.get_package_type_from_price_id(p_price_id text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT package_type::text
    FROM public.subscription_plans 
    WHERE stripe_price_id = p_price_id 
    AND is_active = true
    LIMIT 1;
$$;
