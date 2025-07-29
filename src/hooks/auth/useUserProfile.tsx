
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      setProfileLoading(true);
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setUserProfile(profile);

      // Check admin status
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      setIsAdmin(!adminError && !!adminData);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      setIsAdmin(false);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  return {
    userProfile,
    isAdmin,
    profileLoading,
    fetchUserProfile
  };
};
