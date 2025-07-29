
import { supabase } from '@/integrations/supabase/client';

export const sendContactEmail = async (sanitizedData: any) => {
  console.log('Sending email with sanitized data:', {
    ...sanitizedData,
    contacts: sanitizedData.contacts.map((c: any) => ({ ...c, email: c.email.substring(0, 3) + '***' }))
  });

  // Send email using the edge function
  const { data, error } = await supabase.functions.invoke('send-contact-email', {
    body: sanitizedData,
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Failed to send email. Please try again.');
  }

  console.log('Email sent successfully:', data);
  return data;
};
