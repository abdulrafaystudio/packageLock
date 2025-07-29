
// Enhanced rate limiting utilities with comprehensive error detection

export const isSupabaseRateLimit = (error: any): boolean => {
  if (!error) return false;
  
  const message = (error.message || '').toLowerCase();
  const status = error.status || 0;
  
  // Comprehensive rate limit detection
  return (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('email rate limit') ||
    message.includes('too many sign') ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('signup disabled') ||
    message.includes('request_timeout') ||
    status === 504 // Gateway timeout often indicates rate limiting
  );
};

export const getRateLimitErrorMessage = (action: string, remainingTime?: number): string => {
  const minutes = remainingTime ? Math.ceil(remainingTime / 60) : 5;
  
  switch (action) {
    case 'signup':
      return `Account creation is temporarily limited. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again or contact support if this persists.`;
    case 'signin':
      return `Too many sign-in attempts detected. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
    case 'resend':
      return `Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before requesting another verification email.`;
    default:
      return `Request limit reached. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
  }
};

export const getNetworkErrorMessage = (error: any): string => {
  const message = (error.message || '').toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection issue detected. Please check your internet connection and try again.';
  }
  
  if (message.includes('timeout') || message.includes('deadline exceeded')) {
    return 'Request timed out. This may be due to server load. Please try again in a moment.';
  }
  
  return 'Connection error occurred. Please try again.';
};
