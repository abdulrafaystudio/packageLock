
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Users, Building2, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface UpgradePromptProps {
  feature?: string;
  requiredTier?: string;
  title?: string;
  description?: string;
  compact?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  requiredTier = 'premium',
  title,
  description,
  compact = false
}) => {
  const navigate = useNavigate();
  const { packageType } = useAuth();

  const getFeatureIcon = () => {
    switch (feature) {
      case 'investors':
        return <Users className="h-5 w-5" />;
      case 'deals':
        return <Building2 className="h-5 w-5" />;
      case 'unlimited_deals':
        return <Star className="h-5 w-5" />;
      default:
        return <Crown className="h-5 w-5" />;
    }
  };

  const getFeatureTitle = () => {
    if (title) return title;
    
    switch (feature) {
      case 'investors':
        return 'Access Investor Database';
      case 'deals':
        return 'Create Deals';
      case 'unlimited_deals':
        return 'Unlimited Deals';
      default:
        return 'Premium Feature';
    }
  };

  const getFeatureDescription = () => {
    if (description) return description;
    
    switch (feature) {
      case 'investors':
        return 'Get access to thousands of investors and their contact information with a Premium plan.';
      case 'deals':
        return 'Start creating and managing your deals with a Standard plan or higher.';
      case 'unlimited_deals':
        return 'Create unlimited deals and access advanced features with Premium Pro.';
      default:
        return `This feature requires a ${requiredTier} plan or higher.`;
    }
  };

  const getTierIcon = () => {
    switch (requiredTier.toLowerCase()) {
      case 'standard':
        return <Zap className="h-4 w-4" />;
      case 'premium':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Building2 className="h-4 w-4" />;
      case 'premiumpro':
        return <Star className="h-4 w-4" />;
      default:
        return <Crown className="h-4 w-4" />;
    }
  };

  const handleUpgrade = () => {
    navigate(`/upgrade-plan?plan=${requiredTier}&feature=${feature}`);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
        <div className="flex items-center gap-3">
          {getFeatureIcon()}
          <div>
            <div className="font-medium">{getFeatureTitle()}</div>
            <div className="text-sm text-gray-600">Requires {requiredTier} plan</div>
          </div>
        </div>
        <Button onClick={handleUpgrade} size="sm" className="flex items-center gap-2">
          {getTierIcon()}
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 p-3 bg-white rounded-full shadow-sm">
          {getFeatureIcon()}
        </div>
        <CardTitle className="text-lg">{getFeatureTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          {getFeatureDescription()}
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>Currently on:</span>
          <span className="font-medium capitalize">{packageType}</span>
          <span>→</span>
          <span className="font-medium capitalize">{requiredTier}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={handleUpgrade} className="flex items-center gap-2">
            {getTierIcon()}
            Upgrade to {requiredTier}
          </Button>
          <Button variant="outline" onClick={() => navigate('/pricing')}>
            View All Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
