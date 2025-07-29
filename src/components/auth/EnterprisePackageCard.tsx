
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { brokerPlans } from '@/components/pricing/brokerPlansData';

interface EnterprisePackageCardProps {
  isYearly?: boolean;
}

const EnterprisePackageCard = ({ isYearly = false }: EnterprisePackageCardProps) => {
  const enterprisePlan = brokerPlans.find(plan => plan.name === 'Enterprise');
  
  if (!enterprisePlan) {
    return null;
  }

  const renderPricing = () => {
    // For paid plans, show strikethrough original price and discounted price
    const currentPrice = isYearly ? enterprisePlan.yearlyPrice : enterprisePlan.monthlyPrice;
    const originalPrice = isYearly ? enterprisePlan.yearlyOriginalPrice : enterprisePlan.monthlyOriginalPrice;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60px] sm:min-h-[80px]">
        {originalPrice ? (
          <div className="text-base sm:text-lg text-gray-400 line-through mb-1 h-4 sm:h-6">
            {originalPrice}/month
          </div>
        ) : (
          <div className="h-4 sm:h-6 mb-1"></div>
        )}
        <div className="flex items-baseline">
          <span className="text-3xl sm:text-4xl font-bold text-purple-600">
            {currentPrice}
          </span>
          <span className="text-sm font-normal text-gray-500 ml-2">
            /month
          </span>
        </div>
        {isYearly ? (
          <span className="text-xs sm:text-sm text-gray-500 h-3 sm:h-5 text-center">
            (billed annually)
          </span>
        ) : (
          <div className="h-3 sm:h-5"></div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white border-gray-200 shadow-lg h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h2>
          <div className="mb-3">
            {renderPricing()}
          </div>
          <p className="text-gray-600">{enterprisePlan.description}</p>
        </div>

        <div className="space-y-3 flex-grow">
          <h3 className="text-base font-semibold text-gray-900">What you get:</h3>
          {enterprisePlan.features.map((feature, index) => {
            const isIncluded = enterprisePlan.includedFeatures?.includes(feature) || false;
            return (
              <div key={index} className="flex items-start">
                {isIncluded ? (
                  <Check className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <span className={`text-sm ${isIncluded ? 'text-gray-700' : 'text-gray-400'}`}>{feature}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            The complete solution for large organizations and enterprise clients. Get unlimited access and dedicated support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnterprisePackageCard;
