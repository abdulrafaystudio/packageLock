
-- Phase 1: Security & RLS Setup for email_verifications table
-- Add comprehensive RLS policies for proper access control

-- Policy for users to view their own verification records
CREATE POLICY "Users can view own verification records" 
  ON public.email_verifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own verification records (for resend functionality)
CREATE POLICY "Users can insert own verification records" 
  ON public.email_verifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admin policy for managing verification records
CREATE POLICY "Admins can manage all verification records" 
  ON public.email_verifications 
  FOR ALL 
  USING (public.is_admin_user());

-- Create function to cleanup expired verification tokens automatically
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_tokens_enhanced()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired tokens that haven't been verified
  DELETE FROM public.email_verifications 
  WHERE expires_at < now() 
    AND verified_at IS NULL;
  
  -- Log cleanup activity
  RAISE NOTICE 'Cleaned up expired verification tokens at %', now();
END;
$$;

-- Create function to get verification status for a user
CREATE OR REPLACE FUNCTION public.get_user_verification_status(user_id_param uuid)
RETURNS TABLE(
  is_verified boolean,
  verification_method text,
  verified_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.email_verified, false) as is_verified,
    CASE 
      WHEN p.email_verified = true AND p.email_verified_at IS NOT NULL THEN 'custom'
      ELSE 'none'
    END as verification_method,
    p.email_verified_at as verified_at
  FROM public.profiles p
  WHERE p.id = user_id_param;
END;
$$;

-- Create function for safe manual verification (admin use)
CREATE OR REPLACE FUNCTION public.manual_verify_user_enhanced(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  verification_timestamp timestamp with time zone;
  result jsonb;
BEGIN
  verification_timestamp := now();
  
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- If user not found, return error
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Check if already verified
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = target_user_id AND email_verified = true
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'User already verified',
      'already_verified', true
    );
  END IF;
  
  -- Update profile to mark email as verified
  UPDATE public.profiles 
  SET 
    email_verified = true, 
    email_verified_at = verification_timestamp
  WHERE id = target_user_id;
  
  -- Mark any existing verification tokens as verified
  UPDATE public.email_verifications
  SET verified_at = verification_timestamp
  WHERE user_id = target_user_id AND verified_at IS NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User verified successfully',
    'verified_at', verification_timestamp
  );
END;
$$;

-- Add index for better performance on verification lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_verified 
  ON public.email_verifications(user_id, verified_at);

CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at 
  ON public.email_verifications(expires_at) 
  WHERE verified_at IS NULL;
