-- Create manual auth account for test14@gmail.com with successful payment
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
  'test14@gmail.com',
  crypt('TempPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Test User 14", "package_type": "standard", "signup_source": "stripe_payment"}',
  false,
  'authenticated'
);

-- Update the incomplete signup status to completed
UPDATE public.incomplete_signups 
SET status = 'completed', updated_at = now() 
WHERE email = 'test14@gmail.com' AND stripe_customer_id = 'cus_SeNZrDRc0g3qTb';

-- Clean up other pending signups without stripe_customer_id (failed before payment)
DELETE FROM public.incomplete_signups 
WHERE status = 'pending' AND stripe_customer_id IS NULL;