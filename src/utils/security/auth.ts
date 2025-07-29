
export const validateAuthForm = (formData: { 
  email: string; 
  password: string; 
  fullName?: string;
  companyName?: string;
}) => {
  const errors: Record<string, string> = {};

  // Email validation
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  // Sign-up specific validations
  if (formData.fullName !== undefined) {
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};
