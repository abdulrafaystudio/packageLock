
import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { PersonalInfo } from './types';
import { getPersonalInfoFromUser } from './profileUtils';

export const useProfileDataLoader = () => {
  const getInitialProfileData = useCallback((user: User): PersonalInfo => {
    return getPersonalInfoFromUser(user);
  }, []);

  const loadProfileInBackground = useCallback(async (
    user: User,
    setPersonalInfo: (info: PersonalInfo) => void,
    setProfileError: (error: string | null) => void,
    saveToCache: (data: PersonalInfo) => void
  ) => {
    try {
      console.log('🔍 Loading fresh profile data for user:', user.id);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, email, company_name, package_type')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        throw error;
      }

      const profileInfo: PersonalInfo = {
        fullName: profileData?.full_name || user.user_metadata?.full_name || '',
        email: profileData?.email || user.email || '',
        companyName: profileData?.company_name || user.user_metadata?.company_name || '',
        packageType: (profileData?.package_type as any) || 'free'
      };

      console.log('✅ Profile data loaded successfully');
      setPersonalInfo(profileInfo);
      setProfileError(null);
      saveToCache(profileInfo);

    } catch (error: any) {
      console.error('💥 Error loading profile data:', error);
      setProfileError(error.message || 'Failed to load profile');
    }
  }, []);

  return {
    getInitialProfileData,
    loadProfileInBackground
  };
};
