
import React from 'react';
import { Plus } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PublishedDealsHeaderProps {
  canCreateMoreDeals: boolean;
  permissions: {
    canCreateDeals: boolean;
    maxDeals: number;
  };
}

const PublishedDealsHeader: React.FC<PublishedDealsHeaderProps> = ({
  canCreateMoreDeals,
  permissions
}) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-gray-900 dark:text-white transition-colors duration-300">My Deals</CardTitle>
      {canCreateMoreDeals ? (
        <Link to="/create-deal">
          <Button className="bg-primary-600 hover:bg-primary-700 text-white hover:text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Deal
          </Button>
        </Link>
      ) : (
        <div className="text-right">
          {!permissions.canCreateDeals ? (
            <Link to="/pricing">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white hover:text-white">
                <Plus className="h-4 w-4 mr-2" />
                Upgrade to Create Deals
              </Button>
            </Link>
          ) : (
            <Button disabled className="bg-gray-400 text-gray-600">
              <Plus className="h-4 w-4 mr-2" />
              Deal Limit Reached
            </Button>
          )}
        </div>
      )}
    </CardHeader>
  );
};

export default PublishedDealsHeader;
