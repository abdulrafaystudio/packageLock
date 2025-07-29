
import React, { createContext, useContext, useMemo, memo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDataProvider, useProfileData } from './ProfileDataProvider';
import { ProfilePermissionsProvider, useProfilePermissions } from './ProfilePermissionsProvider';
import ProfileErrorBoundary from '@/components/error/ProfileErrorBoundary';
import { PersonalInfo } from './types';
import { clearProfileCache } from './useCentralizedProfile';
import { useRealtimeProfileUpdates } from './useRealtimeProfileUpdates';
import { usePostUpgradeHandler } from './usePostUpgradeHandler';
import { supabase } from '@/integrations/supabase/client';

interface ProfileContextType {
  // Profile data
  personalInfo: PersonalInfo;
  userProfile: any;
  isAdmin: boolean;
  loading: boolean;
  profileError: string | null;
  isEditing: boolean;
  
  // Updated permissions based on profile
  packageType: string;
  hasActiveSubscription: boolean;
  permissions: any;
  
  // Actions
  handlePersonalInfoChange: (field: string, value: string) => void;
  handleEditToggle: () => void;
  refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Fixed component - always renders ProfilePermissionsProvider consistently
const ProfilePermissionsBridge = memo(({ children }: { children: React.ReactNode }) => {
  const profileData = useProfileData();
  const { subscriptionStatus } = useAuth();
  
  // Always render the provider, pass loading state as props instead of conditional rendering
  return (
    <ProfilePermissionsProvider 
      subscriptionStatus={profileData.loading ? null : subscriptionStatus}
      userProfile={profileData.loading ? null : profileData.userProfile}
      isAdmin={profileData.loading ? false : profileData.isAdmin}
    >
      {children}
    </ProfilePermissionsProvider>
  );
});

// Inner component that combines data and permissions
const ProfileCombiner = memo(({ children }: { children: React.ReactNode }) => {
  const profileData = useProfileData();
  const profilePermissions = useProfilePermissions();
  const { user } = useAuth();

  // Set up real-time profile updates
  useRealtimeProfileUpdates({
    user,
    onProfileUpdate: profileData.refreshProfile
  });

  // Set up post-upgrade handlers for immediate refresh
  console.log('🔧 About to initialize usePostUpgradeHandler');
  usePostUpgradeHandler({ refreshProfile: profileData.refreshProfile });
  console.log('✅ usePostUpgradeHandler initialized successfully');

  // ENHANCED: Listen for profile refresh events
  useEffect(() => {
    const handleProfileRefresh = () => {
      console.log('🔄 Profile refresh event received');
      if (user?.id) {
        clearProfileCache(user.id);
        profileData.refreshProfile();
      }
    };

    // ENHANCED: Listen for upgrade completion events
    const handleUpgradeComplete = () => {
      if (user?.id) {
        console.log('🎯 Upgrade complete event received, refreshing profile...');
        clearProfileCache(user.id);
        profileData.refreshProfile();
      }
    };

    window.addEventListener('profile-refresh', handleProfileRefresh);
    window.addEventListener('upgrade-complete', handleUpgradeComplete);
    
    return () => {
      window.removeEventListener('profile-refresh', handleProfileRefresh);
      window.removeEventListener('upgrade-complete', handleUpgradeComplete);
    };
  }, [user?.id, profileData.refreshProfile]);

  // ENHANCED: Auto-refresh profile on subscription changes
  useEffect(() => {
    // Check for upgrade completion in localStorage
    const upgradeAttempt = localStorage.getItem('upgrade_attempt');
    if (upgradeAttempt && user?.id) {
      try {
        const attempt = JSON.parse(upgradeAttempt);
        if (attempt.userId === user.id) {
          console.log('🎯 Detected completed upgrade, refreshing profile...');
          clearProfileCache(user.id);
          profileData.refreshProfile();
          
          // Clear the upgrade attempt after processing
          localStorage.removeItem('upgrade_attempt');
        }
      } catch (e) {
        console.warn('Failed to parse upgrade attempt:', e);
      }
    }
  }, [user?.id, profileData.refreshProfile]);

  // Stable combined context value
  const contextValue = useMemo((): ProfileContextType => ({
    // Profile data
    personalInfo: profileData.personalInfo,
    userProfile: profileData.userProfile,
    isAdmin: profileData.isAdmin,
    loading: profileData.loading,
    profileError: profileData.profileError,
    isEditing: profileData.isEditing,
    
    // Permissions
    packageType: profilePermissions.packageType,
    hasActiveSubscription: profilePermissions.hasActiveSubscription,
    permissions: profilePermissions.permissions,
    
    // Actions
    handlePersonalInfoChange: profileData.handlePersonalInfoChange,
    handleEditToggle: profileData.handleEditToggle,
    refreshProfile: profileData.refreshProfile
  }), [
    profileData.personalInfo,
    profileData.userProfile,
    profileData.isAdmin,
    profileData.loading,
    profileData.profileError,
    profileData.isEditing,
    profilePermissions.packageType,
    profilePermissions.hasActiveSubscription,
    profilePermissions.permissions,
    profileData.handlePersonalInfoChange,
    profileData.handleEditToggle,
    profileData.refreshProfile
  ]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
});

export const ProfileProviderV3 = memo(({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // Always render all providers consistently - no conditional rendering that breaks hooks
  return (
    <ProfileErrorBoundary>
      <ProfileDataProvider user={user}>
        <ProfilePermissionsBridge>
          <ProfileCombiner>
            {children}
          </ProfileCombiner>
        </ProfilePermissionsBridge>
      </ProfileDataProvider>
    </ProfileErrorBoundary>
  );
});

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProviderV3');
  }
  return context;
};
