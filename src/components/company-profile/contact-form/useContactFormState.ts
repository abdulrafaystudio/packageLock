
import { useState } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

// Simple sanitization function that preserves spaces and normal characters
const sanitizeForDisplay = (value: string, maxLength: number): string => {
  // Only remove potentially dangerous characters while preserving spaces and normal text
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, maxLength); // Limit length
};

export const useContactFormState = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    // Use lighter sanitization that preserves spaces and normal typing
    const sanitizedValue = sanitizeForDisplay(value, field === 'message' ? 800 : 200);
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
    setErrors({});
  };

  const setFormErrors = (newErrors: Partial<ContactFormData>) => {
    setErrors(newErrors);
  };

  return {
    formData,
    errors,
    handleInputChange,
    resetForm,
    setFormErrors
  };
};
