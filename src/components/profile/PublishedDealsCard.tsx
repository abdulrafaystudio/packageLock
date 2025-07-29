
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PublishedDealsHeader from './PublishedDealsHeader';
import DealUsageSection from './DealUsageSection';
import DealListItem from './DealListItem';
import EmptyDealsState from './EmptyDealsState';

interface PublishedDeal {
  id: string;
  name: string;
  type: string;
  target?: string;
  price?: string;
  status: string;
  publishDate: string;
}

interface PublishedDealsCardProps {
  publishedDeals: PublishedDeal[];
  canCreateMoreDeals: boolean;
  permissions: {
    canCreateDeals: boolean;
    maxDeals: number;
  };
  userDealsCount: number;
  getDealLimitText: () => string;
  onStatusChange?: (dealId: string, newStatus: string) => void;
}

const PublishedDealsCard: React.FC<PublishedDealsCardProps> = ({
  publishedDeals,
  canCreateMoreDeals,
  permissions,
  userDealsCount,
  getDealLimitText,
  onStatusChange
}) => {
  const handleStatusChange = (dealId: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(dealId, newStatus);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <PublishedDealsHeader 
        canCreateMoreDeals={canCreateMoreDeals}
        permissions={permissions}
      />
      <CardContent>
        <DealUsageSection 
          permissions={permissions}
          userDealsCount={userDealsCount}
        />

        {publishedDeals.length > 0 ? (
          <div className="space-y-4">
            {publishedDeals.map(deal => (
              <DealListItem
                key={deal.id}
                deal={deal}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <EmptyDealsState permissions={permissions} />
        )}
      </CardContent>
    </Card>
  );
};

export default PublishedDealsCard;
