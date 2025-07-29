
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { companyPlans, brokerPlans } from '@/components/pricing/PricingPlans';

interface FreePackageCardProps {
  isYearly?: boolean;
}

const FreePackageCard = ({ isYearly = false }: FreePackageCardProps) => {
  // Get the free plan from company plans (both company and broker free plans are the same)
  const freePlan = companyPlans.find(plan => plan.name === 'Free') || brokerPlans.find(plan => plan.name === 'Free');
  
  if (!freePlan) {
    return null;
  }

  return (
    <Card className="bg-white border-gray-200 shadow-lg h-full">
      <CardContent className="p-8 h-full flex flex-col">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
          <div className="text-4xl font-bold text-purple-600 mb-4">$0/month</div>
          <p className="text-gray-600">{freePlan.description}</p>
        </div>

        <div className="space-y-4 flex-grow">
          <h3 className="text-lg font-semibold text-gray-900">What you get:</h3>
          {freePlan.features.map((feature, index) => {
            const isIncluded = freePlan.includedFeatures?.includes(feature) || false;
            return (
              <div key={index} className="flex items-start">
                {isIncluded ? (
                  <Check className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                )}
                <span className={`${isIncluded ? 'text-gray-700' : 'text-gray-400'}`}>{feature}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Perfect for exploring the platform and discovering investment opportunities without any commitment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreePackageCard;
