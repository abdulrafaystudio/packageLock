
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Building2, Star } from 'lucide-react';

interface SubscriptionBadgeProps {
  tier: string;
  isActive: boolean;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  tier,
  isActive,
  status,
  size = 'md',
  showIcon = true
}) => {
  const getVariant = () => {
    if (!isActive || status === 'cancelled') return 'destructive';
    if (status === 'past_due') return 'secondary';
    
    switch (tier.toLowerCase()) {
      case 'free':
        return 'outline';
      case 'standard':
        return 'default';
      case 'premium':
        return 'default';
      case 'enterprise':
        return 'default';
      case 'premiumpro':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (tier.toLowerCase()) {
      case 'free':
        return null;
      case 'standard':
        return <Zap className="h-3 w-3" />;
      case 'premium':
        return <Crown className="h-3 w-3" />;
      case 'enterprise':
        return <Building2 className="h-3 w-3" />;
      case 'premiumpro':
        return <Star className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getDisplayText = () => {
    const tierText = tier.charAt(0).toUpperCase() + tier.slice(1);
    
    if (!isActive) {
      return `${tierText} (Inactive)`;
    }
    
    if (status === 'past_due') {
      return `${tierText} (Past Due)`;
    }
    
    return tierText;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-3 py-2';
      default:
        return 'text-xs px-2.5 py-1.5';
    }
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={`flex items-center gap-1 ${getSizeClasses()}`}
    >
      {getIcon()}
      {getDisplayText()}
    </Badge>
  );
};

export default SubscriptionBadge;
