
import React from 'react';

interface DealUsageSectionProps {
  permissions: {
    canCreateDeals: boolean;
    maxDeals: number;
  };
  userDealsCount: number;
}

const DealUsageSection: React.FC<DealUsageSectionProps> = ({
  permissions,
  userDealsCount
}) => {
  const getDealUsageText = () => {
    if (!permissions.canCreateDeals) {
      return "Upgrade to create deals";
    }
    
    if (permissions.maxDeals === -1) {
      return `${userDealsCount} deals created`;
    }
    
    const remaining = permissions.maxDeals - userDealsCount;
    if (remaining > 0) {
      return `You can create ${remaining} more deal${remaining !== 1 ? 's' : ''}`;
    } else {
      return "To create more deals upgrade to Enterprise";
    }
  };

  const getDealCountText = () => {
    if (!permissions.canCreateDeals) {
      return "0/0 deals used";
    }
    
    if (permissions.maxDeals === -1) {
      return `${userDealsCount} deals created`;
    }
    
    return `${userDealsCount}/${permissions.maxDeals} deals used`;
  };

  // Check if we should show the deal usage section
  const shouldShowDealUsage = () => {
    // For unlimited plans (Enterprise and PremiumPro), only show usage if user has deals
    if (permissions.maxDeals === -1) {
      return userDealsCount > 0;
    }
    // For limited plans, always show usage
    return true;
  };

  if (!shouldShowDealUsage()) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
      <p className="font-medium text-gray-900 dark:text-gray-300 text-lg mb-1">
        {getDealCountText()}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {getDealUsageText()}
      </p>
    </div>
  );
};

export default DealUsageSection;
