
-- This migration optimizes the user creation trigger for speed and reliability.
-- It removes slow logging operations and adds a conflict handler to prevent rare race conditions.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_package_type text;
BEGIN
  -- Determine package_type, default to 'free'
  user_package_type := COALESCE(new.raw_user_meta_data ->> 'package_type', 'free');
  IF user_package_type NOT IN ('free', 'standard', 'premium', 'enterprise', 'premiumpro', 'freepro') THEN
    user_package_type := 'free';
  END IF;

  -- Insert the profile.
  -- The ON CONFLICT clause handles the rare race condition where the trigger might fire twice for the same user,
  -- preventing the transaction from failing.
  INSERT INTO public.profiles (
    id, 
    full_name, 
    company_name, 
    package_type,
    email,
    subscription_start_date,
    signup_source,
    email_verified,
    is_active
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'company_name',
    user_package_type::public.package_type,
    COALESCE(new.email, ''),
    now(),
    COALESCE(new.raw_user_meta_data ->> 'signup_source', 'direct'),
    true, -- Assume immediate verification since email confirmation is disabled
    true   -- User is active by default
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;
