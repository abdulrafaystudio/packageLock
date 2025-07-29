
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { clearProfileCache } from '@/hooks/profile/useCentralizedProfile';

interface CheckoutData {
  packageType: string;
  billingFrequency: 'monthly' | 'yearly';
  signupData?: {
    email: string;
    fullName: string;
    companyName: string;
  };
}

interface UpgradeData {
  packageType: string;
  billingFrequency: 'monthly' | 'yearly';
}

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (data: CheckoutData) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Creating Stripe checkout session:', data);
      
      const { data: response, error } = await supabase.functions.invoke('create-checkout', {
        body: data
      });

      if (error) throw error;

      if (response?.url) {
        console.log('✅ Checkout session created, redirecting to Stripe');
        window.location.href = response.url; // Redirect in same tab for better UX
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error: any) {
      console.error('💥 Stripe checkout error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeSubscription = async (data: UpgradeData) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 STARTING SUBSCRIPTION UPGRADE:', data);
      
      // Get current user for cache management
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;
      
      if (!currentUser) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('✅ Authentication verified, calling upgrade function');
      
      const { data: response, error } = await supabase.functions.invoke('upgrade-subscription', {
        body: data
      });

      if (error) {
        console.error('💥 Supabase function error:', error);
        throw new Error(`Upgrade request failed: ${error.message || 'Unknown error'}`);
      }

      // Always expect a redirect URL for upgrades
      if (!response?.url) {
        console.error('💥 No checkout URL in response:', response);
        throw new Error('No checkout URL received from server');
      }

      console.log('✅ UPGRADE SESSION CREATED - Redirecting to Stripe checkout');
      
      // Store upgrade attempt for tracking
      localStorage.setItem('upgrade_attempt', JSON.stringify({
        packageType: data.packageType,
        billingFrequency: data.billingFrequency,
        timestamp: new Date().toISOString(),
        userId: currentUser.id
      }));
      
      // Redirect to Stripe checkout for payment
      window.location.href = response.url;

    } catch (error: any) {
      console.error('💥 UPGRADE ERROR:', error);
      
      let errorMessage = 'Failed to create upgrade session. Please try again.';
      if (error.message?.includes('Authentication')) {
        errorMessage = 'Please log in again to continue with your upgrade.';
      } else if (error.message?.includes('No checkout URL')) {
        errorMessage = 'Server error occurred. Please try again or contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upgrade Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔗 Opening customer portal');
      
      const { data: response, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (response?.url) {
        console.log('✅ Customer portal session created');
        window.open(response.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }

    } catch (error: any) {
      console.error('💥 Customer portal error:', error);
      toast({
        title: "Portal Error", 
        description: error.message || "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncUserProfile = async () => {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 PROFILE SYNC (attempt ${attempt}/${maxRetries})`);
        
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;
        
        if (!currentUser) {
          throw new Error('No valid authentication session found');
        }
        
        if (attempt === 1) {
          console.log('🗑️ Clearing profile cache for fresh sync...');
          clearProfileCache(currentUser.id);
        }
        
        const { data: response, error } = await supabase.functions.invoke('sync-user-profile');

        if (error) {
          lastError = error;
          console.error(`❌ Profile sync attempt ${attempt} failed:`, error);
          
          if (error.message?.includes('Authentication') || 
              error.message?.includes('authorization')) {
            break;
          }
          
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          console.log('✅ PROFILE SYNC SUCCESSFUL:', response);
          
          clearProfileCache(currentUser.id);
          window.dispatchEvent(new CustomEvent('profile-refresh'));
          
          return { success: true, data: response };
        }

      } catch (error: any) {
        lastError = error;
        console.error(`💥 Profile sync attempt ${attempt} exception:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ ALL PROFILE SYNC ATTEMPTS FAILED:', lastError);
    return { 
      success: false, 
      error: lastError?.message || 'Profile sync failed after multiple attempts'
    };
  };

  return {
    createCheckoutSession,
    upgradeSubscription,
    openCustomerPortal,
    syncUserProfile,
    isLoading
  };
};
