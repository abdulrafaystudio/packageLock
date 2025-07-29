
import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import DealActionsDropdown from './DealActionsDropdown';

interface PublishedDeal {
  id: string;
  name: string;
  type: string;
  target?: string;
  price?: string;
  status: string;
  publishDate: string;
}

interface DealListItemProps {
  deal: PublishedDeal;
  onStatusChange: (dealId: string, newStatus: string) => void;
}

const DealListItem: React.FC<DealListItemProps> = ({ deal, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to format deal type display
  const formatDealTypeDisplay = (dealType: string) => {
    switch (dealType) {
      case 'capital':
        return 'Raising Capital';
      case 'sell':
        return 'Business for Sale';
      case 'crowdfunding':
        return 'Crowdfunding';
      default:
        return dealType;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Funded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeClassName = (status: string) => {
    if (status === 'Pending') {
      return 'bg-blue-500 text-white hover:bg-blue-600';
    }
    if (status === 'Funded') {
      return 'bg-green-500 text-white hover:bg-green-600';
    }
    return '';
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(deal.id, newStatus);
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="rounded-lg bg-gray-50 dark:bg-gray-700 transition-colors duration-300"
    >
      {/* Mobile Layout - Collapsible */}
      <div className="md:hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="flex-1 pr-4 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-gray-300 transition-colors duration-300 line-clamp-2 break-words">
                {deal.name}
              </h4>
            </div>
            <div className="flex-shrink-0">
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="overflow-hidden">
          <div className="px-4 pb-4">
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                {formatDealTypeDisplay(deal.type)}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-300 transition-colors duration-300">
                {deal.target || deal.price}
              </p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-500 transition-colors duration-300" />
                <span className="text-xs text-gray-500 dark:text-gray-500 transition-colors duration-300">
                  {deal.publishDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Badge 
                  variant={getStatusBadgeVariant(deal.status)}
                  className={`text-xs ${getStatusBadgeClassName(deal.status)}`}
                >
                  {deal.status}
                </Badge>
                <DealActionsDropdown
                  dealId={deal.id}
                  currentStatus={deal.status}
                  onStatusChange={handleStatusChange}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>

      {/* Desktop Layout - Original */}
      <div className="hidden md:flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-300 transition-colors duration-300">
              {deal.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              {formatDealTypeDisplay(deal.type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-medium text-gray-900 dark:text-gray-300 transition-colors duration-300">
              {deal.target || deal.price}
            </p>
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-500 transition-colors duration-300" />
              <span className="text-xs text-gray-500 dark:text-gray-500 transition-colors duration-300">
                {deal.publishDate}
              </span>
              <Badge 
                variant={getStatusBadgeVariant(deal.status)}
                className={`text-xs ${getStatusBadgeClassName(deal.status)}`}
              >
                {deal.status}
              </Badge>
            </div>
          </div>
          <DealActionsDropdown
            dealId={deal.id}
            currentStatus={deal.status}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </Collapsible>
  );
};

export default DealListItem;
