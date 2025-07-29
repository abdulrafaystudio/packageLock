
-- Create a table to store email verification templates and settings
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the verification email template configuration
INSERT INTO public.email_templates (template_name, subject, from_email) 
VALUES ('email_verification', 'Verify your EasyFund account', 'noreply@easyfund.me')
ON CONFLICT (template_name) DO UPDATE SET
  subject = EXCLUDED.subject,
  from_email = EXCLUDED.from_email,
  updated_at = now();

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for email templates (admin access only)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email templates (only admins can manage)
CREATE POLICY "Only admins can manage email templates" 
  ON public.email_templates 
  FOR ALL 
  USING (public.is_admin_user());
