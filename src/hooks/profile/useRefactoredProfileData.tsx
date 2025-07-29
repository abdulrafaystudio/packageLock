
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileState } from './useProfileState';
import { useProfileCache } from './useProfileCache';
import { useProfileDataLoader } from './useProfileDataLoader';
import { useProfileActions } from './useProfileActions';

export const useRefactoredProfileData = () => {
  const {
    personalInfo,
    setPersonalInfo,
    isEditing,
    setIsEditing,
    loading,
    setLoading,
    profileError,
    setProfileError
  } = useProfileState();

  const { loadFromCache, saveToCache } = useProfileCache();
  const { loadProfileInBackground, getInitialProfileData } = useProfileDataLoader();
  const { handlePersonalInfoChange: baseHandlePersonalInfoChange, handleEditToggle: baseHandleEditToggle } = useProfileActions();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('🔄 Loading profile for user:', user.id, user.email);
      
      // Immediately set profile data from user auth data
      const userInfo = getInitialProfileData(user);
      setPersonalInfo(userInfo);
      setProfileError(null);
      
      // Check cache first
      const cachedProfile = loadFromCache();
      if (cachedProfile) {
        console.log('🎯 Using cached profile data');
        setPersonalInfo(cachedProfile);
        setProfileError(null);
        return;
      }
      
      // Load fresh data in the background without blocking UI
      loadProfileInBackground(user, setPersonalInfo, setProfileError, saveToCache);
    } else {
      console.log('❌ No user found, setting loading to false');
      setLoading(false);
      setProfileError('No user found');
    }
  }, [user, getInitialProfileData, loadFromCache, loadProfileInBackground, saveToCache, setPersonalInfo, setProfileError, setLoading]);

  const handlePersonalInfoChange = useCallback((field: string, value: string) => {
    baseHandlePersonalInfoChange(field, value, setPersonalInfo);
  }, [baseHandlePersonalInfoChange, setPersonalInfo]);

  const handleEditToggle = useCallback(() => {
    baseHandleEditToggle(isEditing, user, personalInfo, saveToCache, setIsEditing);
  }, [baseHandleEditToggle, isEditing, user, personalInfo, saveToCache, setIsEditing]);

  return {
    personalInfo,
    isEditing,
    loading,
    profileError,
    handlePersonalInfoChange,
    handleEditToggle
  };
};
