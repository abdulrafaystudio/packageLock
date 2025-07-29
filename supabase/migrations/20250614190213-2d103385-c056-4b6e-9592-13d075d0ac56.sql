
-- Make user and profile creation atomic and enable immediate login by default
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
  -- Log the start of the transaction
  RAISE LOG '[handle_new_user] Trigger started for user: %. Email: %.', new.id, new.email;
  
  -- Safety check: ensure a profile doesn't already exist.
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = new.id) INTO profile_exists;
  IF profile_exists THEN
    RAISE LOG '[handle_new_user] Profile for user % already exists. Skipping insertion.', new.id;
    RETURN new;
  END IF;
  
  -- Determine and validate package_type
  user_package_type := COALESCE(new.raw_user_meta_data ->> 'package_type', 'free');
  IF user_package_type NOT IN ('free', 'standard', 'premium', 'enterprise', 'premiumpro', 'freepro') THEN
    RAISE WARNING '[handle_new_user] Invalid package type "%" for user %. Defaulting to "free".', user_package_type, new.id;
    user_package_type := 'free';
  END IF;

  -- Attempt to insert the profile. If this fails, the entire transaction will roll back.
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
    true, -- Set email_verified to true to allow immediate login
    true   -- User is active by default
  );
  
  RAISE LOG '[handle_new_user] Successfully created profile for user: %', new.id;
  RETURN new;
  
-- By removing the EXCEPTION block, we make profile creation mandatory.
-- If this INSERT fails for any reason (e.g., constraint violation), the trigger will raise an error,
-- which rolls back the entire transaction, including the insertion into auth.users. This ensures data consistency.
END;
$$;
