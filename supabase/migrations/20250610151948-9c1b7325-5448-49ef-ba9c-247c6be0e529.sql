
-- Step 1: Safely clear existing auth data while preserving table structures
-- Clear profiles table first (due to foreign key relationship)
DELETE FROM public.profiles;

-- Clear admin_users table (we'll recreate admin users later)
DELETE FROM public.admin_users;

-- Note: We cannot directly delete from auth.users table as it's managed by Supabase
-- The auth.users data will need to be cleared through Supabase dashboard
-- Go to Authentication > Users and delete all existing users manually

-- Verify table structures are preserved
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'admin_users')
ORDER BY table_name, ordinal_position;

-- Ensure all functions and triggers are still intact
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'is_admin_user', 'has_premium_access');
