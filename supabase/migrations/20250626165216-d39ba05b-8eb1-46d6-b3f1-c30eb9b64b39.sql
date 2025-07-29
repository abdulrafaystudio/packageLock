
-- Create enhanced subscription management schema

-- First, let's add the new subscription_status enum to the existing package_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
        CREATE TYPE subscription_status_type AS ENUM (
            'active',
            'pending_subscription', 
            'past_due',
            'cancelled',
            'pending_downgrade'
        );
    END IF;
END $$;

-- Create subscribers table to track Stripe customer relationships
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    subscribed BOOLEAN NOT NULL DEFAULT false,
    subscription_tier TEXT,
    subscription_status subscription_status_type DEFAULT 'active',
    subscription_end TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    proration_credits DECIMAL(10,2) DEFAULT 0.00,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription_plans table for centralized price ID mapping
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_type package_type NOT NULL,
    billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'yearly')),
    stripe_price_id TEXT NOT NULL UNIQUE,
    monthly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(package_type, billing_frequency)
);

-- Create incomplete_signups table for pending paid accounts
CREATE TABLE IF NOT EXISTS public.incomplete_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    package_type package_type NOT NULL,
    billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'yearly')),
    stripe_session_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create webhook_events table for Stripe webhook audit trail
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    event_data JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription_transitions table for audit trail
CREATE TABLE IF NOT EXISTS public.subscription_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_plan package_type,
    to_plan package_type NOT NULL,
    from_billing_frequency TEXT,
    to_billing_frequency TEXT,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    proration_amount DECIMAL(10,2),
    transition_type TEXT NOT NULL CHECK (transition_type IN ('upgrade', 'downgrade', 'cancellation', 'renewal', 'creation')),
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status subscription_status_type DEFAULT 'active',
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pending_downgrade_to package_type,
ADD COLUMN IF NOT EXISTS pending_downgrade_date TIMESTAMPTZ;

-- Insert subscription plan data with price IDs
INSERT INTO public.subscription_plans (package_type, billing_frequency, stripe_price_id, monthly_price, yearly_price) VALUES
('standard', 'monthly', 'price_1RbmctKN6TIEUdDLpMT9go8n', 19.00, NULL),
('standard', 'yearly', 'price_1RbmdBKN6TIEUdDLFAQPluwg', NULL, 15.83),
('premium', 'monthly', 'price_1RbmdkKN6TIEUdDLdmP1bSS1', 39.00, NULL),
('premium', 'yearly', 'price_1RbmeQKN6TIEUdDL6k43iKGH', NULL, 32.50),
('enterprise', 'monthly', 'price_1RbmeeKN6TIEUdDLm6ph4RBL', 74.00, NULL),
('enterprise', 'yearly', 'price_1RbmfCKN6TIEUdDLGSlNeCU0', NULL, 59.00),
('premiumpro', 'monthly', 'price_1RbmfRKN6TIEUdDLtRxgpzQ7', 199.00, NULL),
('premiumpro', 'yearly', 'price_1Rbmg3KN6TIEUdDLE3iyRV6a', NULL, 166.00)
ON CONFLICT (package_type, billing_frequency) DO UPDATE SET
    stripe_price_id = EXCLUDED.stripe_price_id,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    updated_at = now();

-- Enable Row Level Security on all new tables
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomplete_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers table
CREATE POLICY "Users can view their own subscription info" ON public.subscribers
    FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Service role can manage all subscriptions" ON public.subscribers
    FOR ALL USING (true);

-- RLS Policies for subscription_plans table (public read access)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage subscription plans" ON public.subscription_plans
    FOR ALL USING (true);

-- RLS Policies for incomplete_signups table (admin access only)
CREATE POLICY "Service role can manage incomplete signups" ON public.incomplete_signups
    FOR ALL USING (true);

-- RLS Policies for webhook_events table (admin access only)
CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
    FOR ALL USING (true);

-- RLS Policies for subscription_transitions table
CREATE POLICY "Users can view their own subscription transitions" ON public.subscription_transitions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all subscription transitions" ON public.subscription_transitions
    FOR ALL USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to new tables
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incomplete_signups_updated_at BEFORE UPDATE ON public.incomplete_signups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_incomplete_signups_email ON public.incomplete_signups(email);
CREATE INDEX IF NOT EXISTS idx_incomplete_signups_stripe_session_id ON public.incomplete_signups(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_subscription_transitions_user_id ON public.subscription_transitions(user_id);

-- Create function to get price ID by package and billing frequency
CREATE OR REPLACE FUNCTION public.get_stripe_price_id(
    p_package_type package_type,
    p_billing_frequency TEXT
)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT stripe_price_id 
    FROM public.subscription_plans 
    WHERE package_type = p_package_type 
    AND billing_frequency = p_billing_frequency 
    AND is_active = true
    LIMIT 1;
$$;

-- Create function to log subscription transitions
CREATE OR REPLACE FUNCTION public.log_subscription_transition(
    p_user_id UUID,
    p_from_plan package_type,
    p_to_plan package_type,
    p_from_billing TEXT DEFAULT NULL,
    p_to_billing TEXT DEFAULT NULL,
    p_transition_type TEXT DEFAULT 'upgrade',
    p_proration_amount DECIMAL DEFAULT NULL,
    p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transition_id UUID;
BEGIN
    INSERT INTO public.subscription_transitions (
        user_id,
        from_plan,
        to_plan,
        from_billing_frequency,
        to_billing_frequency,
        transition_type,
        proration_amount,
        stripe_subscription_id
    ) VALUES (
        p_user_id,
        p_from_plan,
        p_to_plan,
        p_from_billing,
        p_to_billing,
        p_transition_type,
        p_proration_amount,
        p_stripe_subscription_id
    ) RETURNING id INTO transition_id;
    
    RETURN transition_id;
END;
$$;
