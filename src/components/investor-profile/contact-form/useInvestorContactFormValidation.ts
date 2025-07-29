
import { 
  validateEmail, 
  validatePhoneNumber, 
  validateTextLength
} from '@/utils/security';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export const useInvestorContactFormValidation = () => {
  const validateForm = (formData: ContactFormData): { isValid: boolean; errors: Partial<ContactFormData> } => {
    const newErrors: Partial<ContactFormData> = {};

    // Validate name
    if (!validateTextLength(formData.name.trim(), 2, 100)) {
      newErrors.name = 'Name must be between 2 and 100 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone (optional but must be valid if provided)
    if (formData.phone.trim() && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate message
    if (!validateTextLength(formData.message.trim(), 10, 800)) {
      newErrors.message = 'Message must be between 10 and 800 characters';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };

  return { validateForm };
};
