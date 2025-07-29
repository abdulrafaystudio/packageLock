
import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionStatus } from '@/types/auth';

export const useSubscriptionCore = (user: User | null) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const lastSubscriptionFetch = useRef<number>(0);
  const subscriptionInterval = useRef<NodeJS.Timeout | null>(null);
  const hasPerformedInitialFetch = useRef(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionStatus(null);
      return;
    }

    // Rate limiting: only fetch if 30 seconds have passed
    const now = Date.now();
    if (now - lastSubscriptionFetch.current < 30000 && hasPerformedInitialFetch.current) {
      console.log('🔄 Subscription check skipped (rate limited)');
      return;
    }

    try {
      setSubscriptionLoading(true);
      console.log('🔍 Checking subscription status for user:', user.email);
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionStatus(data);
      lastSubscriptionFetch.current = now;
      hasPerformedInitialFetch.current = true;
      console.log('✅ Subscription status updated:', data);
      
    } catch (error: any) {
      console.error('💥 Error checking subscription:', error);
      // Set default free subscription on error
      setSubscriptionStatus({
        subscribed: false,
        subscription_tier: 'free',
        subscription_status: 'active',
        subscription_end: null
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user]);

  // Set up subscription auto-refresh when user is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 30000); // Check every 30 seconds

    subscriptionInterval.current = interval;

    return () => {
      if (subscriptionInterval.current) {
        clearInterval(subscriptionInterval.current);
        subscriptionInterval.current = null;
      }
    };
  }, [user, checkSubscription]);

  // Clear subscription interval on unmount
  useEffect(() => {
    return () => {
      if (subscriptionInterval.current) {
        clearInterval(subscriptionInterval.current);
      }
    };
  }, []);

  return {
    subscriptionStatus,
    subscriptionLoading,
    checkSubscription
  };
};
