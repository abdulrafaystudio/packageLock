
import React, { createContext, useContext, useMemo, memo } from 'react';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { SubscriptionStatus } from '@/types/auth';

interface ProfilePermissionsContextType {
  packageType: string;
  hasActiveSubscription: boolean;
  permissions: any;
}

const ProfilePermissionsContext = createContext<ProfilePermissionsContextType | undefined>(undefined);

export const ProfilePermissionsProvider = memo(({ 
  children, 
  subscriptionStatus, 
  userProfile, 
  isAdmin 
}: { 
  children: React.ReactNode; 
  subscriptionStatus: SubscriptionStatus | null;
  userProfile: any;
  isAdmin: boolean;
}) => {
  // Always call usePermissions hook consistently - no conditional calling
  const { packageType, hasActiveSubscription, permissions } = usePermissions(
    subscriptionStatus,
    userProfile,
    isAdmin
  );

  // Stable context value using useMemo
  const contextValue = useMemo((): ProfilePermissionsContextType => ({
    packageType,
    hasActiveSubscription,
    permissions
  }), [packageType, hasActiveSubscription, permissions]);

  return (
    <ProfilePermissionsContext.Provider value={contextValue}>
      {children}
    </ProfilePermissionsContext.Provider>
  );
});

export const useProfilePermissions = () => {
  const context = useContext(ProfilePermissionsContext);
  if (context === undefined) {
    throw new Error('useProfilePermissions must be used within a ProfilePermissionsProvider');
  }
  return context;
};
