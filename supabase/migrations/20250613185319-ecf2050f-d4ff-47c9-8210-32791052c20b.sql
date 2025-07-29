
-- Remove the custom email verification system tables and functions
DROP TABLE IF EXISTS public.email_verifications CASCADE;

-- Remove the custom verification functions
DROP FUNCTION IF EXISTS public.cleanup_expired_verification_tokens() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_verification_tokens_enhanced() CASCADE;
DROP FUNCTION IF EXISTS public.verify_email_verification_consistency() CASCADE;
DROP FUNCTION IF EXISTS public.repair_email_verification_inconsistencies() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_verification_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.manual_verify_user_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.manual_verify_user_enhanced(text) CASCADE;

-- Update the profiles table to simplify email verification tracking
-- Keep only the basic email_verified flag for compatibility
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS email_verified_at CASCADE;

-- Ensure email_verified column exists and has a default
ALTER TABLE public.profiles 
ALTER COLUMN email_verified SET DEFAULT false;
