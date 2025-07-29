
import { useMemo } from 'react';
import { PackageType, PackagePermissions, SubscriptionStatus } from '@/types/auth';

export const usePermissions = (
  subscriptionStatus: SubscriptionStatus | null,
  userProfile: any,
  isAdmin: boolean
) => {
  const packageType: PackageType = useMemo(() => {
    // ENHANCED: Use subscribers table (subscriptionStatus) as PRIMARY source
    if (subscriptionStatus?.subscribed && subscriptionStatus.subscription_tier) {
      return subscriptionStatus.subscription_tier as PackageType;
    }
    
    // Only fall back to profile if no subscription data available
    return (userProfile?.package_type as PackageType) || 'free';
  }, [subscriptionStatus, userProfile]);

  const hasActiveSubscription = useMemo(() => {
    // ENHANCED: Use subscribers table data as primary source
    if (subscriptionStatus) {
      return subscriptionStatus.subscribed && subscriptionStatus.subscription_status === 'active';
    }
    
    // Fallback to profile data if no subscription status
    return userProfile?.subscription_status === 'active' && userProfile?.package_type !== 'free';
  }, [subscriptionStatus, userProfile]);

  const permissions: PackagePermissions = useMemo(() => {
    // Admins get full access regardless of package or verification
    if (isAdmin) {
      return {
        canAccessInvestors: true,
        canCreateDeals: true,
        canAccessProfile: true,
        canAccessBasicFeatures: true,
        maxDeals: -1, // unlimited
      };
    }

    // Base permissions for all users
    const basePermissions = {
      canAccessProfile: true,
      canAccessBasicFeatures: true,
    };

    // ENHANCED: Use subscribers table for subscription validation
    const isPaidPlan = ['standard', 'premium', 'premiumpro', 'enterprise'].includes(packageType);
    
    // Check subscription status from subscribers table first
    if (isPaidPlan && subscriptionStatus) {
      const hasValidSubscription = subscriptionStatus.subscribed && 
        subscriptionStatus.subscription_status === 'active';
      
      if (!hasValidSubscription) {
        return {
          ...basePermissions,
          canAccessInvestors: false,
          canCreateDeals: false,
          maxDeals: 0,
        };
      }
    }

    // Permission mapping based on package type from subscribers table
    switch (packageType) {
      case 'free':
        return {
          ...basePermissions,
          canAccessInvestors: false,
          canCreateDeals: false,
          maxDeals: 0,
        };
      case 'freepro':
        return {
          ...basePermissions,
          canAccessInvestors: false,
          canCreateDeals: false,
          maxDeals: 0,
        };
      case 'standard':
        return {
          ...basePermissions,
          canAccessInvestors: false,
          canCreateDeals: true,
          maxDeals: 1,
        };
      case 'premium':
        return {
          ...basePermissions,
          canAccessInvestors: true,
          canCreateDeals: true,
          maxDeals: 1,
        };
      case 'premiumpro':
        return {
          ...basePermissions,
          canAccessInvestors: true,
          canCreateDeals: true,
          maxDeals: -1, // unlimited
        };
      case 'enterprise':
        return {
          ...basePermissions,
          canAccessInvestors: false,
          canCreateDeals: true,
          maxDeals: -1, // unlimited
        };
      default:
        return {
          canAccessInvestors: false,
          canCreateDeals: false,
          canAccessProfile: false,
          canAccessBasicFeatures: false,
          maxDeals: 0,
        };
    }
  }, [packageType, isAdmin, subscriptionStatus, hasActiveSubscription]);

  return {
    packageType,
    hasActiveSubscription,
    permissions
  };
};
