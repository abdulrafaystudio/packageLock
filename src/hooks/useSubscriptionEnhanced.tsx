import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  subscription_status: string;
  subscription_end: string | null;
  loading: boolean;
  error: string | null;
  lastChecked: number | null;
  canRetry: boolean;
}

interface RetryState {
  count: number;
  nextRetryTime: number | null;
  exponentialBackoff: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 2000; // 2 seconds

export const useSubscriptionEnhanced = () => {
  const { user, loading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: 'free',
    subscription_status: 'active',
    subscription_end: null,
    loading: false,
    error: null,
    lastChecked: null,
    canRetry: true,
  });
  
  const [retryState, setRetryState] = useState<RetryState>({
    count: 0,
    nextRetryTime: null,
    exponentialBackoff: INITIAL_BACKOFF,
  });

  // Check if we can proceed based on circuit breaker state
  const checkCircuitBreaker = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('check_circuit_breaker', {
        p_service_name: 'subscription_check',
        p_failure_threshold: 5,
        p_timeout_seconds: 60
      });
      
      // Type guard for the data response
      const typedData = data as { can_proceed?: boolean } | null;
      return typedData?.can_proceed ?? true;
    } catch (error) {
      console.warn('Circuit breaker check failed:', error);
      return true; // Default to allowing requests if check fails
    }
  }, []);

  // Record success for circuit breaker
  const recordSuccess = useCallback(async () => {
    try {
      await supabase.rpc('record_circuit_breaker_success', {
        p_service_name: 'subscription_check'
      });
      await supabase.rpc('mark_retry_resolved', {
        p_service_name: 'subscription_check',
        p_operation_type: 'fetch_subscription',
        p_user_id: user?.id
      });
    } catch (error) {
      console.warn('Failed to record success:', error);
    }
  }, [user?.id]);

  // Record failure for circuit breaker
  const recordFailure = useCallback(async (errorMessage: string) => {
    try {
      await supabase.rpc('record_circuit_breaker_failure', {
        p_service_name: 'subscription_check',
        p_failure_threshold: 5,
        p_timeout_seconds: 60
      });
      
      const retryData = await supabase.rpc('schedule_retry_with_backoff', {
        p_service_name: 'subscription_check',
        p_operation_type: 'fetch_subscription',
        p_error_message: errorMessage,
        p_user_id: user?.id,
        p_max_retries: MAX_RETRIES
      });

      if (retryData.data) {
        // Type guard for the retry response
        const typedRetryData = retryData.data as {
          retry_count?: number;
          next_retry_time?: string;
          backoff_seconds?: number;
          should_retry?: boolean;
        };
        
        setRetryState({
          count: typedRetryData.retry_count || 0,
          nextRetryTime: typedRetryData.next_retry_time ? new Date(typedRetryData.next_retry_time).getTime() : null,
          exponentialBackoff: (typedRetryData.backoff_seconds || 2) * 1000,
        });
        
        setSubscriptionData(prev => ({
          ...prev,
          canRetry: typedRetryData.should_retry ?? true
        }));
      }
    } catch (error) {
      console.warn('Failed to record failure:', error);
    }
  }, [user?.id]);

  // Check if cached data is still valid
  const isCacheValid = useCallback(() => {
    if (!subscriptionData.lastChecked) return false;
    return Date.now() - subscriptionData.lastChecked < CACHE_DURATION;
  }, [subscriptionData.lastChecked]);

  // Check if we should retry based on exponential backoff
  const canRetryNow = useCallback(() => {
    if (retryState.count >= MAX_RETRIES) return false;
    if (!retryState.nextRetryTime) return true;
    return Date.now() >= retryState.nextRetryTime;
  }, [retryState]);

  // Main function to check subscription
  const checkSubscription = useCallback(async (forceRefresh = false): Promise<void> => {
    // Return early if no user or still loading
    if (!user || authLoading) {
      setSubscriptionData(prev => ({ ...prev, loading: false }));
      return;
    }

    // Check cache validity
    if (!forceRefresh && isCacheValid()) {
      console.log('📋 Using cached subscription data');
      return;
    }

    // Check retry state
    if (!canRetryNow() && !forceRefresh) {
      const waitTime = retryState.nextRetryTime ? Math.ceil((retryState.nextRetryTime - Date.now()) / 1000) : 0;
      console.log(`⏳ Waiting ${waitTime}s before next retry`);
      setSubscriptionData(prev => ({
        ...prev,
        error: `Please wait ${waitTime} seconds before retrying`,
        loading: false
      }));
      return;
    }

    // Check circuit breaker
    const canProceed = await checkCircuitBreaker();
    if (!canProceed && !forceRefresh) {
      console.log('🔒 Circuit breaker is open, skipping request');
      setSubscriptionData(prev => ({
        ...prev,
        error: 'Service temporarily unavailable. Please try again later.',
        loading: false,
        canRetry: false
      }));
      return;
    }

    setSubscriptionData(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }));

    try {
      console.log('🔄 Checking subscription status...');
      
      const response = await supabase.functions.invoke('check-subscription', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to check subscription');
      }

      const data = response.data;
      
      if (data.error) {
        throw new Error(data.message || 'Subscription check failed');
      }

      // Cache the result in localStorage with timestamp
      const cacheData = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem('subscription_cache', JSON.stringify(cacheData));

      setSubscriptionData({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'free',
        subscription_status: data.subscription_status || 'active',
        subscription_end: data.subscription_end || null,
        loading: false,
        error: null,
        lastChecked: Date.now(),
        canRetry: true,
      });

      // Reset retry state on success
      setRetryState({
        count: 0,
        nextRetryTime: null,
        exponentialBackoff: INITIAL_BACKOFF,
      });

      await recordSuccess();
      console.log('✅ Subscription data updated successfully');

    } catch (error) {
      console.error('❌ Subscription check failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setSubscriptionData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      await recordFailure(errorMessage);

      // Show user-friendly error toast
      if (retryState.count < MAX_RETRIES) {
        toast.error(`Subscription check failed. Retrying in ${Math.ceil(retryState.exponentialBackoff / 1000)} seconds...`);
      } else {
        toast.error('Unable to verify subscription status. Please refresh the page or contact support.');
      }
    }
  }, [user, authLoading, isCacheValid, canRetryNow, checkCircuitBreaker, recordSuccess, recordFailure, retryState]);

  // Manual retry function with user feedback
  const retrySubscriptionCheck = useCallback(() => {
    if (!subscriptionData.canRetry) {
      toast.warning('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    if (!canRetryNow()) {
      const waitTime = retryState.nextRetryTime ? Math.ceil((retryState.nextRetryTime - Date.now()) / 1000) : 0;
      toast.warning(`Please wait ${waitTime} seconds before retrying.`);
      return;
    }

    toast.info('Retrying subscription check...');
    checkSubscription(true);
  }, [subscriptionData.canRetry, canRetryNow, retryState.nextRetryTime, checkSubscription]);

  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem('subscription_cache');
    if (cached) {
      try {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
          setSubscriptionData({
            subscribed: cacheData.subscribed || false,
            subscription_tier: cacheData.subscription_tier || 'free',
            subscription_status: cacheData.subscription_status || 'active',
            subscription_end: cacheData.subscription_end || null,
            loading: false,
            error: null,
            lastChecked: cacheData.timestamp,
            canRetry: true,
          });
          console.log('💾 Loaded cached subscription data');
        }
      } catch (error) {
        console.warn('Failed to parse cached subscription data:', error);
        localStorage.removeItem('subscription_cache');
      }
    }
  }, []);

  // Initial check and periodic refresh
  useEffect(() => {
    if (!user || authLoading) return;

    // Initial check
    checkSubscription();

    // Set up periodic refresh (every 15 minutes)
    const interval = setInterval(() => {
      if (!isCacheValid()) {
        checkSubscription();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, authLoading, checkSubscription, isCacheValid]);

  return {
    ...subscriptionData,
    refresh: () => checkSubscription(true),
    retry: retrySubscriptionCheck,
    retryCount: retryState.count,
    nextRetryTime: retryState.nextRetryTime,
  };
};