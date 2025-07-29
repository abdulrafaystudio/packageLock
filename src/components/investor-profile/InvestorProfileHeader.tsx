import React from 'react';
import { Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Investor } from '@/hooks/useInvestors';
import { cleanText } from '@/utils/textCleaning';

interface InvestorProfileHeaderProps {
  investor: Investor;
}

const InvestorProfileHeader = ({ investor }: InvestorProfileHeaderProps) => {
  const displayName = investor.investor_name || 'Unnamed Investor';
  const displayType = cleanText(investor.type);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-8">
        <div className="flex items-start space-x-6 mb-6">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center border-2 border-purple-800">
            <span className="text-primary-600 font-bold text-2xl">
              {displayName.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {displayName}
            </h1>
            {displayType && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {displayType}
              </p>
            )}
            
            <div className="flex items-center space-x-3 mb-4">
              {investor.website && investor.website.trim() && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:border-purple-700 hover:text-purple-200"
                >
                  <a 
                    href={investor.website.startsWith('http') ? investor.website : `https://${investor.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorProfileHeader;
