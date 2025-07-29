
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { handleEnhancedAuthError } from '@/utils/auth/enhancedErrorHandling';

interface AuthSubmissionHandlerProps {
  isSignUp: boolean;
  packageType: string;
  setFormErrors: (errors: Record<string, string>) => void;
  toggleAuthMode: () => void;
}

export const useAuthSubmissionHandler = ({
  isSignUp,
  packageType,
  setFormErrors,
  toggleAuthMode,
}: AuthSubmissionHandlerProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthSubmission = useCallback(async (data: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    if (isSubmitting) {
      console.log('🚫 Submission already in progress');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Simple SignUp - account is immediately active
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              package_type: packageType,
              company_name: data.companyName
            }
          }
        });

        if (signUpError) throw signUpError;
        
        // Account is immediately active - navigate to dashboard
        console.log('✅ Signup successful:', signUpData.user?.email);
        toast({
          title: "Account created successfully!",
          description: "Welcome! You're now signed in and ready to explore the platform.",
        });
        navigate('/');
      } else {
        // Sign In
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;

        console.log('✅ Signin successful:', authData?.user?.email);
        toast({
          title: "Welcome back!",
          description: "You're now signed in to your account.",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('💥 Auth error:', error);
      
      const errorResponse = await handleEnhancedAuthError(error, isSignUp ? 'signup' : 'signin', data.email);
      toast({
        title: errorResponse.title,
        description: errorResponse.description,
        variant: errorResponse.variant
      });
      
      if (errorResponse.accountLikelyExists && isSignUp) {
        toggleAuthMode();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSignUp, packageType, toast, navigate, setFormErrors, isSubmitting, toggleAuthMode]);

  return { 
    handleAuthSubmission, 
    isSubmitting,
    isVerifying: false // No verification needed
  };
};
