
import { User, Session } from '@supabase/supabase-js';

// Unified auth types for the application

export type PackageType = 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: string;
  subscription_status: string;
  subscription_end: string | null;
}

export interface PackagePermissions {
  canAccessInvestors: boolean;
  canCreateDeals: boolean;
  canAccessProfile: boolean;
  canAccessBasicFeatures: boolean;
  maxDeals: number; // -1 for unlimited
}

// Use Supabase's User type directly
export type AuthUser = User;

// Use Supabase's Session type directly  
export type AuthSession = Session;

export interface EnhancedAuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  // Subscription state
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  packageType: PackageType;
  permissions: PackagePermissions;
  hasActiveSubscription: boolean;
  // Resilience features
  isOfflineMode?: boolean;
  isStripeUnavailable?: boolean;
  lastSuccessfulCheck?: Date | null;
  gracePeriodActive?: boolean;
}

export interface AuthContextType extends EnhancedAuthState {
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  // Subscription methods
  checkSubscription: (reason?: string) => Promise<void>;
  checkFeatureAccess: (feature: string) => Promise<{
    hasAccess: boolean;
    reason?: string;
    requiredTier?: string;
    degradedMode?: boolean;
    isOfflineMode?: boolean;
    isStripeUnavailable?: boolean;
    lastSuccessfulCheck?: Date | null;
    gracePeriodActive?: boolean;
    fallbackUsed?: boolean;
    error?: string;
  }>;
  getUpgradeInfo: (feature: string) => {
    currentTier: PackageType;
    requiredTier: string;
    reason: string;
  } | null;
}

export interface AuthFormData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
}
