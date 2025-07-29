
-- Set all existing users as verified in the profiles table
UPDATE public.profiles 
SET email_verified = true 
WHERE email_verified = false;

-- Also ensure that users who have confirmed their email in Supabase auth
-- are marked as verified in our profiles table
UPDATE public.profiles 
SET email_verified = true 
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL
);
