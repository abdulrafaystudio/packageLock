
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthOperations = () => {
  const performSignUp = useCallback(async (
    email: string,
    password: string,
    metadata: Record<string, any> = {}
  ) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/`
      }
    });
  }, []);

  const performSignIn = useCallback(async (
    email: string,
    password: string
  ) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const performPasswordReset = useCallback(async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  }, []);

  return {
    performSignUp,
    performSignIn,
    performPasswordReset
  };
};
