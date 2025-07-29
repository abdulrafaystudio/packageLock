
-- Phase 1: Critical Security & RLS Policy Fixes

-- 1. Fix RLS policies for subscribers table
DROP POLICY IF EXISTS "Users can view their own subscription info" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscribers;

-- Create proper RLS policies for subscribers
CREATE POLICY "subscribers_select_own" ON public.subscribers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscribers_insert_service" ON public.subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "subscribers_update_service" ON public.subscribers
    FOR UPDATE USING (true);

-- 2. Fix RLS policies for profiles table to ensure proper sync
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_service" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_service" ON public.profiles
    FOR UPDATE USING (true);

-- 3. Create subscription sync validation function
CREATE OR REPLACE FUNCTION public.validate_subscription_sync()
RETURNS TABLE(
    user_id uuid,
    email text,
    issue_type text,
    profiles_status text,
    subscribers_status text,
    recommended_action text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Find users with mismatched subscription status between profiles and subscribers
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        'status_mismatch'::text as issue_type,
        COALESCE(p.subscription_status::text, 'null') as profiles_status,
        COALESCE(s.subscription_status::text, 'null') as subscribers_status,
        'sync_subscription_status'::text as recommended_action
    FROM public.profiles p
    LEFT JOIN public.subscribers s ON p.id = s.user_id
    WHERE p.subscription_status != s.subscription_status
       OR (p.subscription_status IS NULL AND s.subscription_status IS NOT NULL)
       OR (p.subscription_status IS NOT NULL AND s.subscription_status IS NULL);

    -- Find users with subscription in profiles but no subscriber record
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        'missing_subscriber_record'::text as issue_type,
        COALESCE(p.package_type::text, 'null') as profiles_status,
        'missing'::text as subscribers_status,
        'create_subscriber_record'::text as recommended_action
    FROM public.profiles p
    LEFT JOIN public.subscribers s ON p.id = s.user_id
    WHERE p.package_type != 'free' AND s.id IS NULL;
END;
$$;

-- 4. Create subscription reconciliation function
CREATE OR REPLACE FUNCTION public.reconcile_subscription_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sync_count integer := 0;
    create_count integer := 0;
    result jsonb;
BEGIN
    -- Sync existing mismatched records
    UPDATE public.profiles 
    SET 
        subscription_status = s.subscription_status,
        package_type = COALESCE(s.subscription_tier::package_type, 'free'::package_type),
        subscription_end_date = s.subscription_end
    FROM public.subscribers s
    WHERE profiles.id = s.user_id
      AND (profiles.subscription_status != s.subscription_status
           OR profiles.package_type::text != s.subscription_tier
           OR profiles.subscription_end_date != s.subscription_end);
    
    GET DIAGNOSTICS sync_count = ROW_COUNT;

    -- Create missing subscriber records for paid users
    INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_status)
    SELECT 
        p.id,
        p.email,
        CASE WHEN p.package_type != 'free' THEN true ELSE false END,
        p.package_type::text,
        COALESCE(p.subscription_status, 'active')
    FROM public.profiles p
    LEFT JOIN public.subscribers s ON p.id = s.user_id
    WHERE s.id IS NULL AND p.package_type != 'free';
    
    GET DIAGNOSTICS create_count = ROW_COUNT;

    result := jsonb_build_object(
        'success', true,
        'synced_profiles', sync_count,
        'created_subscribers', create_count,
        'timestamp', now()
    );

    RETURN result;
END;
$$;

-- 5. Create enhanced security validation function
CREATE OR REPLACE FUNCTION public.validate_user_permissions(
    check_user_id uuid DEFAULT auth.uid(),
    required_tier text DEFAULT 'free'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile public.profiles%ROWTYPE;
    user_subscription public.subscribers%ROWTYPE;
    validation_result jsonb;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile
    FROM public.profiles
    WHERE id = check_user_id;

    -- Get user subscription
    SELECT * INTO user_subscription
    FROM public.subscribers
    WHERE user_id = check_user_id;

    -- Validate user exists
    IF user_profile.id IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'user_not_found',
            'message', 'User profile not found'
        );
    END IF;

    -- Check if user is active
    IF NOT user_profile.is_active THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'user_inactive',
            'message', 'User account is inactive'
        );
    END IF;

    -- Check subscription status
    IF user_subscription.id IS NOT NULL THEN
        -- Check if subscription is past due or cancelled
        IF user_subscription.subscription_status IN ('past_due', 'cancelled') THEN
            -- Check grace period
            IF user_profile.grace_period_end IS NOT NULL AND user_profile.grace_period_end > now() THEN
                RETURN jsonb_build_object(
                    'valid', true,
                    'status', 'grace_period',
                    'grace_period_end', user_profile.grace_period_end,
                    'subscription_tier', user_subscription.subscription_tier
                );
            ELSE
                RETURN jsonb_build_object(
                    'valid', false,
                    'error', 'subscription_expired',
                    'message', 'Subscription has expired',
                    'subscription_status', user_subscription.subscription_status
                );
            END IF;
        END IF;
    END IF;

    -- Validate tier requirement
    IF required_tier != 'free' AND (user_profile.package_type = 'free' OR user_subscription.subscribed = false) THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'insufficient_tier',
            'message', 'User does not have required subscription tier',
            'current_tier', user_profile.package_type,
            'required_tier', required_tier
        );
    END IF;

    -- All validations passed
    RETURN jsonb_build_object(
        'valid', true,
        'status', 'active',
        'subscription_tier', COALESCE(user_subscription.subscription_tier, user_profile.package_type),
        'subscription_end', user_subscription.subscription_end
    );
END;
$$;

-- 6. Create subscription audit trail table
CREATE TABLE IF NOT EXISTS public.subscription_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('sync', 'reconcile', 'validation_failed', 'webhook_processed', 'manual_update')),
    old_values JSONB,
    new_values JSONB,
    source TEXT NOT NULL DEFAULT 'system',
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.subscription_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit table
CREATE POLICY "audit_service_only" ON public.subscription_audit
    FOR ALL USING (true);

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_subscription_status 
    ON public.subscribers(user_id, subscription_status);

CREATE INDEX IF NOT EXISTS idx_profiles_package_subscription_status 
    ON public.profiles(package_type, subscription_status);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_user_action 
    ON public.subscription_audit(user_id, action_type, created_at);

-- 8. Create trigger to maintain audit trail
CREATE OR REPLACE FUNCTION public.audit_subscription_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log subscription changes
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.subscription_audit (
            user_id,
            action_type,
            old_values,
            new_values,
            source
        ) VALUES (
            NEW.user_id,
            'sync',
            to_jsonb(OLD),
            to_jsonb(NEW),
            'trigger'
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.subscription_audit (
            user_id,
            action_type,
            new_values,
            source
        ) VALUES (
            NEW.user_id,
            'sync',
            to_jsonb(NEW),
            'trigger'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for audit trail
DROP TRIGGER IF EXISTS subscription_audit_trigger ON public.subscribers;
CREATE TRIGGER subscription_audit_trigger
    AFTER INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION public.audit_subscription_changes();

DROP TRIGGER IF EXISTS profile_subscription_audit_trigger ON public.profiles;
CREATE TRIGGER profile_subscription_audit_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW 
    WHEN (OLD.package_type IS DISTINCT FROM NEW.package_type 
          OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
    EXECUTE FUNCTION public.audit_subscription_changes();
