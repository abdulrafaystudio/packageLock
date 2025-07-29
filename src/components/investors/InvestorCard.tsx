import React from 'react';
import { MapPin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Investor } from '@/hooks/useInvestors';
import { cleanText } from '@/utils/textCleaning';
import { mapInvestorTypeToDisplay } from '@/utils/investorTypeMapping';

interface InvestorCardProps {
  investor: Investor;
  onTypeClick?: (type: string) => void;
}

const InvestorCard: React.FC<InvestorCardProps> = ({ investor, onTypeClick }) => {
  const [searchParams] = useSearchParams();

  // Helper function to truncate long descriptions
  const truncateDescription = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Helper function to get the display type using the new mapping
  const getDisplayType = (type: string | null | undefined): string | null => {
    if (!type) return null;
    
    // Use the mapping function to convert database type to display type
    return mapInvestorTypeToDisplay(type);
  };

  const displayName = investor.investor_name || 'Unnamed Investor';
  const displayDescription = investor.description ? truncateDescription(investor.description) : null;
  const displayCountry = investor.country;
  const displayType = getDisplayType(investor.type);

  const handleTypeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (displayType && onTypeClick) {
      onTypeClick(displayType);
    }
  };

  // Create the profile URL with current search parameters to preserve filters
  const profileUrl = `/investor/${investor.id}?returnFilters=${encodeURIComponent(searchParams.toString())}`;

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-600 hover:shadow-lg transition-all h-full flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <span className="text-primary-600 font-bold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300 truncate">
              {displayName}
            </h3>
            <div className="mb-2">
              {displayType && (
                <Badge 
                  variant="secondary" 
                  className="text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  onClick={handleTypeClick}
                >
                  {displayType}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          {displayDescription && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm transition-colors duration-300 line-clamp-3">
              {displayDescription}
            </p>
          )}

          <div className="space-y-3 mb-4 flex-1">
            {displayCountry && (
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{displayCountry}</span>
              </div>
            )}
          </div>

          <Link to={profileUrl} className="mt-auto">
            <Button 
              size="sm" 
              className="w-full rounded-full bg-primary-600 hover:bg-primary-700 text-white"
            >
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorCard;
