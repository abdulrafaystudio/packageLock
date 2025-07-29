import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Investor } from '@/hooks/useInvestors';
import { cleanText } from '@/utils/textCleaning';

interface InvestorProfileGeographyProps {
  investor: Investor;
}

const InvestorProfileGeography = ({ investor }: InvestorProfileGeographyProps) => {
  // Parse geography from string format
  const parseGeography = (geography: string | undefined): string[] => {
    if (!geography || !geography.trim()) return [];
    
    // Handle different delimiters
    const delimiters = [',', ';', '|', '\n'];
    let items: string[] = [geography];
    
    for (const delimiter of delimiters) {
      if (geography.includes(delimiter)) {
        items = geography.split(delimiter);
        break;
      }
    }
    
    return items
      .map(item => {
        const cleaned = cleanText(item.trim());
        return cleaned || item.trim();
      })
      .filter(item => item && item.length > 0);
  };

  const geographyList = parseGeography(investor.preferred_geographical_areas);

  if (geographyList.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Preferred Geographical Areas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {geographyList.map((location, index) => (
            <Badge 
              key={index}
              variant="outline"
              className="px-4 py-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-600 dark:hover:border-purple-500 dark:hover:bg-purple-900 dark:hover:text-purple-200 transition-colors duration-200"
            >
              {location}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorProfileGeography;
