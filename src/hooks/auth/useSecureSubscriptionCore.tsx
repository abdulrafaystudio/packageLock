
import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionStatus } from '@/types/auth';
import { useOfflineSubscription } from './useOfflineSubscription';
import { useRequestDeduplication } from './useRequestDeduplication';

export const useSecureSubscriptionCore = (user: User | null) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [isStripeUnavailable, setIsStripeUnavailable] = useState(false);
  const [lastSuccessfulCheck, setLastSuccessfulCheck] = useState<Date | null>(null);
  const [gracePeriodActive, setGracePeriodActive] = useState(false);

  // Circuit breaker state
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [lastFailureTime, setLastFailureTime] = useState<Date | null>(null);
  
  const { 
    cachedSubscription, 
    isOfflineMode, 
    cacheSubscriptionData
  } = useOfflineSubscription(user);
  
  const { executeRequest } = useRequestDeduplication();
  
  const retryCount = useRef(0);
  const maxRetries = 3;
  const retryDelay = useRef(1000); // Start with 1 second
  const maxFailures = 3; // Circuit breaker threshold
  const circuitBreakerCooldown = 60000; // 1 minute cooldown

  // Enhanced subscription check with circuit breaker and intelligent caching
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionStatus(null);
      return;
    }

    // Circuit breaker check
    if (circuitBreakerOpen) {
      const timeSinceLastFailure = lastFailureTime ? Date.now() - lastFailureTime.getTime() : 0;
      if (timeSinceLastFailure < circuitBreakerCooldown) {
        console.log('⛔ Circuit breaker open, using cached data');
        if (cachedSubscription) {
          setSubscriptionStatus(cachedSubscription);
        }
        return;
      } else {
        // Reset circuit breaker after cooldown
        setCircuitBreakerOpen(false);
        setFailureCount(0);
        console.log('🔄 Circuit breaker reset after cooldown');
      }
    }

    // Use cached data if offline or if recent check was successful
    if (isOfflineMode && cachedSubscription) {
      console.log('📱 Using cached subscription in offline mode');
      setSubscriptionStatus(cachedSubscription);
      return;
    }

    try {
      const result = await executeRequest(
        async () => {
          setSubscriptionLoading(true);
          console.log('🔍 Checking subscription with enhanced security');

          const { data, error } = await supabase.functions.invoke('check-subscription');
          
          if (error) throw error;
          return data;
        },
        {
          key: `subscription-check-${user.id}`,
          timeout: 15000,
          allowRetry: true
        }
      );

      // Success - reset circuit breaker and error states
      setIsStripeUnavailable(false);
      setCircuitBreakerOpen(false);
      setFailureCount(0);
      retryCount.current = 0;
      retryDelay.current = 1000;
      setLastSuccessfulCheck(new Date());

      // Validate and set subscription data
      const validatedData = validateSubscriptionData(result);
      setSubscriptionStatus(validatedData);
      
      // Cache the successful result
      cacheSubscriptionData(validatedData);
      
      // Check for grace period
      checkGracePeriod(validatedData);
      
      console.log('✅ Subscription check completed successfully');

    } catch (error: any) {
      console.error('💥 Subscription check failed:', error);
      handleSubscriptionError(error);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user, isOfflineMode, cachedSubscription, executeRequest, cacheSubscriptionData]);

  // Validate subscription data structure and content
  const validateSubscriptionData = (data: any): SubscriptionStatus => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid subscription data structure');
    }

    // Validate required fields
    const validated: SubscriptionStatus = {
      subscribed: Boolean(data.subscribed),
      subscription_tier: data.subscription_tier || 'free',
      subscription_status: data.subscription_status || 'active',
      subscription_end: data.subscription_end || null
    };

    // Validate subscription tier
    const validTiers = ['free', 'standard', 'premium', 'enterprise', 'premiumpro'];
    if (!validTiers.includes(validated.subscription_tier)) {
      console.warn('Invalid subscription tier, defaulting to free:', validated.subscription_tier);
      validated.subscription_tier = 'free';
    }

    // Validate subscription status
    const validStatuses = ['active', 'cancelled', 'past_due', 'unpaid'];
    if (!validStatuses.includes(validated.subscription_status)) {
      console.warn('Invalid subscription status, defaulting to active:', validated.subscription_status);
      validated.subscription_status = 'active';
    }

    // Validate subscription end date
    if (validated.subscription_end) {
      const endDate = new Date(validated.subscription_end);
      if (isNaN(endDate.getTime())) {
        console.warn('Invalid subscription end date:', validated.subscription_end);
        validated.subscription_end = null;
      }
    }

    return validated;
  };

  // Handle subscription check errors with circuit breaker and exponential backoff
  const handleSubscriptionError = (error: any) => {
    console.error('💥 Subscription check failed:', error);
    
    // Increment failure count for circuit breaker
    const newFailureCount = failureCount + 1;
    setFailureCount(newFailureCount);
    setLastFailureTime(new Date());
    
    // Open circuit breaker if failure threshold reached
    if (newFailureCount >= maxFailures) {
      setCircuitBreakerOpen(true);
      console.log('⛔ Circuit breaker opened due to repeated failures');
    }
    
    const isNetworkError = error.message?.includes('network') || 
                          error.message?.includes('fetch') ||
                          error.message?.includes('timeout') ||
                          error.message?.includes('rate limited');
    
    const isStripeError = error.message?.includes('stripe') ||
                         error.message?.includes('checkout') ||
                         error.status === 503;

    if (isNetworkError || isStripeError) {
      setIsStripeUnavailable(true);
      
      // Use cached data as fallback
      if (cachedSubscription) {
        console.log('🔄 Using cached subscription due to service unavailability');
        setSubscriptionStatus(cachedSubscription);
        return;
      }
    }

    // Exponential backoff for retries (only if circuit breaker is closed)
    if (!circuitBreakerOpen && retryCount.current < maxRetries) {
      retryCount.current++;
      retryDelay.current = Math.min(retryDelay.current * 2, 30000); // Cap at 30 seconds
      
      console.log(`⏰ Scheduling retry ${retryCount.current}/${maxRetries} in ${retryDelay.current}ms`);
      
      setTimeout(() => {
        checkSubscription();
      }, retryDelay.current);
    } else {
      console.error('❌ Max retries reached or circuit breaker open, using fallback subscription state');
      
      // Final fallback - set minimal free subscription
      const fallbackSubscription: SubscriptionStatus = {
        subscribed: false,
        subscription_tier: 'free',
        subscription_status: 'active',
        subscription_end: null
      };
      
      setSubscriptionStatus(fallbackSubscription);
      cacheSubscriptionData && cacheSubscriptionData(fallbackSubscription);
    }
  };

  // Check if user is in grace period
  const checkGracePeriod = (subscription: SubscriptionStatus) => {
    if (subscription.subscription_status === 'past_due' && subscription.subscription_end) {
      const endDate = new Date(subscription.subscription_end);
      const gracePeriodEnd = new Date(endDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days grace
      const now = new Date();
      
      const inGracePeriod = now < gracePeriodEnd;
      setGracePeriodActive(inGracePeriod);
      
      if (inGracePeriod) {
        console.log('⏰ User is in grace period until:', gracePeriodEnd);
      }
    } else {
      setGracePeriodActive(false);
    }
  };

  // Enhanced feature access check with offline support
  const checkFeatureAccess = useCallback(async (
    feature: string, 
    requiredTier: string = 'premium'
  ) => {
    const currentSubscription = subscriptionStatus || cachedSubscription;
    
    if (!currentSubscription) {
      return {
        hasAccess: false,
        reason: 'subscription_unknown',
        degradedMode: isOfflineMode || isStripeUnavailable
      };
    }

    // Check if subscription is active or in grace period
    const hasActiveSubscription = currentSubscription.subscribed || 
      (gracePeriodActive && currentSubscription.subscription_status === 'past_due');

    if (!hasActiveSubscription) {
      return {
        hasAccess: false,
        reason: 'subscription_inactive',
        degradedMode: isOfflineMode || isStripeUnavailable
      };
    }

    // Tier-based access control
    const tierHierarchy = ['free', 'standard', 'premium', 'enterprise', 'premiumpro'];
    const currentTierIndex = tierHierarchy.indexOf(currentSubscription.subscription_tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    const hasAccess = currentTierIndex >= requiredTierIndex;

    return {
      hasAccess,
      reason: hasAccess ? 'access_granted' : 'insufficient_tier',
      currentTier: currentSubscription.subscription_tier,
      requiredTier,
      degradedMode: isOfflineMode || isStripeUnavailable,
      gracePeriodActive
    };
  }, [subscriptionStatus, cachedSubscription, isOfflineMode, isStripeUnavailable, gracePeriodActive]);

  // Initialize subscription check on user change
  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscriptionStatus(null);
      setIsStripeUnavailable(false);
      setGracePeriodActive(false);
    }
  }, [user, checkSubscription]);

  return {
    subscriptionStatus,
    subscriptionLoading,
    isStripeUnavailable,
    isOfflineMode,
    lastSuccessfulCheck,
    gracePeriodActive,
    checkSubscription,
    checkFeatureAccess
  };
};
