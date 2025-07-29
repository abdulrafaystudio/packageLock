
-- Phase 1: Critical Database Fixes

-- First, create the package_type enum
CREATE TYPE package_type AS ENUM ('free', 'freepro', 'standard', 'premium', 'premiumpro', 'enterprise');

-- Add package_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN package_type package_type DEFAULT 'free'::package_type;

-- Add subscription columns
ALTER TABLE public.profiles 
ADD COLUMN subscription_start_date timestamp with time zone,
ADD COLUMN subscription_end_date timestamp with time zone;

-- Create subscription_events table for tracking
CREATE TABLE public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_events
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for subscription_events
CREATE POLICY "Users can view their own subscription events" 
ON public.subscription_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update the handle_new_user function to include package_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    company_name, 
    email,
    package_type,
    signup_source,
    email_verified,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(TRIM(new.raw_user_meta_data ->> 'full_name'), ''),
    COALESCE(TRIM(new.raw_user_meta_data ->> 'company_name'), ''),
    COALESCE(new.email, ''),
    COALESCE((new.raw_user_meta_data ->> 'package_type')::package_type, 'free'::package_type),
    COALESCE(new.raw_user_meta_data ->> 'signup_source', 'web_form'),
    true,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', new.id, SQLERRM;
    RAISE;
END;
$$;

-- Update get_all_users_with_stats function to include package_type
CREATE OR REPLACE FUNCTION public.get_all_users_with_stats()
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  email text, 
  company_name text, 
  package_type text, 
  subscription_start_date timestamp with time zone, 
  subscription_end_date timestamp with time zone, 
  is_active boolean, 
  last_login timestamp with time zone, 
  created_at timestamp with time zone, 
  days_since_signup integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.company_name,
    p.package_type::text,
    p.subscription_start_date,
    p.subscription_end_date,
    p.is_active,
    p.last_login,
    p.created_at,
    EXTRACT(DAY FROM (now() - p.created_at))::integer as days_since_signup
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;
