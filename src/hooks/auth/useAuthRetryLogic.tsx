
import { useCallback } from 'react';
import { useRequestDeduplication } from './useRequestDeduplication';

export const useAuthRetryLogic = (isSignUp: boolean, performAuthAction: Function) => {
  const { executeRequest, clearRequest } = useRequestDeduplication();

  const handleRetry = useCallback(async (
    data: any, 
    originalError: any, 
    retryCount: number = 0
  ): Promise<any> => {
    if (retryCount >= 2) {
      throw originalError;
    }

    console.log(`🔄 Retrying request (attempt ${retryCount + 1})`);
    
    // Wait before retry with exponential backoff
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    
    // Clear the request key to allow retry
    const requestKey = `auth_${isSignUp ? 'signup' : 'signin'}_${data.email}`;
    clearRequest(requestKey);
    
    try {
      return await executeRequest(
        () => performAuthAction(data),
        { key: requestKey, timeout: 30000, allowRetry: true }
      );
    } catch (error) {
      return handleRetry(data, error, retryCount + 1);
    }
  }, [isSignUp, executeRequest, clearRequest, performAuthAction]);

  return { handleRetry };
};
