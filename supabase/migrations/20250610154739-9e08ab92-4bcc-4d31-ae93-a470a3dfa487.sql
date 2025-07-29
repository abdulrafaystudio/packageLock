
-- Add admin privileges to the user reljasalh@gmail.com
SELECT add_admin_by_email('reljasalh@gmail.com');

-- Verify the user has been added to admin_users table
SELECT * FROM public.admin_users 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'reljasalh@gmail.com');
