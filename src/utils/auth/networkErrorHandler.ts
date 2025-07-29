
// Enhanced network error handling for authentication flows
import { EnhancedAuthErrorResponse } from './enhancedErrorHandling';

export interface NetworkErrorDetails {
  isNetworkError: boolean;
  isTimeoutError: boolean;
  isRateLimitError: boolean;
  isServerError: boolean;
  originalError: any;
  userFriendlyMessage: string;
  technicalMessage: string;
  shouldRetry: boolean;
  retryAfter?: number;
}

export const analyzeNetworkError = (error: any): NetworkErrorDetails => {
  const message = (error?.message || '').toLowerCase();
  const status = error?.status || 0;
  
  // Network connectivity errors
  const isNetworkError = 
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    status === 0;
    
  // Timeout errors
  const isTimeoutError = 
    message.includes('timeout') ||
    message.includes('context deadline exceeded') ||
    message.includes('request_timeout') ||
    status === 504;
    
  // Rate limiting errors
  const isRateLimitError = 
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('over_email_send_rate_limit');
    
  // Server errors
  const isServerError = status >= 500 && status < 600;
  
  // Extract retry-after header if present
  const retryAfter = error?.headers?.['retry-after'] || 
                    error?.response?.headers?.['retry-after'];
  
  let userFriendlyMessage: string;
  let shouldRetry = false;
  
  if (isNetworkError) {
    userFriendlyMessage = 'Connection issue detected. Please check your internet connection and try again.';
    shouldRetry = true;
  } else if (isTimeoutError) {
    userFriendlyMessage = 'The request timed out. Please try again in a moment.';
    shouldRetry = true;
  } else if (isRateLimitError) {
    const waitTime = retryAfter ? `${retryAfter} seconds` : 'a moment';
    userFriendlyMessage = `Too many requests. Please wait ${waitTime} before trying again.`;
    shouldRetry = true;
  } else if (isServerError) {
    userFriendlyMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
    shouldRetry = true;
  } else {
    userFriendlyMessage = error?.message || 'An unexpected error occurred. Please try again.';
    shouldRetry = false;
  }
  
  return {
    isNetworkError,
    isTimeoutError,
    isRateLimitError,
    isServerError,
    originalError: error,
    userFriendlyMessage,
    technicalMessage: error?.message || 'Unknown error',
    shouldRetry,
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined
  };
};

export const handleNetworkError = (error: any, action: string): EnhancedAuthErrorResponse => {
  const analysis = analyzeNetworkError(error);
  
  console.error(`🌐 Network error during ${action}:`, {
    analysis,
    originalError: error
  });
  
  return {
    title: getErrorTitle(analysis, action),
    description: analysis.userFriendlyMessage,
    variant: 'destructive',
    shouldRetry: analysis.shouldRetry,
    retryAfter: analysis.retryAfter
  };
};

const getErrorTitle = (analysis: NetworkErrorDetails, action: string): string => {
  if (analysis.isNetworkError) return 'Connection Problem';
  if (analysis.isTimeoutError) return 'Request Timeout';
  if (analysis.isRateLimitError) return 'Rate Limit Exceeded';
  if (analysis.isServerError) return 'Server Error';
  return `${action} Error`;
};
