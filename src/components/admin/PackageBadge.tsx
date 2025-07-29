
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PackageBadgeProps {
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
}

const PackageBadge: React.FC<PackageBadgeProps> = ({ packageType }) => {
  const getPackageBadgeColor = (packageType: string) => {
    switch (packageType) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'freepro': return 'bg-teal-100 text-teal-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      case 'premiumpro': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-white text-gray-800 border border-gray-300';
    }
  };

  const getDisplayName = (packageType: string) => {
    switch (packageType) {
      case 'freepro': return 'Free Pro';
      case 'premiumpro': return 'Premium Pro';
      case 'free': return 'Free';
      case 'standard': return 'Standard';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return packageType.charAt(0).toUpperCase() + packageType.slice(1);
    }
  };

  return (
    <Badge className={getPackageBadgeColor(packageType)}>
      {getDisplayName(packageType)}
    </Badge>
  );
};

export default PackageBadge;
