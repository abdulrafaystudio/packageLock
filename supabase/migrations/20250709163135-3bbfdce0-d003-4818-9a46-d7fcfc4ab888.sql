
-- Phase 1: Clean up existing incomplete signups with NULL password_hash
-- These were created before the password storage fix and represent failed signups
DELETE FROM public.incomplete_signups WHERE password_hash IS NULL;

-- Also clean up any test accounts that might be problematic
-- Remove any profiles/subscribers for emails that start with 'test' (optional cleanup)
DELETE FROM public.subscribers WHERE email LIKE 'test%@%';
DELETE FROM public.profiles WHERE email LIKE 'test%@%';

-- Add a comment for tracking
INSERT INTO public.recovery_log (email, action_taken, success, details) 
VALUES (
  'system_cleanup', 
  'eliminated_temp_password_data', 
  true, 
  '{"phase": "1", "description": "Cleaned up incomplete signups with NULL password_hash and test accounts"}'::jsonb
);
