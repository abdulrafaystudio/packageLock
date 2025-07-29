
import { ContactEmailRequest } from './types.ts';

export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequest = (data: ContactEmailRequest): { isValid: boolean; error?: string } => {
  const { investorName, senderName, senderEmail, message } = data;

  // Validate required fields
  if (!investorName || !senderName || !senderEmail || !message) {
    return { isValid: false, error: "Missing required fields" };
  }

  // Validate email format
  if (!validateEmailFormat(senderEmail)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
};

export const getValidEmailContacts = (contacts: ContactEmailRequest['contacts']) => {
  return contacts.filter(contact => 
    contact.email && validateEmailFormat(contact.email)
  );
};
