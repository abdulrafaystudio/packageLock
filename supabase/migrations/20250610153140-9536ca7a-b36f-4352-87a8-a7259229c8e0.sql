
-- Step 1: Clear all deals to remove foreign key constraints blocking user deletion
DELETE FROM public.deals;

-- Step 2: Verify the deals table is empty
SELECT COUNT(*) as remaining_deals FROM public.deals;

-- Step 3: Verify profiles table is already cleared (from previous migration)
SELECT COUNT(*) as remaining_profiles FROM public.profiles;

-- Step 4: Check admin_users table status
SELECT COUNT(*) as remaining_admin_users FROM public.admin_users;
