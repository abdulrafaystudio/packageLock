
-- Enhanced profile creation trigger with proper error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_package_type text;
  profile_exists boolean;
BEGIN
  -- Log the signup attempt
  RAISE LOG 'Starting profile creation for user: % with email: %', new.id, new.email;
  
  -- Check if profile already exists (shouldn't happen, but safety check)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = new.id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE LOG 'Profile already exists for user: %, skipping creation', new.id;
    RETURN new;
  END IF;
  
  -- Get package type as text first
  user_package_type := COALESCE(new.raw_user_meta_data ->> 'package_type', 'free');
  
  -- Validate it's a valid package type, default to 'free' if not
  IF user_package_type NOT IN ('free', 'standard', 'premium', 'enterprise', 'premiumpro') THEN
    RAISE LOG 'Invalid package type: %, defaulting to free for user: %', user_package_type, new.id;
    user_package_type := 'free';
  END IF;

  -- Create the profile
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
    false, -- Email verification starts as false
    true   -- User is active by default
  );
  
  RAISE LOG 'Successfully created profile for user: % with email: %', new.id, new.email;
  RETURN new;
  
EXCEPTION WHEN others THEN
  -- Log the error with full details
  RAISE LOG 'Error creating profile for user %: % - SQLSTATE: % - Detail: %', 
    new.id, SQLERRM, SQLSTATE, SQLERRM;
  
  -- Don't fail the signup process, but log the issue
  RAISE WARNING 'Profile creation failed for user % but signup will continue: %', new.id, SQLERRM;
  RETURN new;
END;
$$;

-- Add cleanup function for failed signups
CREATE OR REPLACE FUNCTION public.cleanup_failed_signup(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  cleaned_up boolean := false;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email
  AND email_confirmed_at IS NULL
  AND created_at < (now() - interval '1 hour'); -- Only cleanup old unconfirmed accounts
  
  IF user_id IS NOT NULL THEN
    -- Delete from profiles first (due to foreign key)
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- Note: We cannot directly delete from auth.users in this function
    -- That would need to be done via Supabase admin API
    
    cleaned_up := true;
    RAISE LOG 'Cleaned up failed signup for email: % (user_id: %)', user_email, user_id;
  END IF;
  
  RETURN cleaned_up;
END;
$$;

-- Add audit logging table for signup attempts
CREATE TABLE IF NOT EXISTS public.signup_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  attempt_time timestamp with time zone DEFAULT now(),
  success boolean NOT NULL,
  error_message text,
  user_agent text,
  ip_address inet,
  package_type text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS for audit log (admin only)
ALTER TABLE public.signup_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view signup audit log" 
  ON public.signup_audit_log 
  FOR ALL 
  USING (public.is_admin_user());

