
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ContactedInvestor {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_type: string | null;
  contact_date: string;
}

interface ContactedInvestorsCardProps {
  contactedInvestors: ContactedInvestor[];
  onInvestorClick: (investorId: string) => void;
  formatDate: (dateString: string) => string;
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
  loading?: boolean;
}

const ContactedInvestorsCard: React.FC<ContactedInvestorsCardProps> = ({
  contactedInvestors,
  onInvestorClick,
  formatDate,
  packageType,
  loading = false
}) => {
  const canAccessInvestors = packageType === 'premium' || packageType === 'premiumpro';

  const getEmptyStateContent = () => {
    if (canAccessInvestors) {
      return {
        message: "Contact investors now and find the perfect fit for you",
        buttonText: "Contact Investors",
        buttonLink: "/investors"
      };
    } else {
      return {
        message: "Contact investors now and find the perfect fit for you",
        buttonText: "Upgrade Now",
        buttonLink: "/pricing"
      };
    }
  };

  const emptyState = getEmptyStateContent();

  return (
    <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white transition-colors duration-300">Contacted Investors</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading contacted investors...</p>
          </div>
        ) : contactedInvestors.length > 0 ? (
          <div className="space-y-4">
            {contactedInvestors.map(investor => (
              <div 
                key={investor.id} 
                className="flex items-center justify-between p-4 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                onClick={() => onInvestorClick(investor.investor_id)}
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-300 transition-colors duration-300">{investor.investor_name}</h4>
                  {investor.investor_type && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{investor.investor_type}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">{formatDate(investor.contact_date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300 mb-4">
              {emptyState.message}
            </p>
            <Link to={emptyState.buttonLink}>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white hover:text-white">
                {emptyState.buttonText}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactedInvestorsCard;
