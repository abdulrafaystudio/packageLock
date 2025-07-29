
import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { SubscriptionStatus } from '@/types/auth';

interface CachedSubscriptionData {
  subscriptionStatus: SubscriptionStatus | null;
  timestamp: number;
  userId: string;
}

const CACHE_KEY = 'subscription_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOfflineSubscription = (user: User | null) => {
  const [cachedSubscription, setCachedSubscription] = useState<SubscriptionStatus | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastOnlineCheck, setLastOnlineCheck] = useState<number>(Date.now());

  // Load cached subscription data
  const loadCachedData = useCallback(() => {
    if (!user) return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedSubscriptionData = JSON.parse(cached);
      
      // Check if cache is for current user and still valid
      if (parsedCache.userId === user.id && 
          (Date.now() - parsedCache.timestamp) < CACHE_DURATION) {
        console.log('📦 Using cached subscription data');
        return parsedCache.subscriptionStatus;
      }
      
      // Clear expired cache
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error loading cached subscription:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, [user]);

  // Save subscription data to cache
  const cacheSubscriptionData = useCallback((subscriptionStatus: SubscriptionStatus | null) => {
    if (!user) return;

    try {
      const cacheData: CachedSubscriptionData = {
        subscriptionStatus,
        timestamp: Date.now(),
        userId: user.id
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Cached subscription data');
    } catch (error) {
      console.error('Error caching subscription data:', error);
    }
  }, [user]);

  // Check network connectivity
  const checkNetworkStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    const timeSinceLastCheck = Date.now() - lastOnlineCheck;
    
    // Consider offline if no network or haven't checked in 10 minutes
    const shouldBeOffline = !isOnline || timeSinceLastCheck > 10 * 60 * 1000;
    
    if (shouldBeOffline !== isOfflineMode) {
      setIsOfflineMode(shouldBeOffline);
      console.log(shouldBeOffline ? '📴 Entering offline mode' : '🌐 Back online');
    }

    if (isOnline) {
      setLastOnlineCheck(Date.now());
    }
  }, [isOfflineMode, lastOnlineCheck]);

  // Initialize cached data and network monitoring
  useEffect(() => {
    const cached = loadCachedData();
    if (cached) {
      setCachedSubscription(cached);
    }

    // Monitor network status
    const handleOnline = () => {
      setIsOfflineMode(false);
      setLastOnlineCheck(Date.now());
      console.log('🌐 Network connection restored');
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
      console.log('📴 Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check network status periodically
    const networkCheckInterval = setInterval(checkNetworkStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(networkCheckInterval);
    };
  }, [loadCachedData, checkNetworkStatus]);

  // Clear cache when user changes
  useEffect(() => {
    if (!user) {
      localStorage.removeItem(CACHE_KEY);
      setCachedSubscription(null);
    }
  }, [user]);

  return {
    cachedSubscription,
    isOfflineMode,
    cacheSubscriptionData,
    loadCachedData
  };
};
