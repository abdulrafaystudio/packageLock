
-- Phase 1: Clean up duplicate RLS policies and add missing ones

-- 1. Drop duplicate policies on email_verifications table
DROP POLICY IF EXISTS "Users can view own verification records" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can insert own verification records" ON public.email_verifications;
DROP POLICY IF EXISTS "Admins can manage all verification records" ON public.email_verifications;

-- 2. Create standardized RLS policies for email_verifications
CREATE POLICY "email_verifications_select_own" 
  ON public.email_verifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "email_verifications_insert_own" 
  ON public.email_verifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_verifications_update_own" 
  ON public.email_verifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "email_verifications_delete_own" 
  ON public.email_verifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. Admin policies for email_verifications (using security definer function)
CREATE POLICY "email_verifications_admin_all" 
  ON public.email_verifications 
  FOR ALL 
  USING (public.is_admin_user());

-- 4. Service role policy for automated cleanup
CREATE POLICY "email_verifications_service_cleanup" 
  ON public.email_verifications 
  FOR DELETE 
  USING (verified_at IS NULL AND expires_at < now());

-- 5. Ensure profiles table has proper policies (clean up any duplicates first)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 6. Create standardized policies for profiles
CREATE POLICY "profiles_select_own" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all" 
  ON public.profiles 
  FOR ALL 
  USING (public.is_admin_user());

-- 7. Ensure admin_users table has proper RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_admin_only" 
  ON public.admin_users 
  FOR ALL 
  USING (public.is_admin_user());
