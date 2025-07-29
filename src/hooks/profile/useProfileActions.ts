
import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { PersonalInfo } from './types';

export const useProfileActions = () => {
  const handlePersonalInfoChange = useCallback((
    field: string, 
    value: string,
    setPersonalInfo: (updater: (prev: PersonalInfo) => PersonalInfo) => void
  ) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleEditToggle = useCallback((
    isEditing: boolean,
    user: User | null,
    personalInfo: PersonalInfo,
    saveToCache: (data: PersonalInfo) => void,
    setIsEditing: (editing: boolean) => void
  ) => {
    if (isEditing && user) {
      // Save changes logic would go here
      console.log('💾 Saving profile changes:', personalInfo);
      saveToCache(personalInfo);
    }
    setIsEditing(!isEditing);
  }, []);

  return {
    handlePersonalInfoChange,
    handleEditToggle
  };
};
