
import { useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface SubscriptionCheckOptions {
  minInterval: number; // Minimum time between checks in milliseconds
  maxRetries: number;
  backoffMultiplier: number;
}

export const useOptimizedSubscriptionCheck = (
  user: User | null,
  checkSubscription: () => Promise<void>,
  options: SubscriptionCheckOptions = {
    minInterval: 60000, // 1 minute
    maxRetries: 3,
    backoffMultiplier: 2
  }
) => {
  const lastCheckTime = useRef<number>(0);
  const isChecking = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const optimizedCheck = useCallback(async (forceCheck: boolean = false) => {
    if (!user) {
      console.log('⏭️ No user, skipping subscription check');
      return;
    }

    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime.current;

    // Skip if too soon and not forced
    if (!forceCheck && timeSinceLastCheck < options.minInterval) {
      console.log(`⏸️ Skipping check, last check was ${Math.round(timeSinceLastCheck / 1000)}s ago`);
      return;
    }

    // Skip if already checking
    if (isChecking.current) {
      console.log('⏸️ Subscription check already in progress');
      return;
    }

    try {
      isChecking.current = true;
      lastCheckTime.current = now;
      
      console.log('🔄 Starting optimized subscription check');
      await checkSubscription();
      
      // Reset retry count on success
      retryCount.current = 0;
      console.log('✅ Optimized subscription check completed');
      
    } catch (error) {
      console.error('❌ Optimized subscription check failed:', error);
      
      // Implement exponential backoff for retries
      if (retryCount.current < options.maxRetries) {
        retryCount.current++;
        const delay = Math.min(
          options.minInterval * Math.pow(options.backoffMultiplier, retryCount.current - 1),
          300000 // Max 5 minutes
        );
        
        console.log(`🔄 Scheduling retry ${retryCount.current}/${options.maxRetries} in ${Math.round(delay / 1000)}s`);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          optimizedCheck(true);
        }, delay);
      } else {
        console.error('❌ Max retries reached for subscription check');
        retryCount.current = 0;
      }
    } finally {
      isChecking.current = false;
    }
  }, [user, checkSubscription, options]);

  const cancelPendingRetries = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    retryCount.current = 0;
  }, []);

  const getCheckStatus = useCallback(() => ({
    isChecking: isChecking.current,
    lastCheckTime: lastCheckTime.current,
    retryCount: retryCount.current,
    canCheck: !isChecking.current && (Date.now() - lastCheckTime.current) >= options.minInterval
  }), [options.minInterval]);

  return {
    optimizedCheck,
    cancelPendingRetries,
    getCheckStatus
  };
};
