-- Simple recovery migration - mark webhooks as processed
-- The recovery processor edge function will handle auth user creation

UPDATE public.webhook_events 
SET 
    processed = true,
    processed_at = now(),
    error_message = 'Manually processed during system recovery - accounts will be created by recovery processor'
WHERE processed = false;

-- Create recovery log table for tracking
CREATE TABLE IF NOT EXISTS public.recovery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on recovery log
ALTER TABLE public.recovery_log ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage recovery log
CREATE POLICY "service_role_recovery_log" ON public.recovery_log
FOR ALL USING (true);

SELECT 'Webhooks marked as processed, ready for recovery processor' as status;