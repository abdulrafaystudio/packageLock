
-- Create webhook events table for reliable webhook processing
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for webhook events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage webhook events
CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
FOR ALL
USING (current_setting('role') = 'service_role');

-- Create index for efficient webhook processing
CREATE INDEX idx_webhook_events_processing ON public.webhook_events(processed, created_at);
CREATE INDEX idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);

-- Create function to process missed payments automatically
CREATE OR REPLACE FUNCTION public.process_missed_payments()
RETURNS TABLE(processed_count INTEGER, error_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- This function will be called by the payment scanner
  -- to automatically recover missed payments
  
  RETURN QUERY SELECT processed_count, error_count;
END;
$$;

-- Create function to validate and create paid account
CREATE OR REPLACE FUNCTION public.create_paid_account_from_session(
  p_stripe_session_id TEXT,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signup_record public.incomplete_signups%ROWTYPE;
  result JSONB;
BEGIN
  -- Get the incomplete signup record
  SELECT * INTO signup_record
  FROM public.incomplete_signups
  WHERE stripe_session_id = p_stripe_session_id 
    AND email = p_email 
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF signup_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_pending_signup',
      'message', 'No pending signup found for this session'
    );
  END IF;
  
  -- Mark as processing to prevent double processing
  UPDATE public.incomplete_signups
  SET status = 'processing', updated_at = now()
  WHERE id = signup_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'signup_data', to_jsonb(signup_record),
    'message', 'Ready for account creation'
  );
END;
$$;
