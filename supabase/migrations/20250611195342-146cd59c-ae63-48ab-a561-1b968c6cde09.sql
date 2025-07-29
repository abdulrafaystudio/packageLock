
-- Manually update the database to set email_verified = true for your user
-- This will fix the immediate access issue
UPDATE public.profiles 
SET email_verified = true, email_verified_at = now() 
WHERE id = auth.uid();

-- Alternative: If you know your email, you can use this instead
-- UPDATE public.profiles 
-- SET email_verified = true, email_verified_at = now() 
-- WHERE email = 'your-email@example.com';
