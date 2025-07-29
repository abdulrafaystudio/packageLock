import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useSecureSubscriptionCore } from './useSecureSubscriptionCore';
import { useOptimizedSubscriptionCheck } from './useOptimizedSubscriptionCheck';
import { SubscriptionStatus } from '@/types/auth';

interface SubscriptionManagerState {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
}

export const useSubscriptionManager = (user: User | null) => {
  const [state, setState] = useState<SubscriptionManagerState>({
    subscriptionStatus: null,
    loading: true,
    error: null
  });

  const requestInProgress = useRef(false);
  const lastCheckTime = useRef<number>(0);
  const DEBOUNCE_DELAY = 500; // 500ms debounce

  const { subscriptionStatus: coreStatus, subscriptionLoading: coreLoading, checkSubscription: coreCheckSubscription } = useSecureSubscriptionCore(user);
  const { optimizedCheck } = useOptimizedSubscriptionCheck(user, coreCheckSubscription);

  // Debounced state update
  const updateState = useCallback((newState: Partial<SubscriptionManagerState>) => {
    const now = Date.now();
    if (now - lastCheckTime.current < DEBOUNCE_DELAY) {
      return;
    }
    lastCheckTime.current = now;

    setState(prevState => ({
      ...prevState,
      ...newState
    }));
  }, []);

  // Coordinated subscription check
  const checkSubscription = useCallback(async () => {
    if (!user || requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;
    try {
      await optimizedCheck();
    } catch (error) {
      console.error('Subscription check failed:', error);
      updateState({ error: 'Failed to check subscription' });
    } finally {
      requestInProgress.current = false;
    }
  }, [user, optimizedCheck, updateState]);

  // Update state when core subscription changes
  useEffect(() => {
    updateState({
      subscriptionStatus: coreStatus,
      loading: coreLoading,
      error: null
    });
  }, [coreStatus, coreLoading, updateState]);

  // Initial check when user changes
  useEffect(() => {
    if (user && !requestInProgress.current) {
      checkSubscription();
    }
  }, [user, checkSubscription]);

  return {
    ...state,
    checkSubscription,
    isChecking: requestInProgress.current
  };
};