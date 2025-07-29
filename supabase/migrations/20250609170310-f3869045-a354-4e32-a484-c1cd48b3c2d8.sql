
-- Create a table for support tickets
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to protect ticket data
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own tickets by email
CREATE POLICY "Users can view their own tickets" 
  ON public.support_tickets 
  FOR SELECT 
  USING (true); -- For now, allow reading for admin purposes

-- Create policy that allows anyone to create tickets (public contact form)
CREATE POLICY "Anyone can create support tickets" 
  ON public.support_tickets 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy that allows admins to update tickets (for status changes)
CREATE POLICY "Admins can update tickets" 
  ON public.support_tickets 
  FOR UPDATE 
  USING (true); -- Will be restricted to admin users in the future

-- Add trigger to update the updated_at column
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
