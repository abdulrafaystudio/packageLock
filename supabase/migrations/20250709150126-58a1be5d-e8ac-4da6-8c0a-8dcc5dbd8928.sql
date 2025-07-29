
-- Phase 1: Fix existing broken accounts by creating missing profiles
-- First, create profiles for users who have auth + subscribers but no profiles
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company_name,
    package_type,
    subscription_status,
    subscription_start_date,
    is_active,
    email_verified,
    signup_source,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(au.raw_user_meta_data ->> 'company_name', ''),
    COALESCE((au.raw_user_meta_data ->> 'package_type')::package_type, 'standard'::package_type),
    'active'::subscription_status_type,
    au.created_at,
    true,
    true,
    'stripe_checkout',
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL 
AND au.created_at > NOW() - INTERVAL '7 days'
ON CONFLICT (id) DO NOTHING;

-- Phase 2: Fix the handle_new_user trigger to be more robust
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
  -- Check if profile already exists to prevent duplicate key violations
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = new.id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE LOG '[handle_new_user] Profile already exists for user %, skipping creation', new.id;
    RETURN new;
  END IF;
  
  -- Determine package_type, default to 'free'
  user_package_type := COALESCE(new.raw_user_meta_data ->> 'package_type', 'free');
  IF user_package_type NOT IN ('free', 'standard', 'premium', 'enterprise', 'premiumpro', 'freepro') THEN
    user_package_type := 'free';
  END IF;

  -- Insert the profile with conflict handling
  INSERT INTO public.profiles (
    id, 
    full_name, 
    company_name, 
    package_type,
    email,
    subscription_start_date,
    signup_source,
    email_verified,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'company_name',
    user_package_type::public.package_type,
    COALESCE(new.email, ''),
    now(),
    COALESCE(new.raw_user_meta_data ->> 'signup_source', 'direct'),
    true,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    package_type = EXCLUDED.package_type,
    email = EXCLUDED.email,
    updated_at = now();
  
  RAISE LOG '[handle_new_user] Successfully created/updated profile for user: %', new.id;
  RETURN new;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[handle_new_user] Error creating profile for user %: %', new.id, SQLERRM;
  -- Don't fail the auth user creation if profile creation fails
  RETURN new;
END;
$$;

-- Phase 3: Add a recovery function to automatically fix missing profiles
CREATE OR REPLACE FUNCTION public.recover_missing_profiles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recovery_count INTEGER := 0;
    missing_profile RECORD;
BEGIN
    -- Find auth users without profiles and create them
    FOR missing_profile IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at, au.updated_at
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            company_name,
            package_type,
            subscription_status,
            subscription_start_date,
            is_active,
            email_verified,
            signup_source,
            created_at,
            updated_at
        ) VALUES (
            missing_profile.id,
            missing_profile.email,
            COALESCE(missing_profile.raw_user_meta_data ->> 'full_name', ''),
            COALESCE(missing_profile.raw_user_meta_data ->> 'company_name', ''),
            COALESCE((missing_profile.raw_user_meta_data ->> 'package_type')::package_type, 'standard'::package_type),
            'active'::subscription_status_type,
            missing_profile.created_at,
            true,
            true,
            COALESCE(missing_profile.raw_user_meta_data ->> 'signup_source', 'recovery'),
            missing_profile.created_at,
            missing_profile.updated_at
        ) ON CONFLICT (id) DO NOTHING;
        
        recovery_count := recovery_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'recovered_profiles', recovery_count,
        'message', format('Successfully recovered %s missing profiles', recovery_count)
    );
END;
$$;
