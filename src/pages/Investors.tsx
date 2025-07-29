
import React from 'react';
import Navigation from '@/components/Navigation';
import InvestorsHeader from '@/components/investors/InvestorsHeader';
import InvestorsContent from '@/components/investors/InvestorsContent';
import InvestorsAuthWrapper from '@/components/investors/InvestorsAuthWrapper';

const Investors = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <InvestorsAuthWrapper>
        <InvestorsHeader />
        <InvestorsContent />
      </InvestorsAuthWrapper>
    </div>
  );
};

export default Investors;
