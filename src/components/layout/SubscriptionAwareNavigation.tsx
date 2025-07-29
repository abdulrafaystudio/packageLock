
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Building2, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEventDrivenSubscriptionCheck } from '@/hooks/auth/useEventDrivenSubscriptionCheck';
import SubscriptionBadge from '@/components/subscription/SubscriptionBadge';

interface SubscriptionAwareNavigationProps {
  className?: string;
}

interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  requiredTier?: string;
}

const SubscriptionAwareNavigation = ({ className }: SubscriptionAwareNavigationProps) => {
  const navigate = useNavigate();
  const { checkFeatureAccess, subscriptionStatus, packageType, user, loading, subscriptionLoading } = useAuth();
  
  const [investorsAccess, setInvestorsAccess] = useState<FeatureAccess>({ hasAccess: false });
  const [dealsAccess, setDealsAccess] = useState<FeatureAccess>({ hasAccess: false });
  const [accessLoading, setAccessLoading] = useState(true);

  // Event-driven subscription checking for sensitive pages
  useEventDrivenSubscriptionCheck({
    triggerPaths: ['/companies', '/investors', '/deals'],
    sessionKey: 'subscription_sensitive_pages_checked',
    checkOnce: true
  });

  // Check feature access when subscription data is available
  useEffect(() => {
    const checkAccess = async () => {
      if (loading || !user || !checkFeatureAccess) {
        console.log('🔄 Waiting for auth data...', { loading, hasUser: !!user, hasCheckFunction: !!checkFeatureAccess });
        return;
      }

      // Don't wait for subscription loading - use cached data
      try {
        setAccessLoading(true);
        console.log('🔍 Checking feature access for navigation', { 
          user: user.email, 
          packageType, 
          subscriptionTier: subscriptionStatus?.subscription_tier,
          subscriptionLoading
        });
        
        const [investors, deals] = await Promise.all([
          checkFeatureAccess('investors'),
          checkFeatureAccess('deals')
        ]);
        
        console.log('✅ Feature access results:', { investors, deals });
        setInvestorsAccess(investors);
        setDealsAccess(deals);
      } catch (error) {
        console.error('💥 Error checking feature access:', error);
        setInvestorsAccess({ hasAccess: false, reason: 'error' });
        setDealsAccess({ hasAccess: false, reason: 'error' });
      } finally {
        setAccessLoading(false);
      }
    };

    checkAccess();
  }, [checkFeatureAccess, subscriptionStatus, packageType, user, loading]); // Removed subscriptionLoading dependency

  const handleNavigation = async (path: string, feature?: string) => {
    if (feature && checkFeatureAccess) {
      try {
        const access = await checkFeatureAccess(feature);
        if (!access.hasAccess) {
          if (access.reason === 'authentication_required') {
            navigate('/auth-free');
            return;
          }
          if (access.requiredTier) {
            navigate(`/upgrade-plan?plan=${access.requiredTier}&feature=${feature}`);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking feature access for navigation:', error);
        navigate('/auth-free');
        return;
      }
    }
    navigate(path);
  };

  // Show loading state only while auth is loading or access is being checked
  if (loading || accessLoading) {
    return (
      <nav className={`flex items-center space-x-4 ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </nav>
    );
  }

  // Don't render if no user (but don't show loading)
  if (!user) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-4 ${className}`}>
      {/* Investors Link */}
      <Button
        variant={investorsAccess.hasAccess ? "ghost" : "outline"}
        size="sm"
        onClick={() => handleNavigation('/investors', 'investors')}
        className="relative"
      >
        <Users className="h-4 w-4 mr-2" />
        Investors
        {!investorsAccess.hasAccess && (
          <Crown className="h-3 w-3 ml-1 text-yellow-500" />
        )}
      </Button>

      {/* Deals Link */}
      <Button
        variant={dealsAccess.hasAccess ? "ghost" : "outline"}
        size="sm"
        onClick={() => handleNavigation('/deals', 'deals')}
        className="relative"
      >
        <Building2 className="h-4 w-4 mr-2" />
        Deals
        {!dealsAccess.hasAccess && (
          <Zap className="h-3 w-3 ml-1 text-blue-500" />
        )}
      </Button>

      {/* Subscription Status Badge */}
      {subscriptionStatus && (
        <div className="flex items-center space-x-2">
          <SubscriptionBadge
            tier={subscriptionStatus.subscription_tier}
            isActive={subscriptionStatus.subscribed}
            status={subscriptionStatus.subscription_status}
            size="sm"
          />
        </div>
      )}

      {/* Smart Upgrade Button - show for free users or when subscription is loading */}
      {(!subscriptionStatus || subscriptionStatus.subscription_tier === 'free' || !subscriptionStatus.subscribed) && (
        <Button
          size="sm"
          onClick={() => navigate('/upgrade-plan?plan=premium')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Crown className="h-4 w-4 mr-1" />
          Upgrade
        </Button>
      )}
    </nav>
  );
};

export default SubscriptionAwareNavigation;
