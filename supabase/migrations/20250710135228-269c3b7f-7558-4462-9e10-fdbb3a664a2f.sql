-- PHASE 1 EMERGENCY FIX: Manually process test15@gmail.com failed signup
-- This user has a successful payment (stripe_customer_id: cus_SedrKoWToghaD4) but no auth account

-- First, create the auth user
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
  '{"full_name": "Relja Salh", "company_name": "Veritas Vertex LLC", "package_type": "standard", "signup_source": "manual_emergency_fix", "stripe_customer_id": "cus_SedrKoWToghaD4"}',
  false,
  'authenticated'
);

-- Create profile for test15@gmail.com
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
  'manual_emergency_fix',
  now(),
  now()
);

-- Create subscriber record for test15@gmail.com
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

-- Mark the incomplete signup as completed
UPDATE public.incomplete_signups 
SET 
  status = 'completed', 
  updated_at = now() 
WHERE email = 'test15@gmail.com' 
  AND stripe_customer_id = 'cus_SedrKoWToghaD4';

-- Log the emergency fix in recovery log
INSERT INTO public.recovery_log (
  email,
  action_taken,
  success,
  details
) VALUES (
  'test15@gmail.com',
  'emergency_manual_account_creation',
  true,
  '{"stripe_customer_id": "cus_SedrKoWToghaD4", "package_type": "standard", "reason": "failed_webhook_chain", "fix_type": "comprehensive_system_repair"}'
);