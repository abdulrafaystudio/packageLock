
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { companyPlans } from '@/components/pricing/companyPlansData';

interface PremiumPackageCardProps {
  isYearly?: boolean;
}

const PremiumPackageCard = ({ isYearly = false }: PremiumPackageCardProps) => {
  const premiumPlan = companyPlans.find(plan => plan.name === 'Premium');
  
  if (!premiumPlan) {
    return null;
  }

  const renderPricing = () => {
    // For paid plans, show strikethrough original price and discounted price
    const currentPrice = isYearly ? premiumPlan.yearlyPrice : premiumPlan.monthlyPrice;
    const originalPrice = isYearly ? premiumPlan.yearlyOriginalPrice : premiumPlan.monthlyOriginalPrice;

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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Premium</h2>
          <div className="mb-3">
            {renderPricing()}
          </div>
          <p className="text-gray-600">{premiumPlan.description}</p>
        </div>

        <div className="space-y-3 flex-grow">
          <h3 className="text-base font-semibold text-gray-900">What you get:</h3>
          {premiumPlan.features.map((feature, index) => {
            const isIncluded = premiumPlan.includedFeatures?.includes(feature) || true;
            return (
              <div key={index} className="flex items-start">
                <Check className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            The ultimate package for serious investors, funds, and capital raisers. Get complete access to our entire network and premium tools.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumPackageCard;
