import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Investor } from '@/hooks/useInvestors';

interface InvestorProfileLocationProps {
  investor: Investor;
}

const InvestorProfileLocation = ({ investor }: InvestorProfileLocationProps) => {
  if (!investor.country || !investor.country.trim()) return null;

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary-600" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">
            {investor.country}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorProfileLocation;
