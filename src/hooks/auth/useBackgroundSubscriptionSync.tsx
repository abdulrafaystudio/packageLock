
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BackgroundSyncConfig {
  intervalMinutes: number;
  enabled: boolean;
  notifyOnDiscrepancy: boolean;
}

export const useBackgroundSubscriptionSync = (
  config: BackgroundSyncConfig = {
    intervalMinutes: 15,
    enabled: true,
    notifyOnDiscrepancy: true
  }
) => {
  const { user, subscriptionStatus, checkSubscription } = useAuth();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  const performBackgroundSync = useCallback(async () => {
    if (!user || !config.enabled) return;

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncRef.current;
    const minInterval = config.intervalMinutes * 60 * 1000;

    // Skip if too soon
    if (timeSinceLastSync < minInterval) return;

    try {
      console.log('🔄 Background subscription sync starting');
      const currentStatus = subscriptionStatus;
      
      // Trigger subscription check
      await checkSubscription();
      
      lastSyncRef.current = now;
      console.log('✅ Background subscription sync completed');

      // Note: We can't directly compare here since checkSubscription is async
      // and state updates are also async. Discrepancy detection would need
      // to be handled in the subscription check logic itself.

    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  }, [user, config, subscriptionStatus, checkSubscription]);

  // Set up background sync interval
  useEffect(() => {
    if (!config.enabled || !user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    const intervalMs = config.intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(performBackgroundSync, intervalMs);

    console.log(`🔄 Background sync enabled (${config.intervalMinutes} min intervals)`);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [config.enabled, config.intervalMinutes, user, performBackgroundSync]);

  // Perform initial sync after a delay
  useEffect(() => {
    if (user && config.enabled) {
      const initialSyncDelay = 30000; // 30 seconds after login
      const timeoutId = setTimeout(performBackgroundSync, initialSyncDelay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, config.enabled, performBackgroundSync]);

  return {
    performSync: performBackgroundSync,
    isEnabled: config.enabled,
    nextSyncIn: config.enabled ? Math.max(0, (config.intervalMinutes * 60 * 1000) - (Date.now() - lastSyncRef.current)) : 0
  };
};
