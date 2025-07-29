
import { createContext, useContext, useEffect, useCallback } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthCore } from '@/hooks/auth/useAuthCore';
import { useSmartSubscriptionCache } from '@/hooks/auth/useSmartSubscriptionCache';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { useFeatureAccess } from '@/hooks/auth/useFeatureAccess';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading, signOut, refreshAuthState } = useAuthCore();
  
  // Smart subscription caching with 5-minute TTL
  const {
    subscriptionStatus,
    loading: subscriptionLoading,
    checkSubscription,
    invalidateCache
  } = useSmartSubscriptionCache(user, {
    ttlMinutes: 5,
    sessionKey: 'subscription_session_check',
    storageKey: 'easyfund_subscription_cache'
  });
  
  // Permission calculations
  const { packageType, hasActiveSubscription, permissions } = usePermissions(
    subscriptionStatus,
    null, // userProfile now comes from ProfileProvider
    false // isAdmin now comes from ProfileProvider
  );
  
  // Feature access checking
  const { checkFeatureAccess, getUpgradeInfo } = useFeatureAccess(
    user,
    permissions,
    subscriptionStatus,
    packageType
  );

  // Enhanced feature access with session-aware checking
  const enhancedCheckFeatureAccess = useCallback(async (feature: string) => {
    try {
      const standardResult = checkFeatureAccess(feature);
      return standardResult;
    } catch (error) {
      console.error('🔐 Enhanced feature access check failed:', error);
      
      return {
        hasAccess: false,
        reason: 'check_failed',
        error: error.message
      };
    }
  }, [checkFeatureAccess]);

  // Event-driven subscription checking
  const triggerSubscriptionCheck = useCallback(async (reason: string = 'manual') => {
    console.log(`🔄 Triggering subscription check: ${reason}`);
    await checkSubscription(true); // Force check
  }, [checkSubscription]);

  // Auto-check subscription on user login
  useEffect(() => {
    if (user && !subscriptionStatus) {
      console.log('👤 User logged in, checking subscription');
      checkSubscription(false); // Use cache if valid
    }
  }, [user, subscriptionStatus, checkSubscription]);

  // Enhanced auth context with smart caching
  const contextValue: AuthContextType = {
    user, 
    session, 
    loading,
    subscriptionStatus,
    subscriptionLoading,
    packageType,
    permissions,
    hasActiveSubscription,
    signOut: async () => {
      invalidateCache(); // Clear cache on sign out
      await signOut();
    },
    refreshAuthState,
    checkSubscription: triggerSubscriptionCheck,
    checkFeatureAccess: enhancedCheckFeatureAccess,
    getUpgradeInfo
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
