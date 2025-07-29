
// Simplified rate limiting utilities - server-side detection only

// Enhanced error detection for Supabase rate limits (for informational purposes only)
export const isSupabaseRateLimit = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || '';
  const status = error.status || 0;
  
  return (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('email rate limit') ||
    message.includes('Too many requests')
  );
};

// Get user-friendly error messages for rate limits (for informational purposes only)
export const getRateLimitErrorMessage = (action: string, remainingTime?: number): string => {
  const minutes = remainingTime ? Math.ceil(remainingTime / 60) : 5;
  
  switch (action) {
    case 'signup':
      return `To prevent spam, we limit signup attempts. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
    case 'signin':
      return `Too many sign-in attempts. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
    case 'resend':
      return `Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before requesting another verification email.`;
    default:
      return `Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
  }
};
