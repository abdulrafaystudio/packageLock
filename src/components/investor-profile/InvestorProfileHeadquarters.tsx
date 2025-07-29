import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Investor } from '@/hooks/useInvestors';

interface InvestorProfileHeadquartersProps {
  investor: Investor;
}

const InvestorProfileHeadquarters = ({ investor }: InvestorProfileHeadquartersProps) => {
  const hasLocationInfo = investor.country || investor.website;
  
  if (!hasLocationInfo) return null;

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary-600" />
          Headquarters & Website
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {investor.country && (
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌍</span>
            <span className="text-gray-700 dark:text-gray-300">
              {investor.country}
            </span>
          </div>
        )}
        {investor.website && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Globe className="h-4 w-4 mr-2" />
            <a 
              href={investor.website.startsWith('http') ? investor.website : `https://${investor.website}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 break-all"
            >
              {investor.website}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestorProfileHeadquarters;
