
import { useState, useCallback } from 'react';
import { AuthFormData } from '@/types/auth';
import { validateAuthForm } from '@/utils/auth/authValidation';

export const useAuthFormData = (isSignUp: boolean = false) => {
  const [formData, setFormData] = useState<AuthFormData>({
    fullName: '',
    email: '',
    password: '',
    companyName: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  const validateForm = useCallback(() => {
    return validateAuthForm(formData, isSignUp);
  }, [formData, isSignUp]);

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    handleInputChange,
    validateForm
  };
};
