import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Investor } from '@/hooks/useInvestors';
import { cleanText } from '@/utils/textCleaning';

interface InvestorProfileVerticalsProps {
  investor: Investor;
}

const InvestorProfileVerticals = ({ investor }: InvestorProfileVerticalsProps) => {
  // Parse verticals from string format
  const parseVerticals = (verticals: string | undefined): string[] => {
    if (!verticals || !verticals.trim()) return [];
    
    // Handle different delimiters
    const delimiters = [',', ';', '|', '\n'];
    let items: string[] = [verticals];
    
    for (const delimiter of delimiters) {
      if (verticals.includes(delimiter)) {
        items = verticals.split(delimiter);
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

  const verticals = parseVerticals(investor.verticals);

  if (verticals.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Verticals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {verticals.map((vertical, index) => (
            <Badge 
              key={index}
              variant="secondary"
              className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-600 dark:hover:text-gray-200 transition-colors duration-200 border-gray-300 dark:border-gray-600"
            >
              {vertical}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorProfileVerticals;
