
import React from 'react';
import PricingCard from './PricingCard';
import PricingToggle from './PricingToggle';
import { Plan } from './types';

interface PricingTabContentProps {
  plans: Plan[];
  isYearly: boolean;
  onToggle: () => void;
  isCompaniesTab?: boolean;
}

const PricingTabContent = ({ plans, isYearly, onToggle, isCompaniesTab = false }: PricingTabContentProps) => {
  return (
    <>
      <PricingToggle isYearly={isYearly} onToggle={onToggle} />
      
      <div className={`grid gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto ${
        plans.length === 3 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {plans.map((plan, index) => (
          <PricingCard
            key={index}
            plan={plan}
            isYearly={isYearly}
            isCompaniesTab={isCompaniesTab}
          />
        ))}
      </div>
    </>
  );
};

export default PricingTabContent;
