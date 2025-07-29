
import React from 'react';

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: () => void;
}

const PricingToggle = ({ isYearly, onToggle }: PricingToggleProps) => {
  return (
    <div className="flex items-center justify-center space-x-4 mb-12">
      <span className={`text-lg ${!isYearly ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-300`}>
        Monthly
      </span>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isYearly ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isYearly ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center space-x-2">
        <span className={`text-lg ${isYearly ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-300`}>
          Yearly
        </span>
        <span className="text-sm text-primary-600 font-medium">
          Get 2 months free!
        </span>
      </div>
    </div>
  );
};

export default PricingToggle;
