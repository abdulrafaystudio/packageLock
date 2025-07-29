
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { Calendar, CreditCard, AlertTriangle, CheckCircle, Crown, Wifi } from 'lucide-react';
import SubscriptionBadge from './SubscriptionBadge';
import DegradedModeIndicator from './DegradedModeIndicator';
import SubscriptionErrorBoundary from '../error/SubscriptionErrorBoundary';

const SubscriptionStatusDisplay: React.FC = () => {
  const { 
    user, 
    subscriptionStatus, 
    packageType, 
    hasActiveSubscription,
    isOfflineMode,
    isStripeUnavailable,
    lastSuccessfulCheck,
    gracePeriodActive,
    checkSubscription,
    subscriptionLoading
  } = useAuth();
  
  const { openCustomerPortal, isLoading } = useStripeCheckout();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            Please log in to view subscription status
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = () => {
    if (!subscriptionStatus) return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    
    if (hasActiveSubscription) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const handleRetryConnection = async () => {
    try {
      await checkSubscription();
    } catch (error) {
      console.error('Failed to retry connection:', error);
    }
  };

  return (
    <SubscriptionErrorBoundary
      fallbackTitle="Subscription Status Error"
      fallbackMessage="Unable to load subscription status. Please try refreshing the page."
      onRetry={handleRetryConnection}
    >
      <div className="space-y-4">
        {/* Degraded Mode Indicator */}
        <DegradedModeIndicator
          isOffline={isOfflineMode}
          isStripeUnavailable={isStripeUnavailable}
          lastSuccessfulCheck={lastSuccessfulCheck || undefined}
          onRetryConnection={handleRetryConnection}
          isRetrying={subscriptionLoading}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
              {(isOfflineMode || isStripeUnavailable) && (
                <Badge variant="outline" className="text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  Cached Data
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <div className="font-medium">Current Plan</div>
                  <div className="text-sm text-gray-500">
                    {subscriptionStatus ? `${subscriptionStatus.subscription_tier} Plan` : `${packageType} Plan`}
                    {gracePeriodActive && (
                      <span className="ml-2 text-orange-600 font-medium">(Grace Period)</span>
                    )}
                  </div>
                </div>
              </div>
              <SubscriptionBadge
                tier={subscriptionStatus?.subscription_tier || packageType}
                isActive={hasActiveSubscription}
                status={subscriptionStatus?.subscription_status}
              />
            </div>

            {/* Subscription Details */}
            {subscriptionStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    {subscriptionStatus.subscription_status}
                    {gracePeriodActive && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        Grace Period
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Next Billing</div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(subscriptionStatus.subscription_end)}
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {lastSuccessfulCheck && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                Last updated: {lastSuccessfulCheck.toLocaleString()}
                {(isOfflineMode || isStripeUnavailable) && (
                  <span className="ml-2 text-orange-600">(Using cached data)</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {hasActiveSubscription ? (
                <Button
                  variant="outline"
                  onClick={openCustomerPortal}
                  disabled={isLoading || isOfflineMode || isStripeUnavailable}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  {isOfflineMode || isStripeUnavailable ? 'Unavailable Offline' : 'Manage Subscription'}
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/upgrade-plan?plan=premium'}
                  disabled={isOfflineMode}
                  className="flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  {isOfflineMode ? 'Upgrade Unavailable' : 'Upgrade Plan'}
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={handleRetryConnection}
                disabled={subscriptionLoading}
                className="flex items-center gap-2"
              >
                <Wifi className={`h-4 w-4 ${subscriptionLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {subscriptionStatus?.subscription_status === 'past_due' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your subscription is past due. 
              {gracePeriodActive 
                ? ' You have limited access during the grace period. Please update your payment method.'
                : ' Please update your payment method to continue using premium features.'
              }
            </AlertDescription>
          </Alert>
        )}

        {!hasActiveSubscription && packageType === 'free' && !gracePeriodActive && (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Upgrade to a premium plan to access advanced features like investor database and unlimited deals.
            </AlertDescription>
          </Alert>
        )}

        {gracePeriodActive && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're in a grace period with limited access to premium features. 
              Update your payment method to restore full access.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </SubscriptionErrorBoundary>
  );
};

export default SubscriptionStatusDisplay;
