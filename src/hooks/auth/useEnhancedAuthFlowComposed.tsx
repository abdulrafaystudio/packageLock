
import { useCallback, useState } from 'react';
import { useAuthOperations } from './useAuthOperations';
import { useAuthErrorHandler } from './useAuthErrorHandler';
import { useAuthLogger } from './useAuthLogger';

interface EnhancedAuthFlowConfig {
  enableRetry?: boolean;
  maxRetries?: number;
  enableNetworkErrorHandling?: boolean;
  enableDetailedLogging?: boolean;
}

export const useEnhancedAuthFlow = (config: EnhancedAuthFlowConfig = {}) => {
  const { performSignUp, performSignIn } = useAuthOperations();
  const { handleAuthError } = useAuthErrorHandler();
  const { logAuthFlow } = useAuthLogger(config.enableDetailedLogging);
  const [isProcessing, setIsProcessing] = useState(false);

  const enhancedSignUp = useCallback(async (
    email: string,
    password: string,
    metadata: Record<string, any> = {}
  ) => {
    setIsProcessing(true);
    try {
      logAuthFlow('signup_start', { email, metadata });
      
      const result = await performSignUp(email, password, metadata);
      
      // CRITICAL FIX: Throw error if signup failed
      if (result.error) {
        throw result.error;
      }
      
      logAuthFlow('signup_success', { email });
      return result;
    } catch (error: any) {
      logAuthFlow('signup_error', { email, error: error.message });
      
      // Handle error but still throw it for fallback system
      try {
        await handleAuthError(error, 'signup', email);
      } catch (handleError) {
        console.warn('Error handler failed:', handleError);
      }
      
      // CRITICAL FIX: Re-throw error for fallback system
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [performSignUp, handleAuthError, logAuthFlow]);

  const enhancedSignIn = useCallback(async (
    email: string,
    password: string
  ) => {
    setIsProcessing(true);
    try {
      logAuthFlow('signin_start', { email });
      
      const result = await performSignIn(email, password);
      
      // CRITICAL FIX: Throw error if signin failed
      if (result.error) {
        throw result.error;
      }
      
      logAuthFlow('signin_success', { email });
      return result;
    } catch (error: any) {
      logAuthFlow('signin_error', { email, error: error.message });
      
      // Handle error but still throw it for fallback system
      try {
        await handleAuthError(error, 'signin', email);
      } catch (handleError) {
        console.warn('Error handler failed:', handleError);
      }
      
      // CRITICAL FIX: Re-throw error for fallback system
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [performSignIn, handleAuthError, logAuthFlow]);

  return {
    enhancedSignUp,
    enhancedSignIn,
    isProcessing
  };
};
