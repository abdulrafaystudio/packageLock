
import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionStatus } from '@/types/auth';

interface CachedSubscriptionData {
  subscriptionStatus: SubscriptionStatus;
  timestamp: number;
  sessionId: string;
}

interface SmartCacheConfig {
  ttlMinutes: number;
  sessionKey: string;
  storageKey: string;
}

export const useSmartSubscriptionCache = (
  user: User | null,
  config: SmartCacheConfig = {
    ttlMinutes: 5,
    sessionKey: 'subscription_session_check',
    storageKey: 'easyfund_subscription_cache'
  }
) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  
  const sessionId = useRef<string>('');
  const isChecking = useRef<boolean>(false);

  // Generate session ID on mount
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Load cached data on mount
  useEffect(() => {
    if (user) {
      loadFromCache();
    }
  }, [user]);

  const loadFromCache = useCallback(() => {
    if (!user) return false;

    try {
      // Check session storage first (fastest)
      const sessionChecked = sessionStorage.getItem(config.sessionKey);
      if (sessionChecked === sessionId.current) {
        console.log('📋 Subscription already checked this session');
        return true;
      }

      // Check localStorage cache
      const cached = localStorage.getItem(config.storageKey);
      if (cached) {
        const cachedData: CachedSubscriptionData = JSON.parse(cached);
        const now = Date.now();
        const cacheAge = now - cachedData.timestamp;
        const ttlMs = config.ttlMinutes * 60 * 1000;

        if (cacheAge < ttlMs) {
          console.log('💾 Using cached subscription data', { ageMinutes: Math.round(cacheAge / 60000) });
          setSubscriptionStatus(cachedData.subscriptionStatus);
          setLastCheckTime(cachedData.timestamp);
          return true;
        } else {
          console.log('⏰ Cache expired, clearing', { ageMinutes: Math.round(cacheAge / 60000) });
          localStorage.removeItem(config.storageKey);
        }
      }
    } catch (error) {
      console.error('Cache load error:', error);
      localStorage.removeItem(config.storageKey);
    }

    return false;
  }, [user, config]);

  const saveToCache = useCallback((data: SubscriptionStatus) => {
    if (!user) return;

    try {
      const cacheData: CachedSubscriptionData = {
        subscriptionStatus: data,
        timestamp: Date.now(),
        sessionId: sessionId.current
      };

      // Save to localStorage
      localStorage.setItem(config.storageKey, JSON.stringify(cacheData));
      
      // Mark session as checked
      sessionStorage.setItem(config.sessionKey, sessionId.current);
      
      console.log('💾 Cached subscription data');
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }, [user, config]);

  const checkSubscription = useCallback(async (forceCheck: boolean = false) => {
    if (!user || isChecking.current) {
      return;
    }

    // Skip if not forced and cache is valid
    if (!forceCheck && loadFromCache()) {
      return;
    }

    isChecking.current = true;
    setLoading(true);

    try {
      console.log('🔍 Fetching fresh subscription data');
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw error;
      }

      const validatedData: SubscriptionStatus = {
        subscribed: Boolean(data.subscribed),
        subscription_tier: data.subscription_tier || 'free',
        subscription_status: data.subscription_status || 'active',
        subscription_end: data.subscription_end || null
      };

      setSubscriptionStatus(validatedData);
      setLastCheckTime(Date.now());
      saveToCache(validatedData);

      console.log('✅ Subscription data updated', validatedData);

    } catch (error) {
      console.error('❌ Subscription check failed:', error);
      
      // Try to use stale cache on error
      const staleCache = localStorage.getItem(config.storageKey);
      if (staleCache && !subscriptionStatus) {
        try {
          const cachedData: CachedSubscriptionData = JSON.parse(staleCache);
          setSubscriptionStatus(cachedData.subscriptionStatus);
          console.log('📦 Using stale cache due to error');
        } catch {}
      }
    } finally {
      setLoading(false);
      isChecking.current = false;
    }
  }, [user, loadFromCache, saveToCache, subscriptionStatus]);

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(config.storageKey);
    sessionStorage.removeItem(config.sessionKey);
    console.log('🗑️ Cache invalidated');
  }, [config]);

  const getCacheStatus = useCallback(() => {
    const cached = localStorage.getItem(config.storageKey);
    const sessionChecked = sessionStorage.getItem(config.sessionKey);
    
    if (!cached) return { status: 'empty' };
    
    try {
      const cachedData: CachedSubscriptionData = JSON.parse(cached);
      const age = Date.now() - cachedData.timestamp;
      const ttlMs = config.ttlMinutes * 60 * 1000;
      
      return {
        status: age < ttlMs ? 'valid' : 'expired',
        ageMinutes: Math.round(age / 60000),
        sessionChecked: sessionChecked === sessionId.current
      };
    } catch {
      return { status: 'invalid' };
    }
  }, [config]);

  return {
    subscriptionStatus,
    loading,
    lastCheckTime,
    checkSubscription,
    invalidateCache,
    getCacheStatus,
    isChecking: isChecking.current
  };
};
