
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedAuthErrorResponse {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  isSuccess?: boolean;
  shouldRetry?: boolean;
  accountLikelyExists?: boolean;
  retryAfter?: number;
}

export const handleEnhancedAuthError = async (
  error: any, 
  action: 'signup' | 'signin',
  email: string
): Promise<EnhancedAuthErrorResponse> => {
  console.log('🔍 Enhanced error processing:', error, 'for action:', action);
  
  // Handle empty error objects or undefined errors
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    return {
      title: "Connection timeout",
      description: "The request timed out. Please try again in a moment.",
      variant: "destructive",
      shouldRetry: true
    };
  }

  const message = error.message || error.error_description || '';
  const status = error.status || 0;

  // Handle existing user errors correctly
  if (message.includes('already registered') || message.includes('already been registered')) {
    return {
      title: "Account already exists",
      description: "An account with this email already exists. Please sign in instead.",
      variant: "destructive",
      accountLikelyExists: true
    };
  }

  // Handle Supabase timeouts and context deadline exceeded
  if (status === 504 || 
      message.includes('context deadline exceeded') || 
      message.includes('request_timeout') ||
      message.includes('Processing this request timed out')) {
    
    if (action === 'signup') {
      return {
        title: "Account creation timeout",
        description: "The request timed out, but your account may have been created. Try signing in, or wait a moment and try again.",
        variant: "default",
        shouldRetry: true
      };
    } else {
      return {
        title: "Sign-in timeout",
        description: "The sign-in request timed out. Please try again.",
        variant: "destructive",
        shouldRetry: true
      };
    }
  }

  // Handle rate limiting
  if (status === 429 || 
      message.includes('rate limit') || 
      message.includes('too many requests') ||
      message.includes('over_email_send_rate_limit')) {
    
    if (action === 'signup') {
      return {
        title: "Account creation rate limited",
        description: "Account creation is temporarily limited. Please wait a moment and try again.",
        variant: "destructive",
        shouldRetry: true
      };
    } else {
      return {
        title: "Too many attempts",
        description: "Please wait a moment before trying to sign in again.",
        variant: "destructive",
        shouldRetry: true
      };
    }
  }

  // Handle invalid credentials
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return {
      title: "Invalid credentials",
      description: "Please check your email and password and try again.",
      variant: "destructive"
    };
  }

  // Handle network errors
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('connection') ||
      message.includes('Failed to fetch')) {
    return {
      title: "Connection problem",
      description: "Please check your internet connection and try again.",
      variant: "destructive",
      shouldRetry: true
    };
  }

  // Default error handling
  return {
    title: action === 'signup' ? "Signup issue" : "Sign-in issue",
    description: message || "An unexpected error occurred. Please try again.",
    variant: "destructive",
    shouldRetry: true
  };
};

// Fixed account existence checking - only return true for actual "Invalid login credentials" errors
export const checkAccountExistence = async (email: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking account existence for:', email);
    
    // Try to sign in with a dummy password to check if account exists
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dummy-password-check-12345'
    });
    
    if (error) {
      // ONLY return true if we get the specific "Invalid login credentials" error
      // This indicates the account exists but the password is wrong
      if (error.message === 'Invalid login credentials') {
        console.log('✅ Account exists - invalid credentials error received');
        return true;
      }
      
      // For any other error, assume account doesn't exist
      console.log('❌ Account does not exist - error:', error.message);
      return false;
    }
    
    // If no error (shouldn't happen with dummy password), assume account exists
    console.log('🤔 No error with dummy password - account might exist');
    return true;
  } catch (error) {
    console.error('💥 Error checking account existence:', error);
    // If we can't check, assume account doesn't exist to allow signup attempt
    return false;
  }
};

// Check if user is currently signed in
export const getCurrentUserSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};
