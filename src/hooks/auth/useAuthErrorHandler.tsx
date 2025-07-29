
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { handleEnhancedAuthError } from '@/utils/auth/enhancedErrorHandling';
import { handleNetworkError } from '@/utils/auth/networkErrorHandler';

export const useAuthErrorHandler = () => {
  const { toast } = useToast();

  const handleAuthError = useCallback(async (
    error: any,
    operationType: string,
    userEmail?: string
  ) => {
    // Try network error handling first
    const networkAnalysis = handleNetworkError(error, operationType);
    
    let errorResponse;
    if (networkAnalysis.shouldRetry) {
      errorResponse = networkAnalysis;
    } else {
      const authType = operationType.includes('sign') ? 
        (operationType.includes('up') ? 'signup' : 'signin') : 'signup';
      errorResponse = await handleEnhancedAuthError(error, authType, userEmail || '');
    }

    toast({
      title: errorResponse.title,
      description: errorResponse.description,
      variant: errorResponse.variant || 'destructive'
    });

    return errorResponse;
  }, [toast]);

  return { handleAuthError };
};
