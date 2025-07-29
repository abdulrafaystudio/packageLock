
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { companyPlans } from '@/components/pricing/companyPlansData';
import { brokerPlans } from '@/components/pricing/brokerPlansData';
import UpgradeHeader from '@/components/upgrade/UpgradeHeader';
import PlanSummaryCard from '@/components/upgrade/PlanSummaryCard';
import PaymentDetailsCard from '@/components/upgrade/PaymentDetailsCard';
import PlanNotFound from '@/components/upgrade/PlanNotFound';
import HookErrorBoundary from '@/components/error/HookErrorBoundary';
import { useProfile } from '@/hooks/profile/ProfileProviderV3';

const UpgradePlanContent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { packageType: currentPackage } = useProfile();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  
  // Move hook call to component level - this fixes the React error #321
  const { upgradeSubscription } = useStripeCheckout();

  const planName = searchParams.get('plan');
  const billing = searchParams.get('billing');
  const wasCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    
    // Handle cancelled checkout
    if (wasCancelled) {
      setCancelled(true);
      toast({
        title: "Checkout Cancelled",
        description: "Your upgrade was cancelled. You can try again anytime.",
        variant: "default",
      });
    }
  }, [user, navigate, wasCancelled, toast]);

  // Combine all plans and find the matching one
  const allPlans = [...companyPlans, ...brokerPlans];
  const selectedPlan = allPlans.find(plan => {
    const formattedPlanName = plan.name.toLowerCase().replace(/\s+/g, '');
    return formattedPlanName === planName;
  });

  const isYearly = billing === 'yearly';

  if (!selectedPlan) {
    return <PlanNotFound />;
  }

  const handleUpgrade = async () => {
    // Check authentication first
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your plan.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Check if user is trying to upgrade to the same plan
    const selectedPlanType = selectedPlan.name.toLowerCase().replace(/\s+/g, '');
    if (currentPackage === selectedPlanType) {
      toast({
        title: "Same Plan Selected",
        description: "You're already on this plan. Please select a different plan to upgrade.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Starting upgrade process for user:', user.email);
      console.log('Selected plan:', selectedPlan.name, 'Billing:', billing);
      console.log('Current package:', currentPackage, 'Target package:', selectedPlanType);
      
      // Use the already-called hook's method - no hook call inside handler
      await upgradeSubscription({
        packageType: selectedPlanType,
        billingFrequency: isYearly ? 'yearly' : 'monthly'
      });
      
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to process upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <UpgradeHeader planName={selectedPlan.name} />

          {cancelled && (
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200">
                Your previous upgrade was cancelled. You can try again below.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <PlanSummaryCard plan={selectedPlan} isYearly={isYearly} />
            <PaymentDetailsCard 
              plan={selectedPlan} 
              isYearly={isYearly} 
              isProcessing={isProcessing}
              onUpgrade={handleUpgrade}
              currentPackage={currentPackage}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const UpgradePlan = () => {
  return (
    <HookErrorBoundary>
      <UpgradePlanContent />
    </HookErrorBoundary>
  );
};

export default UpgradePlan;
