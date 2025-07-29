
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import PublishedDealsCard from '@/components/profile/PublishedDealsCard';

interface PublishedDeal {
  id: string;
  name: string;
  type: string;
  target?: string;
  price?: string;
  status: string;
  publishDate: string;
}

interface ProfileDealsSectionProps {
  userDeals: PublishedDeal[];
  userDealsCount: number;
  onStatusChange?: (dealId: string, newStatus: string) => void;
}

const ProfileDealsSection: React.FC<ProfileDealsSectionProps> = ({
  userDeals,
  userDealsCount,
  onStatusChange
}) => {
  const { permissions } = useAuth();

  const canCreateMoreDeals = () => {
    if (!permissions.canCreateDeals) return false;
    if (permissions.maxDeals === -1) return true;
    return userDealsCount < permissions.maxDeals;
  };

  const getDealLimitText = () => {
    if (!permissions.canCreateDeals) {
      return "Upgrade to create deals";
    }
    if (permissions.maxDeals === -1) {
      return `Unlimited deals (${userDealsCount} created)`;
    }
    return `${userDealsCount}/${permissions.maxDeals} deals used`;
  };

  return (
    <PublishedDealsCard
      publishedDeals={userDeals}
      canCreateMoreDeals={canCreateMoreDeals()}
      permissions={permissions}
      userDealsCount={userDealsCount}
      getDealLimitText={getDealLimitText}
      onStatusChange={onStatusChange}
    />
  );
};

export default ProfileDealsSection;
