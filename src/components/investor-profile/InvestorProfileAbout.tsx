import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Investor } from '@/hooks/useInvestors';

interface InvestorProfileAboutProps {
  investor: Investor;
}

const InvestorProfileAbout = ({ investor }: InvestorProfileAboutProps) => {
  // Only show if description exists and is not empty
  if (!investor.description || !investor.description.trim()) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Description</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {investor.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorProfileAbout;
