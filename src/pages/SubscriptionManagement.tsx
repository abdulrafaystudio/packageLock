
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, CreditCard, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useToast } from '@/hooks/use-toast';
import SubscriptionStatusDisplay from '@/components/subscription/SubscriptionStatusDisplay';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';

const SubscriptionManagementPage = () => {
  const navigate = useNavigate();
  const { subscriptionStatus } = useAuth();
  const { openCustomerPortal, isLoading } = useStripeCheckout();
  const { toast } = useToast();

  const isFreeTier = !subscriptionStatus?.subscribed || 
    subscriptionStatus.subscription_tier === 'free';

  const handleManageSubscription = async () => {
    try {
      console.log('🔗 Opening Stripe Customer Portal');
      await openCustomerPortal();
    } catch (error) {
      console.error('💥 Failed to open customer portal:', error);
      toast({
        title: "Portal Error",
        description: "Failed to open subscription management portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Subscription Management
            </h1>
          </div>

          <div className="grid gap-6">
            {/* Current Subscription Status */}
            <SubscriptionStatusDisplay />

            {/* Subscription Management Actions */}
            {!isFreeTier && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Manage Your Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Use Stripe's secure customer portal to manage your subscription, update payment methods, view billing history, and cancel if needed.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Available Actions:</h3>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <li>• Update payment method</li>
                        <li>• View billing history</li>
                        <li>• Download invoices</li>
                        <li>• Cancel subscription</li>
                        <li>• Update billing address</li>
                      </ul>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <Button
                        onClick={handleManageSubscription}
                        disabled={isLoading}
                        className="w-full flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        {isLoading ? 'Opening Portal...' : 'Manage Subscription'}
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                        Opens in a new tab
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upgrade Prompt for Free Users */}
            {isFreeTier && (
              <UpgradePrompt
                feature="premium_features"
                requiredTier="premium"
                title="Access Premium Features"
                description="Upgrade to access investor database, create deals, and unlock advanced features."
              />
            )}

            {/* Subscription Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionStatus?.subscription_tier && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Current Plan Benefits */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Your Current Plan Includes:</h3>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {subscriptionStatus.subscription_tier === 'free' && (
                          <>
                            <li>• Basic platform access</li>
                            <li>• Profile creation</li>
                            <li>• Limited support</li>
                          </>
                        )}
                        {subscriptionStatus.subscription_tier === 'standard' && (
                          <>
                            <li>• Create 1 deal</li>
                            <li>• Basic analytics</li>
                            <li>• Email support</li>
                          </>
                        )}
                        {['premium', 'premiumpro', 'enterprise'].includes(subscriptionStatus.subscription_tier) && (
                          <>
                            <li>• Access to investor database</li>
                            <li>• Advanced deal creation</li>
                            <li>• Priority support</li>
                            <li>• Advanced analytics</li>
                          </>
                        )}
                        {['premiumpro', 'enterprise'].includes(subscriptionStatus.subscription_tier) && (
                          <>
                            <li>• Unlimited deals</li>
                            <li>• White-label options</li>
                            <li>• API access</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Upgrade Options */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Available Upgrades:</h3>
                      <div className="space-y-2">
                        {subscriptionStatus.subscription_tier === 'free' && (
                          <Button
                            onClick={() => navigate('/upgrade-plan?plan=premium')}
                            className="w-full justify-start"
                            variant="outline"
                          >
                            Upgrade to Premium
                          </Button>
                        )}
                        {subscriptionStatus.subscription_tier === 'standard' && (
                          <Button
                            onClick={() => navigate('/upgrade-plan?plan=premium')}
                            className="w-full justify-start"
                            variant="outline"
                          >
                            Upgrade to Premium
                          </Button>
                        )}
                        {subscriptionStatus.subscription_tier === 'premium' && (
                          <Button
                            onClick={() => navigate('/upgrade-plan?plan=premiumpro')}
                            className="w-full justify-start"
                            variant="outline"
                          >
                            Upgrade to Premium Pro
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const SubscriptionManagement = () => {
  return (
    <ProtectedRoute>
      <SubscriptionManagementPage />
    </ProtectedRoute>
  );
};

export default SubscriptionManagement;
