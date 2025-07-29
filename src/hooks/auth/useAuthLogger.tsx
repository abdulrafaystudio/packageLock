
import { useCallback } from 'react';

export const useAuthLogger = (enableLogging: boolean = true) => {
  const logAuthFlow = useCallback((stage: string, data: any) => {
    if (enableLogging) {
      console.log(`🔐 Auth Flow [${stage}]:`, data);
    }
  }, [enableLogging]);

  return { logAuthFlow };
};
