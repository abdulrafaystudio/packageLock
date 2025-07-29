
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Shield } from 'lucide-react';
import { companyPlans } from '@/components/pricing/companyPlansData';

interface StandardPackageCardProps {
  isYearly?: boolean;
}

const StandardPackageCard = ({ isYearly = false }: StandardPackageCardProps) => {
  const standardPlan = companyPlans.find(plan => plan.name === 'Standard');
  
  if (!standardPlan) {
    return null;
  }

  const renderPricing = () => {
    const currentPrice = isYearly ? standardPlan.yearlyPrice : standardPlan.monthlyPrice;
    const originalPrice = isYearly ? standardPlan.yearlyOriginalPrice : standardPlan.monthlyOriginalPrice;

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
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg h-full">
      <CardContent className="p-8 h-full flex flex-col">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Standard</h2>
          <div className="mb-4">
            {renderPricing()}
          </div>
          <p className="text-gray-600">{standardPlan.description}</p>
        </div>

        <div className="flex-grow">
          <h3 className="font-semibold text-gray-900 mb-4">What's included:</h3>
          <ul className="space-y-3">
            {standardPlan.features.map((feature, index) => {
              const isIncluded = standardPlan.includedFeatures?.includes(feature) || false;
              return (
                <li key={index} className="flex items-center">
                  {isIncluded ? (
                    <Check className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  )}
                  <span className={`${isIncluded ? 'text-gray-700' : 'text-gray-400'}`}>{feature}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                Instant Account Activation
              </p>
              <p className="text-xs text-blue-700">
                Your Standard account is activated immediately after signup - start using all features right away!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandardPackageCard;
