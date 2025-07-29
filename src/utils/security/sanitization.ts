
// HTML and input sanitization utilities

export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Basic HTML sanitization - escape dangerous characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  // Trim whitespace and limit length
  const trimmed = input.trim().substring(0, maxLength);
  
  // Remove potential script injections
  const cleaned = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return sanitizeHtml(cleaned);
};
