
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBasicAuth = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const basicSignUp = useCallback(async (
    email: string,
    password: string,
    metadata: Record<string, any> = {}
  ) => {
    setIsProcessing(true);
    try {
      console.log('🚀 Starting basic signup:', email);
      
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (result.error) {
        throw result.error;
      }

      console.log('✅ Basic signup successful');
      return result;
    } catch (error: any) {
      console.error('💥 Basic signup error:', error);
      toast({
        title: "Sign Up Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const basicSignIn = useCallback(async (
    email: string,
    password: string
  ) => {
    setIsProcessing(true);
    try {
      console.log('🚀 Starting basic signin:', email);
      
      const result = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (result.error) {
        throw result.error;
      }

      console.log('✅ Basic signin successful');
      return result;
    } catch (error: any) {
      console.error('💥 Basic signin error:', error);
      toast({
        title: "Sign In Error",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    isProcessing,
    basicSignUp,
    basicSignIn
  };
};
