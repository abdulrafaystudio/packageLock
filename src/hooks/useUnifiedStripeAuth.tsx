import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUnifiedStripeAuth = () => {
  const location = useLocation();
  const { toast } = useToast();

  const getPackageFromRoute = useCallback(() => {
    const path = location.pathname;
    if (path.includes('auth-standard')) return 'standard';
    if (path.includes('auth-premium-pro')) return 'premiumpro';
    if (path.includes('auth-premium')) return 'premium';
    if (path.includes('auth-enterprise')) return 'enterprise';
    
    if (path.includes('auth-free') && location.state?.from === 'brokers') {
      return 'freepro';
    }
    
    return 'free';
  }, [location.pathname, location.state]);

  const getBillingFromUrl = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly';
  }, [location.search]);

  const handleSignup = useCallback(async (formData: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    const packageType = getPackageFromRoute();
    const billingFrequency = getBillingFromUrl();

    console.log('🔄 Processing unified signup for:', { packageType, billingFrequency });

    try {
      // Call unified edge function
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
        throw new Error(checkoutError.message || 'Failed to process signup');
      }

      // Handle free plans
      if (checkoutData?.isFree) {
        console.log('📦 Free plan - no Stripe redirect needed');
        return false; // No Stripe redirect needed
      }

      // Handle paid plans
      if (checkoutData?.url) {
        console.log('✅ Redirecting to Stripe checkout');
        window.open(checkoutData.url, '_blank');
        return true; // Indicates Stripe redirect happened
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error: any) {
      console.error('💥 Unified signup error:', error);
      toast({
        title: "Signup Error",
        description: error.message || "Failed to process signup. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [getPackageFromRoute, getBillingFromUrl, toast]);

  return {
    handleSignup,
    packageType: getPackageFromRoute(),
    billingFrequency: getBillingFromUrl()
  };
};