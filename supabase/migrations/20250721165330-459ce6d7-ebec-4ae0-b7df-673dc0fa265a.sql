
-- Create a table to track contacted investors
CREATE TABLE public.contacted_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investor_id UUID NOT NULL REFERENCES public.investors(id),
  investor_name TEXT NOT NULL,
  investor_type TEXT,
  contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.contacted_investors ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own contacted investors" 
  ON public.contacted_investors 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacted investors" 
  ON public.contacted_investors 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage contacted investors" 
  ON public.contacted_investors 
  FOR ALL 
  USING (current_setting('role'::text) = 'service_role'::text);

-- Create an index for better performance
CREATE INDEX idx_contacted_investors_user_id ON public.contacted_investors(user_id);
CREATE INDEX idx_contacted_investors_contact_date ON public.contacted_investors(contact_date DESC);
