
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupportFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const useSupportTicket = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitSupportTicket = async (formData: SupportFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-support-email', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Support Ticket Created",
        description: `Your ticket ${data.ticketNumber} has been created. You'll receive a confirmation email shortly.`,
      });

      return { success: true, ticketNumber: data.ticketNumber };
    } catch (error: any) {
      console.error('Error submitting support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitSupportTicket,
    isSubmitting,
  };
};
