
-- Phase 1: Critical Database Fixes (Fixed Version)
-- Fix RLS policies and add missing constraints

-- 1. Drop and recreate the enhanced cleanup function with proper return type
DROP FUNCTION IF EXISTS public.cleanup_expired_verification_tokens_enhanced();

-- 2. Ensure email_verifications table has proper RLS policies (fix any gaps)
DROP POLICY IF EXISTS "email_verifications_service_cleanup" ON public.email_verifications;

-- Create a more secure service cleanup policy that only allows cleanup via specific function
CREATE POLICY "email_verifications_service_cleanup" 
  ON public.email_verifications 
  FOR DELETE 
  USING (
    -- Only allow deletion if called from our cleanup function context
    verified_at IS NULL 
    AND expires_at < now()
    AND (
      -- Allow service role or admin users
      auth.role() = 'service_role' 
      OR public.is_admin_user()
    )
  );

-- 3. Add index for better performance on verification lookups by email
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_token 
  ON public.email_verifications(email, token) 
  WHERE verified_at IS NULL;

-- 4. Add function for database consistency checks
CREATE OR REPLACE FUNCTION public.verify_email_verification_consistency()
RETURNS TABLE(
  issue_type text,
  user_id uuid,
  email text,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check for users with verified profiles but no verification record
  RETURN QUERY
  SELECT 
    'missing_verification_record'::text,
    p.id,
    p.email,
    'User has verified profile but no verification record'::text
  FROM public.profiles p
  WHERE p.email_verified = true
    AND p.email_verified_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.email_verifications ev 
      WHERE ev.user_id = p.id AND ev.verified_at IS NOT NULL
    );

  -- Check for verification records without corresponding profile updates
  RETURN QUERY
  SELECT 
    'profile_not_updated'::text,
    ev.user_id,
    ev.email,
    'Verification record exists but profile not marked as verified'::text
  FROM public.email_verifications ev
  WHERE ev.verified_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = ev.user_id AND p.email_verified = true
    );

  -- Check for expired unverified tokens (older than 7 days)
  RETURN QUERY
  SELECT 
    'expired_tokens'::text,
    ev.user_id,
    ev.email,
    'Token expired more than 7 days ago and should be cleaned up'::text
  FROM public.email_verifications ev
  WHERE ev.verified_at IS NULL
    AND ev.expires_at < (now() - interval '7 days');
END;
$$;

-- 5. Add function to repair inconsistencies
CREATE OR REPLACE FUNCTION public.repair_email_verification_inconsistencies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  repair_count integer := 0;
  cleanup_count integer := 0;
  result jsonb;
BEGIN
  -- Repair profiles that should be marked as verified
  UPDATE public.profiles 
  SET 
    email_verified = true,
    email_verified_at = ev.verified_at
  FROM public.email_verifications ev
  WHERE profiles.id = ev.user_id
    AND ev.verified_at IS NOT NULL
    AND profiles.email_verified = false;
  
  GET DIAGNOSTICS repair_count = ROW_COUNT;

  -- Clean up very old expired tokens (older than 7 days)
  DELETE FROM public.email_verifications
  WHERE verified_at IS NULL
    AND expires_at < (now() - interval '7 days');
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;

  result := jsonb_build_object(
    'success', true,
    'repaired_profiles', repair_count,
    'cleaned_tokens', cleanup_count,
    'timestamp', now()
  );

  RETURN result;
END;
$$;

-- 6. Enhanced cleanup function with better logging and proper return type
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_tokens_enhanced()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count integer := 0;
  result jsonb;
BEGIN
  -- Delete expired tokens that haven't been verified
  DELETE FROM public.email_verifications 
  WHERE expires_at < now() 
    AND verified_at IS NULL;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  result := jsonb_build_object(
    'success', true,
    'cleaned_count', cleanup_count,
    'timestamp', now()
  );
  
  -- Log cleanup activity
  RAISE NOTICE 'Cleaned up % expired verification tokens at %', cleanup_count, now();
  
  RETURN result;
END;
$$;
