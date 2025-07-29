
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSimpleAuthFlow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const simpleSignUp = useCallback(async (
    email: string,
    password: string,
    metadata: Record<string, any> = {}
  ) => {
    setIsProcessing(true);
    try {
      console.log('🚀 Starting simple signup:', email);
      
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      // CRITICAL FIX: Throw error if signup failed
      if (result.error) {
        throw result.error;
      }

      console.log('✅ Simple signup successful');
      return result;
    } catch (error: any) {
      console.error('💥 Simple signup error:', error);
      toast({
        title: "Sign Up Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
      // CRITICAL FIX: Re-throw error for fallback system
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const simpleSignIn = useCallback(async (
    email: string,
    password: string
  ) => {
    setIsProcessing(true);
    try {
      console.log('🚀 Starting simple signin:', email);
      
      const result = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      // CRITICAL FIX: Throw error if signin failed
      if (result.error) {
        throw result.error;
      }

      console.log('✅ Simple signin successful');
      return result;
    } catch (error: any) {
      console.error('💥 Simple signin error:', error);
      toast({
        title: "Sign In Error",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive"
      });
      // CRITICAL FIX: Re-throw error for fallback system
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    isProcessing,
    simpleSignUp,
    simpleSignIn
  };
};
