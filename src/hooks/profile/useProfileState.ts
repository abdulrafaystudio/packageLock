
import { useState } from 'react';
import { PersonalInfo } from './types';

export const useProfileState = () => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    companyName: '',
    packageType: 'free'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  return {
    personalInfo,
    setPersonalInfo,
    isEditing,
    setIsEditing,
    loading,
    setLoading,
    profileError,
    setProfileError
  };
};
