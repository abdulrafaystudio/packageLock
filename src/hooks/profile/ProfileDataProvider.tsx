import React, { createContext, useContext, useMemo, useCallback, memo } from 'react';
import { User } from '@supabase/supabase-js';
import { useCentralizedProfile } from './useCentralizedProfile';
import { PersonalInfo } from './types';

interface ProfileDataContextType {
  // Profile data
  personalInfo: PersonalInfo;
  userProfile: any;
  isAdmin: boolean;
  loading: boolean;
  profileError: string | null;
  isEditing: boolean;
  
  // Actions
  handlePersonalInfoChange: (field: string, value: string) => void;
  handleEditToggle: () => void;
  refreshProfile: () => void;
}

const ProfileDataContext = createContext<ProfileDataContextType | undefined>(undefined);

export const ProfileDataProvider = memo(({ 
  children, 
  user 
}: { 
  children: React.ReactNode; 
  user: User | null; 
}) => {
  const profileData = useCentralizedProfile(user);

  // Stable context value using useMemo
  const contextValue = useMemo((): ProfileDataContextType => ({
    personalInfo: profileData.personalInfo,
    userProfile: profileData.userProfile,
    isAdmin: profileData.isAdmin,
    loading: profileData.loading,
    profileError: profileData.profileError,
    isEditing: profileData.isEditing,
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
    profileData.handlePersonalInfoChange,
    profileData.handleEditToggle,
    profileData.refreshProfile
  ]);

  return (
    <ProfileDataContext.Provider value={contextValue}>
      {children}
    </ProfileDataContext.Provider>
  );
});

export const useProfileData = () => {
  const context = useContext(ProfileDataContext);
  if (context === undefined) {
    throw new Error('useProfileData must be used within a ProfileDataProvider');
  }
  return context;
};