
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import DealTypeSelector from '@/components/deal-creation/DealTypeSelector';
import DealForm from '@/components/deal-creation/DealForm';

const CreateDeal = () => {
  const [dealType, setDealType] = useState<'capital' | 'sell' | 'crowdfunding' | null>(null);

  const handleSelectDealType = (type: 'capital' | 'sell' | 'crowdfunding') => {
    setDealType(type);
  };

  const handleBackToDealTypes = () => {
    setDealType(null);
  };

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {!dealType ? (
            <DealTypeSelector onSelectDealType={handleSelectDealType} />
          ) : (
            <DealForm dealType={dealType} onBack={handleBackToDealTypes} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateDeal;
