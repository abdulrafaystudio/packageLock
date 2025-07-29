
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthActionData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
}

export const useAuthActionPerformer = (isSignUp: boolean, packageType: string) => {
  const performAuthAction = useCallback(async (data: AuthActionData) => {
    if (isSignUp) {
      console.log('🚀 Starting auth action (signup) for:', data.email);
      
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            company_name: data.companyName,
            package_type: packageType
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      return { error, authData };
    } else {
      console.log('🔑 Starting auth action (signin) for:', data.email);
      
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      return { error, authData };
    }
  }, [isSignUp, packageType]);

  return { performAuthAction };
};
