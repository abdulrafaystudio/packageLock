
// Simple sanitization function that preserves spaces and normal characters
export const sanitizeForDisplay = (value: string, maxLength: number): string => {
  // Only remove potentially dangerous characters while preserving spaces and normal text
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, maxLength); // Limit length
};

export const sanitizeContactData = (formData: {
  name: string;
  email: string;
  phone: string;
  message: string;
}, dealTitle: string, ownerProfile: any) => {
  return {
    investorName: sanitizeForDisplay(dealTitle, 200),
    senderName: sanitizeForDisplay(formData.name.trim(), 100),
    senderEmail: sanitizeForDisplay(formData.email.trim(), 254),
    senderPhone: sanitizeForDisplay(formData.phone.trim(), 50),
    message: sanitizeForDisplay(formData.message.trim(), 800),
    contacts: [{
      name: sanitizeForDisplay(ownerProfile.full_name || 'Company Owner', 100),
      email: sanitizeForDisplay(ownerProfile.email, 254),
      role: 'Company Owner'
    }],
  };
};
