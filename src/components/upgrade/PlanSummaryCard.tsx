
import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plan } from '@/components/pricing/types';

interface PlanSummaryCardProps {
  plan: Plan;
  isYearly: boolean;
}

const PlanSummaryCard = ({ plan, isYearly }: PlanSummaryCardProps) => {
  const getPrice = () => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getOriginalPrice = () => {
    return isYearly ? plan.yearlyOriginalPrice : plan.monthlyOriginalPrice;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Plan Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          <div className="mb-2">
            {getOriginalPrice() && (
              <div className="text-lg text-gray-400 line-through mb-1">
                {getOriginalPrice()}/month
              </div>
            )}
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {getPrice()}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                /month
              </span>
            </div>
            {isYearly && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                (billed annually)
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {plan.description}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            What's included:
          </h4>
          <ul className="space-y-2">
            {plan.includedFeatures ? (
              plan.features.map((feature, index) => {
                const isIncluded = plan.includedFeatures!.includes(feature);
                return (
                  <li key={index} className="flex items-start">
                    <Check className={`h-4 w-4 ${isIncluded ? 'text-primary-600' : 'text-gray-400'} mr-2 mt-0.5 flex-shrink-0`} />
                    <span className={`text-sm ${isIncluded ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      {feature}
                    </span>
                  </li>
                );
              })
            ) : (
              plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-4 w-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanSummaryCard;
