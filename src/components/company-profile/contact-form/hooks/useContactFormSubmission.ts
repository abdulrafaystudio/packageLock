
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/useDeals';
import { sanitizeContactData } from '../utils/sanitization';
import { validateProfileCompleteness } from '../utils/profileValidation';
import { sendContactEmail } from '../services/emailService';
import { getDealOwnerProfile } from '../services/profileService';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export const useContactFormSubmission = (deal: Deal) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async (formData: ContactFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to contact companies.",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      console.log('=== CONTACT FORM SUBMISSION START ===');
      console.log('Deal ID:', deal.id);
      console.log('Deal Owner User ID:', deal.user_id);
      console.log('Current User ID:', user.id);
      console.log('Deal Status:', deal.status);

      // Verify the deal is active
      if (deal.status !== 'Active') {
        console.warn('Deal is not active:', deal.status);
        throw new Error('This deal is no longer active and cannot be contacted.');
      }

      // Prevent users from contacting themselves
      if (deal.user_id === user.id) {
        console.warn('User trying to contact themselves');
        throw new Error('You cannot contact your own deal.');
      }

      // Get the deal owner's profile information with enhanced error handling
      const ownerProfile = await getDealOwnerProfile(deal.user_id);

      // Validate profile completeness
      const { isValid, missingFields } = validateProfileCompleteness(ownerProfile);
      if (!isValid) {
        console.error('Incomplete profile for deal owner:', { 
          profileId: ownerProfile.id, 
          missingFields 
        });
        const fieldText = missingFields.join(' and ');
        throw new Error(`Company owner has not provided their ${fieldText}. Please try contacting them through other means or ask them to complete their profile.`);
      }

      console.log('Profile validation passed. Contact email:', ownerProfile.email);

      // Final sanitization before sending
      const sanitizedData = sanitizeContactData(formData, deal.title, ownerProfile);

      // Send email
      await sendContactEmail(sanitizedData);

      console.log('=== CONTACT FORM SUBMISSION SUCCESS ===');

      // Log successful contact attempt for monitoring
      console.log('Contact attempt logged:', {
        dealId: deal.id,
        senderId: user.id,
        recipientId: deal.user_id,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Message Sent Successfully!",
        description: "Your message has been sent to the company owner.",
      });

      return true;

    } catch (error: any) {
      console.error('=== CONTACT FORM SUBMISSION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Enhanced error messaging based on error type
      let userMessage = error.message;
      if (error.message?.includes('JWT')) {
        userMessage = 'Authentication error. Please try logging out and back in.';
      } else if (error.message?.includes('permission')) {
        userMessage = 'Permission denied. The company owner may have restricted contact access.';
      } else if (error.message?.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }

      toast({
        title: "Failed to Send Message",
        description: userMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitForm,
    isSubmitting
  };
};
