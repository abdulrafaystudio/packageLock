-- Emergency cleanup and creation for test15@gmail.com

-- Step 1: Clean up any orphaned subscriber records that don't have matching auth users
DELETE FROM public.subscribers 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 2: Now create the auth user for test15@gmail.com
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test15@gmail.com',
  crypt('Montenegro0413!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Relja Salh", "company_name": "Veritas Vertex LLC", "package_type": "standard", "signup_source": "comprehensive_repair"}',
  false,
  'authenticated'
);

-- Step 3: Create profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  company_name,
  package_type,
  subscription_status,
  subscription_start_date,
  is_active,
  email_verified,
  signup_source,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test15@gmail.com'),
  'test15@gmail.com',
  'Relja Salh',
  'Veritas Vertex LLC',
  'standard',
  'active',
  now(),
  true,
  true,
  'comprehensive_repair',
  now(),
  now()
);

-- Step 4: Create subscriber record
INSERT INTO public.subscribers (
  user_id,
  email,
  stripe_customer_id,
  subscribed,
  subscription_tier,
  subscription_status,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test15@gmail.com'),
  'test15@gmail.com',
  'cus_SedrKoWToghaD4',
  true,
  'standard',
  'active',
  now(),
  now()
);

-- Step 5: Mark signup as completed
UPDATE public.incomplete_signups 
SET status = 'completed', updated_at = now() 
WHERE email = 'test15@gmail.com';