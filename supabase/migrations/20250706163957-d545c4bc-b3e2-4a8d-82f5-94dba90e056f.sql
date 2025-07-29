-- Mark all stuck pending signups as expired so they don't interfere with new tests
UPDATE public.incomplete_signups 
SET 
  status = 'expired',
  updated_at = now()
WHERE status = 'pending' 
  AND created_at < now() - INTERVAL '1 hour';