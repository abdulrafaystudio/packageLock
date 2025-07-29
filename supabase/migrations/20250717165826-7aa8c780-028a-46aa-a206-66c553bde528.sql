-- Data migration: Copy missing stripe_customer_id from incomplete_signups to subscribers
UPDATE public.subscribers 
SET stripe_customer_id = i.stripe_customer_id,
    updated_at = now()
FROM public.incomplete_signups i
WHERE subscribers.email = i.email 
  AND subscribers.stripe_customer_id IS NULL 
  AND i.stripe_customer_id IS NOT NULL
  AND i.status IN ('completed', 'recovered');

-- Create function to validate stripe customer ID consistency
CREATE OR REPLACE FUNCTION public.validate_stripe_customer_consistency()
RETURNS TABLE(
    user_email text,
    subscribers_stripe_id text,
    incomplete_stripe_id text,
    issue_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Find users with missing stripe_customer_id in subscribers but exists in incomplete_signups
    RETURN QUERY
    SELECT 
        s.email,
        s.stripe_customer_id,
        i.stripe_customer_id,
        'missing_in_subscribers'::text as issue_type
    FROM public.subscribers s
    LEFT JOIN public.incomplete_signups i ON s.email = i.email
    WHERE s.stripe_customer_id IS NULL 
      AND i.stripe_customer_id IS NOT NULL
      AND s.subscribed = true;
      
    -- Find mismatched stripe_customer_ids
    RETURN QUERY
    SELECT 
        s.email,
        s.stripe_customer_id,
        i.stripe_customer_id,
        'mismatched_ids'::text as issue_type
    FROM public.subscribers s
    INNER JOIN public.incomplete_signups i ON s.email = i.email
    WHERE s.stripe_customer_id IS NOT NULL 
      AND i.stripe_customer_id IS NOT NULL
      AND s.stripe_customer_id != i.stripe_customer_id;
END;
$$;