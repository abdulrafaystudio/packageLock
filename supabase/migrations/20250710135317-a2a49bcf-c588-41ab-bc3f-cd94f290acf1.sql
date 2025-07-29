-- Clean emergency fix for test15@gmail.com using the stored data from incomplete_signups

-- Use the complete_paid_signup function to prepare the data properly
SELECT complete_paid_signup(
  'test15@gmail.com',
  'cus_SedrKoWToghaD4',
  '', -- No subscription ID from incomplete signup
  'standard',
  'Relja Salh',
  'Veritas Vertex LLC',
  'Montenegro0413!'
);

-- Log the emergency fix action
INSERT INTO public.recovery_log (
  email,
  action_taken,
  success,
  details
) VALUES (
  'test15@gmail.com',
  'emergency_signup_completion_phase1',
  true,
  '{"stripe_customer_id": "cus_SedrKoWToghaD4", "package_type": "standard", "method": "complete_paid_signup_function"}'
);