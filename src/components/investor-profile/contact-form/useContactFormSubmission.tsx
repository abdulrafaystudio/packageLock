
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Investor } from '@/hooks/useInvestors';
import { cleanText } from '@/utils/textCleaning';
import { sanitizeInput } from '@/utils/security';
import { useContactedInvestors } from '@/hooks/useContactedInvestors';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface EmailContact {
  name: string;
  email: string;
  role: string;
}

export const useContactFormSubmission = (investor: Investor, emailContacts: EmailContact[]) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addContactedInvestor } = useContactedInvestors();

  const handleSubmit = async (formData: ContactFormData, resetForm: () => void) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to contact investors.",
        variant: "destructive",
      });
      return false;
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, email, and message).",
        variant: "destructive",
      });
      return false;
    }

    if (emailContacts.length === 0) {
      toast({
        title: "No Contact Information",
        description: "No valid email contacts found for this investor.",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      console.log('=== INVESTOR CONTACT FORM SUBMISSION START ===');
      console.log('Investor:', investor.investor_name);
      console.log('Contact count:', emailContacts.length);
      console.log('User ID:', user.id);

      // Sanitize form data
      const sanitizedData = {
        investorName: sanitizeInput(cleanText(investor.investor_name) || investor.investor_name, 200),
        senderName: sanitizeInput(formData.name.trim(), 100),
        senderEmail: sanitizeInput(formData.email.trim(), 254),
        senderPhone: sanitizeInput(formData.phone.trim(), 50),
        message: sanitizeInput(formData.message.trim(), 800),
        contacts: emailContacts.map(contact => ({
          name: sanitizeInput(contact.name, 100),
          email: sanitizeInput(contact.email, 254),
          role: sanitizeInput(contact.role, 100),
        })),
      };

      console.log('Sending email with sanitized data:', {
        ...sanitizedData,
        contacts: sanitizedData.contacts.map(c => ({ ...c, email: c.email.substring(0, 3) + '***' }))
      });

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: sanitizedData,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to send email. Please try again.');
      }

      console.log('Email sent successfully:', data);
      console.log('=== INVESTOR CONTACT FORM SUBMISSION SUCCESS ===');

      // Track the contacted investor
      await addContactedInvestor(investor.id, investor.investor_name, investor.type);

      // Log successful contact attempt for monitoring
      console.log('Investor contact attempt logged:', {
        investorName: investor.investor_name,
        senderId: user.id,
        contactCount: emailContacts.length,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Message Sent Successfully!",
        description: `Your message has been sent to ${emailContacts.length} contact${emailContacts.length !== 1 ? 's' : ''}.`,
      });

      resetForm();
      return true;

    } catch (error: any) {
      console.error('=== INVESTOR CONTACT FORM SUBMISSION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      
      // Enhanced error messaging based on error type
      let userMessage = error.message;
      if (error.message?.includes('JWT')) {
        userMessage = 'Authentication error. Please try logging out and back in.';
      } else if (error.message?.includes('permission')) {
        userMessage = 'Permission denied. Please check your subscription status.';
      } else if (error.message?.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }

      toast({
        title: "Failed to Send Message",
        description: userMessage || "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
};
