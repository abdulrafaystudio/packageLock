
import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { PackagePermissions, SubscriptionStatus, PackageType } from '@/types/auth';

export const useFeatureAccess = (
  user: User | null,
  permissions: PackagePermissions,
  subscriptionStatus: SubscriptionStatus | null,
  packageType: PackageType
) => {
  const checkFeatureAccess = useCallback((feature: string): {
    hasAccess: boolean;
    reason?: string;
    requiredTier?: string;
  } => {
    if (!user) {
      return { hasAccess: false, reason: 'authentication_required' };
    }

    // ENHANCED: Use subscribers table (subscriptionStatus) as PRIMARY source
    const isSubscriptionRequired = ['investors', 'deals', 'premium_features'].includes(feature);
    
    if (isSubscriptionRequired && subscriptionStatus) {
      // Primary check: subscribers table data
      const hasValidSubscription = subscriptionStatus.subscribed && 
        subscriptionStatus.subscription_status === 'active';
      
      const isPaidTier = !['free', 'freepro'].includes(subscriptionStatus.subscription_tier || 'free');
      
      if (!hasValidSubscription || !isPaidTier) {
        return { 
          hasAccess: false, 
          reason: 'subscription_required',
          requiredTier: 'premium'
        };
      }
    }

    // Feature-specific access checks using permissions
    switch (feature) {
      case 'investors':
        return {
          hasAccess: permissions.canAccessInvestors || false,
          reason: permissions.canAccessInvestors ? undefined : 'upgrade_required',
          requiredTier: 'premium'
        };
      
      case 'deals':
        return {
          hasAccess: permissions.canCreateDeals,
          reason: permissions.canCreateDeals ? undefined : 'upgrade_required',
          requiredTier: 'standard'
        };
      
      case 'unlimited_deals':
        return {
          hasAccess: permissions.maxDeals === -1,
          reason: permissions.maxDeals === -1 ? undefined : 'upgrade_required',
          requiredTier: 'premiumpro'
        };
      
      default:
        return { hasAccess: true };
    }
  }, [user, permissions, subscriptionStatus]);

  const getUpgradeInfo = useCallback((feature: string) => {
    const access = checkFeatureAccess(feature);
    
    if (access.hasAccess) return null;
    
    return {
      currentTier: (subscriptionStatus?.subscription_tier as PackageType) || packageType,
      requiredTier: access.requiredTier || 'premium',
      reason: access.reason || 'upgrade_required'
    };
  }, [checkFeatureAccess, subscriptionStatus, packageType]);

  return {
    checkFeatureAccess,
    getUpgradeInfo
  };
};
