
import { SubscriptionStatus, PackagePermissions } from '@/types/auth';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SubscriptionValidator {
  // Validate subscription status data integrity
  static validateSubscriptionStatus(status: SubscriptionStatus | null): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!status) {
      result.warnings.push('No subscription status provided');
      return result;
    }

    // Validate subscription tier
    const validTiers = ['free', 'standard', 'premium', 'enterprise', 'premiumpro'];
    if (!validTiers.includes(status.subscription_tier)) {
      result.errors.push(`Invalid subscription tier: ${status.subscription_tier}`);
      result.isValid = false;
    }

    // Validate subscription status
    const validStatuses = ['active', 'cancelled', 'past_due', 'unpaid'];
    if (!validStatuses.includes(status.subscription_status)) {
      result.errors.push(`Invalid subscription status: ${status.subscription_status}`);
      result.isValid = false;
    }

    // Validate subscription end date
    if (status.subscription_end) {
      const endDate = new Date(status.subscription_end);
      if (isNaN(endDate.getTime())) {
        result.errors.push('Invalid subscription end date format');
        result.isValid = false;
      }
    }

    // Business logic validations
    if (status.subscribed && status.subscription_status === 'cancelled') {
      result.warnings.push('Subscribed is true but status is cancelled - potential inconsistency');
    }

    if (!status.subscribed && status.subscription_status === 'active') {
      result.warnings.push('Not subscribed but status is active - potential inconsistency');
    }

    return result;
  }

  // Validate permission consistency
  static validatePermissions(
    permissions: PackagePermissions,
    subscriptionStatus: SubscriptionStatus | null,
    packageType: string
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check permission consistency with package type
    const expectedPermissions = this.getExpectedPermissions(packageType, subscriptionStatus);
    
    if (permissions.canAccessInvestors !== expectedPermissions.canAccessInvestors) {
      result.errors.push(
        `Investor access permission mismatch. Expected: ${expectedPermissions.canAccessInvestors}, Got: ${permissions.canAccessInvestors}`
      );
      result.isValid = false;
    }

    if (permissions.canCreateDeals !== expectedPermissions.canCreateDeals) {
      result.errors.push(
        `Deal creation permission mismatch. Expected: ${expectedPermissions.canCreateDeals}, Got: ${permissions.canCreateDeals}`
      );
      result.isValid = false;
    }

    if (permissions.maxDeals !== expectedPermissions.maxDeals) {
      result.errors.push(
        `Max deals limit mismatch. Expected: ${expectedPermissions.maxDeals}, Got: ${permissions.maxDeals}`
      );
      result.isValid = false;
    }

    return result;
  }

  // Get expected permissions based on package type and subscription status
  private static getExpectedPermissions(
    packageType: string,
    subscriptionStatus: SubscriptionStatus | null
  ): PackagePermissions {
    // Check if subscription is active for paid plans
    const isPaidPlan = ['standard', 'premium', 'enterprise', 'premiumpro'].includes(packageType);
    const hasActiveSubscription = subscriptionStatus?.subscribed && 
      subscriptionStatus.subscription_status === 'active';

    if (isPaidPlan && !hasActiveSubscription) {
      return {
        canAccessInvestors: false,
        canCreateDeals: false,
        canAccessProfile: true,
        canAccessBasicFeatures: true,
        maxDeals: 0
      };
    }

    switch (packageType) {
      case 'free':
      case 'freepro':
        return {
          canAccessInvestors: false,
          canCreateDeals: false,
          canAccessProfile: true,
          canAccessBasicFeatures: true,
          maxDeals: 0
        };
      case 'standard':
        return {
          canAccessInvestors: false,
          canCreateDeals: true,
          canAccessProfile: true,
          canAccessBasicFeatures: true,
          maxDeals: 1
        };
      case 'premium':
        return {
          canAccessInvestors: true,
          canCreateDeals: true,
          canAccessProfile: true,
          canAccessBasicFeatures: true,
          maxDeals: 1
        };
      case 'premiumpro':
      case 'enterprise':
        return {
          canAccessInvestors: true,
          canCreateDeals: true,
          canAccessProfile: true,
          canAccessBasicFeatures: true,
          maxDeals: -1
        };
      default:
        return {
          canAccessInvestors: false,
          canCreateDeals: false,
          canAccessProfile: false,
          canAccessBasicFeatures: false,
          maxDeals: 0
        };
    }
  }

  // Validate grace period logic
  static validateGracePeriod(subscriptionStatus: SubscriptionStatus | null): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!subscriptionStatus) {
      return result;
    }

    if (subscriptionStatus.subscription_status === 'past_due' && subscriptionStatus.subscription_end) {
      const endDate = new Date(subscriptionStatus.subscription_end);
      const gracePeriodEnd = new Date(endDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      const now = new Date();

      if (now < gracePeriodEnd) {
        result.warnings.push('User is currently in grace period');
      } else {
        result.warnings.push('User is past grace period - subscription should be cancelled');
      }
    }

    return result;
  }

  // Comprehensive system validation
  static validateSystem(
    subscriptionStatus: SubscriptionStatus | null,
    permissions: PackagePermissions,
    packageType: string,
    isOfflineMode: boolean,
    lastSuccessfulCheck: Date | null
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate individual components
    const subscriptionValidation = this.validateSubscriptionStatus(subscriptionStatus);
    const permissionValidation = this.validatePermissions(permissions, subscriptionStatus, packageType);
    const gracePeriodValidation = this.validateGracePeriod(subscriptionStatus);

    // Combine results
    result.errors.push(...subscriptionValidation.errors, ...permissionValidation.errors);
    result.warnings.push(...subscriptionValidation.warnings, ...permissionValidation.warnings, ...gracePeriodValidation.warnings);

    if (subscriptionValidation.errors.length > 0 || permissionValidation.errors.length > 0) {
      result.isValid = false;
    }

    // Offline mode validations
    if (isOfflineMode) {
      if (!lastSuccessfulCheck) {
        result.warnings.push('In offline mode but no last successful check recorded');
      } else {
        const timeSinceLastCheck = Date.now() - lastSuccessfulCheck.getTime();
        const hoursOld = timeSinceLastCheck / (1000 * 60 * 60);
        
        if (hoursOld > 24) {
          result.warnings.push(`Cached data is ${Math.round(hoursOld)} hours old`);
        }
      }
    }

    return result;
  }
}

// Export validation functions for easy use
export const validateSubscriptionStatus = SubscriptionValidator.validateSubscriptionStatus;
export const validatePermissions = SubscriptionValidator.validatePermissions;
export const validateGracePeriod = SubscriptionValidator.validateGracePeriod;
export const validateSystem = SubscriptionValidator.validateSystem;
