
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAuthForm } from '@/utils/security';

interface AuthSubmissionProps {
  isSignUp: boolean;
  packageType: string;
  setFormErrors: (errors: Record<string, string>) => void;
  onSignUpSuccess?: () => void;
}

export const useAuthSubmission = ({
  isSignUp,
  packageType,
  setFormErrors,
  onSignUpSuccess
}: AuthSubmissionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuthSubmission = useCallback(async (data: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    // Validate form first
    const validation = validateAuthForm({
      email: data.email,
      password: data.password,
      fullName: isSignUp ? data.fullName : undefined
    });
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    // Clear previous errors
    setFormErrors({});

    try {
      if (isSignUp) {
        console.log('🚀 Starting sign up process', { packageType, email: data.email });
        
        // For free packages, handle signup directly without Stripe
        if (packageType === 'free' || packageType === 'freepro') {
          console.log('📦 Free package signup detected');
          
          const { error } = await supabase.auth.signUp({
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

          if (error) {
            console.error('❌ Free package sign up error:', error);
            
            if (error.message.includes('already registered')) {
              toast({
                title: "Account exists",
                description: "An account with this email already exists. Please sign in instead.",
                variant: "destructive",
              });
            } else if (error.message.includes('rate limit')) {
              toast({
                title: "Account created successfully!",
                description: "Your free account has been created and is immediately active. You can start using all available features right away!",
              });
              if (onSignUpSuccess) {
                onSignUpSuccess();
              }
            } else {
              toast({
                title: "Error",
                description: error.message || "Failed to create account. Please try again.",
                variant: "destructive",
              });
            }
            return;
          }

          console.log('✅ Free package sign up successful');
          
          toast({
            title: "Account created successfully!",
            description: `Welcome! Your ${packageType} account is active and ready to use immediately. Start exploring all features now!`,
          });
          
          if (onSignUpSuccess) {
            onSignUpSuccess();
          }
          
          return;
        }

        // For paid packages, use the existing Stripe flow
        const { error } = await supabase.auth.signUp({
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

        if (error) {
          console.error('❌ Sign up error:', error);
          
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "An account with this email already exists. Please sign in instead.",
              variant: "destructive",
            });
          } else if (error.message.includes('rate limit')) {
            toast({
              title: "Account created successfully!",
              description: "Your account has been created and is immediately active. You can start using all features right away!",
            });
            if (onSignUpSuccess) {
              onSignUpSuccess();
            }
          } else {
            toast({
              title: "Error",
              description: error.message || "Failed to create account. Please try again.",
              variant: "destructive",
            });
          }
          return;
        }

        console.log('✅ Sign up successful');
        
        toast({
          title: "Account created successfully!",
          description: "Welcome! Your account is active and ready to use immediately. Start exploring the platform now!",
        });
        
        if (onSignUpSuccess) {
          onSignUpSuccess();
        }
        
      } else {
        console.log('🔑 Starting sign in process');
        
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          console.error('❌ Sign in error:', error);
          
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
          } else if (error.message.includes('rate limit')) {
            toast({
              title: "Please wait",
              description: "Too many attempts. Please wait a moment and try again.",
            });
          } else {
            toast({
              title: "Error",
              description: error.message || "Failed to sign in. Please try again.",
              variant: "destructive",
            });
          }
          return;
        }

        console.log('✅ Sign in successful');
        
        toast({
          title: "Welcome back!",
          description: "You're now signed in to your account.",
        });
        
        navigate('/');
      }
    } catch (error: any) {
      console.error('💥 Auth error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }, [isSignUp, packageType, toast, navigate, setFormErrors, onSignUpSuccess]);

  return { handleAuthSubmission };
};
