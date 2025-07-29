
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseRateLimit, getRateLimitErrorMessage } from '@/utils/security/rateLimit';

export const useRateLimitDetection = () => {
  const { toast } = useToast();

  const handleRateLimitError = useCallback((error: any, action: 'signup' | 'signin' | 'resend') => {
    console.log('Checking for rate limit error:', error);
    
    if (isSupabaseRateLimit(error)) {
      const message = getRateLimitErrorMessage(action);
      
      toast({
        title: "Rate limit exceeded",
        description: message,
        variant: "destructive",
      });
      
      return true; // Indicates rate limit was detected
    }
    
    return false; // Not a rate limit error
  }, [toast]);

  const isRateLimited = useCallback((error: any) => {
    return isSupabaseRateLimit(error);
  }, []);

  return {
    handleRateLimitError,
    isRateLimited
  };
};
