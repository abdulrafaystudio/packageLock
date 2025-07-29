-- Fix pricing mismatch: Premium package should be $129/month, not $39/month
UPDATE public.subscription_plans 
SET 
  monthly_price = 129.00,
  yearly_price = 107.00,
  updated_at = now()
WHERE package_type = 'premium' AND billing_frequency = 'monthly';

UPDATE public.subscription_plans 
SET 
  yearly_price = 107.00,
  updated_at = now()
WHERE package_type = 'premium' AND billing_frequency = 'yearly';

-- Also fix yearly price calculation for Standard to match frontend
UPDATE public.subscription_plans 
SET 
  yearly_price = 15.00,
  updated_at = now()
WHERE package_type = 'standard' AND billing_frequency = 'yearly';

-- Fix Enterprise yearly price to match frontend
UPDATE public.subscription_plans 
SET 
  yearly_price = 59.00,
  updated_at = now()
WHERE package_type = 'enterprise' AND billing_frequency = 'yearly';

-- Fix Premium Pro yearly price to match frontend  
UPDATE public.subscription_plans 
SET 
  yearly_price = 166.00,
  updated_at = now()
WHERE package_type = 'premiumpro' AND billing_frequency = 'yearly';