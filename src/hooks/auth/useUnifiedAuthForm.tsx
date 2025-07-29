
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// No more client-side password hashing - let Supabase handle it

interface FormData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  isLogin: boolean;
}

interface UseUnifiedAuthFormProps {
  defaultToSignUp?: boolean;
  packageType?: string;
}

export const useUnifiedAuthForm = (props?: UseUnifiedAuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(props?.defaultToSignUp || false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { checkSubscription } = useAuth();

  const getPackageFromRoute = () => {
    const path = location.pathname;
    if (path.includes('auth-standard')) return 'standard';
    if (path.includes('auth-premium-pro')) return 'premiumpro';
    if (path.includes('auth-premium')) return 'premium';
    if (path.includes('auth-enterprise')) return 'enterprise';
    
    if (path.includes('auth-free') && location.state?.from === 'brokers') {
      return 'freepro';
    }
    
    return props?.packageType || 'free';
  };

  const getBillingFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    if (isSignUp && !formData.fullName) {
      errors.fullName = 'Full name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createStripeCheckout = async (packageType: string, billingFrequency: string) => {
    console.log('🚀 Creating unified checkout session...', { packageType, billingFrequency });
    
    try {
      // Use unified checkout function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          packageType,
          billingFrequency,
          signupData: {
            email: formData.email,
            fullName: formData.fullName,
            companyName: formData.companyName || null,
            password: formData.password
          }
        }
      });

      if (checkoutError) {
        console.error('❌ Unified checkout error:', checkoutError);
        // --- Added detailed error logging for Stripe checkout ---
        console.log('[Stripe Checkout Error] packageType:', packageType, 'billingFrequency:', billingFrequency, 'formData:', formData, 'checkoutError:', checkoutError);
        // --- End added logging ---
        throw new Error(checkoutError.message || 'Failed to create checkout session');
      }

      // Handle free plans
      if (checkoutData?.isFree) {
        console.log('✅ Free plan - no Stripe redirect needed');
        return false; // No Stripe redirect for free plans
      }

      // Handle paid plans
      if (checkoutData?.url) {
        console.log('✅ Unified checkout successful');
        window.open(checkoutData.url, '_blank');
        return true;
      } else {
        throw new Error('No checkout URL returned from unified checkout');
      }

    } catch (error: any) {
      console.error('💥 Unified checkout failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const packageType = getPackageFromRoute();
      const billingFrequency = getBillingFromUrl();

      if (isSignUp) {
        // Handle signup
        if (packageType === 'free' || packageType === 'freepro') {
          // Free signup - create account directly
          const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.fullName,
                company_name: formData.companyName,
                package_type: packageType,
                signup_source: 'auth_form'
              },
              emailRedirectTo: `${window.location.origin}/`
            }
          });

          if (error) throw error;

          toast({
            title: "Account created!",
            description: "Your free account has been created successfully.",
          });
          
          navigate('/');
        } else {
          // Paid signup - redirect to Stripe checkout
          await createStripeCheckout(packageType, billingFrequency);
          
          toast({
            title: "Redirecting to Payment",
            description: "Please complete your payment to activate your subscription.",
          });
        }
      } else {
        // Handle login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        await checkSubscription();
        
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth form error:', error);
      // --- Added detailed error logging for paid package signup ---
      if (isSignUp && !(getPackageFromRoute() === 'free' || getPackageFromRoute() === 'freepro')) {
        console.log('[Paid Signup Error] packageType:', getPackageFromRoute(), 'billing:', getBillingFromUrl(), 'formData:', formData, 'error:', error);
      }
      // --- End added logging ---
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link.";
      } else if (error.message?.includes('checkout')) {
        errorMessage = "Payment setup failed. Please try again or contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: isSignUp ? "Signup Error" : "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormErrors({});
  };

  return {
    isSignUp,
    isLoading,
    formData,
    formErrors,
    handleInputChange,
    handleSubmit,
    toggleAuthMode,
    packageType: getPackageFromRoute(),
    billingFrequency: getBillingFromUrl()
  };
};
