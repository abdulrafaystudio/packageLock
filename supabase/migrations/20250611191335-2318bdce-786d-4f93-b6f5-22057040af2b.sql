
-- First, let's manually fix your verification status and ensure the verification process works correctly
-- Update your profile to be verified (replace with your actual user ID if known)
UPDATE public.profiles 
SET email_verified = true, email_verified_at = now() 
WHERE email = (SELECT email FROM auth.users WHERE email LIKE '%your-email%');

-- Clean up any expired verification tokens
DELETE FROM public.email_verifications 
WHERE expires_at < now() AND verified_at IS NULL;

-- Create a function to manually verify users by email (for admin use)
CREATE OR REPLACE FUNCTION public.manual_verify_user_by_email(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- If user not found, return false
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update profile to mark email as verified
  UPDATE public.profiles 
  SET email_verified = true, email_verified_at = now()
  WHERE id = target_user_id;
  
  -- Mark any existing verification tokens as verified
  UPDATE public.email_verifications
  SET verified_at = now()
  WHERE user_id = target_user_id AND verified_at IS NULL;
  
  RETURN true;
END;
$$;
