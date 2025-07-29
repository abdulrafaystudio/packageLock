
import { useState, useEffect, useCallback } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export const useInvestorContactFormState = (investorId: string) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const draftKey = `investor_contact_draft_${investorId}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
      }
    } catch (error) {
      console.warn('Failed to load contact form draft:', error);
    }
  }, [draftKey]);

  // Save draft to localStorage when form data changes
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    } catch (error) {
      console.warn('Failed to save contact form draft:', error);
    }
  }, [formData, draftKey]);

  const handleInputChange = useCallback((field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);

  const setFormErrors = useCallback((newErrors: ContactFormErrors) => {
    setErrors(newErrors);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
    setErrors({});
    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.warn('Failed to clear contact form draft:', error);
    }
  }, [draftKey]);

  return {
    formData,
    errors,
    handleInputChange,
    setFormErrors,
    resetForm,
  };
};
