
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { brokerPlans } from '@/components/pricing/brokerPlansData';

interface PremiumProPackageCardProps {
  isYearly?: boolean;
}

const PremiumProPackageCard = ({ isYearly = false }: PremiumProPackageCardProps) => {
  const premiumProPlan = brokerPlans.find(plan => plan.name === 'Premium Pro');
  
  if (!premiumProPlan) {
    return null;
  }

  const renderPricing = () => {
    // For paid plans, show strikethrough original price and discounted price
    const currentPrice = isYearly ? premiumProPlan.yearlyPrice : premiumProPlan.monthlyPrice;
    const originalPrice = isYearly ? premiumProPlan.yearlyOriginalPrice : premiumProPlan.monthlyOriginalPrice;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60px] sm:min-h-[80px]">
        {originalPrice ? (
          <div className="text-base sm:text-lg text-purple-200 line-through mb-1 h-4 sm:h-6">
            {originalPrice}/month
          </div>
        ) : (
          <div className="h-4 sm:h-6 mb-1"></div>
        )}
        <div className="flex items-baseline">
          <span className="text-3xl sm:text-4xl font-bold text-white">
            {currentPrice}
          </span>
          <span className="text-sm font-normal text-purple-100 ml-2">
            /month
          </span>
        </div>
        {isYearly ? (
          <span className="text-xs sm:text-sm text-purple-100 h-3 sm:h-5 text-center">
            (billed annually)
          </span>
        ) : (
          <div className="h-3 sm:h-5"></div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-2xl h-full">
      <CardContent className="p-8 h-full flex flex-col">
        <div className="text-center mb-6">
          <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
            Premium Pro
          </div>
          <h2 className="text-2xl font-bold mb-2">Premium Pro</h2>
          <div className="mb-4">
            {renderPricing()}
          </div>
          <p className="text-purple-100">{premiumProPlan.description}</p>
        </div>

        <div className="space-y-4 flex-grow">
          <h3 className="text-lg font-semibold">What you get:</h3>
          {premiumProPlan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check className="h-5 w-5 text-white mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-purple-100">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white/10 rounded-lg">
          <p className="text-sm text-purple-100">
            The ultimate package for brokers and investors who need complete access to both companies and investors with unlimited outreach capabilities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumProPackageCard;
