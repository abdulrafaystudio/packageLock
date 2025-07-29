
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import DealTypeSelector from '@/components/deal-creation/DealTypeSelector';
import EditDealForm from '@/components/deal-creation/EditDealForm';
import { useDeal } from '@/hooks/useDeals';

const EditDeal = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const { data: deal, isLoading } = useDeal(dealId || '');
  const [dealType, setDealType] = useState<'capital' | 'sell' | 'crowdfunding' | null>(null);

  useEffect(() => {
    if (deal) {
      setDealType(deal.deal_type as 'capital' | 'sell' | 'crowdfunding');
    }
  }, [deal]);

  const handleSelectDealType = (type: 'capital' | 'sell' | 'crowdfunding') => {
    setDealType(type);
  };

  const handleBackToDealTypes = () => {
    setDealType(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white transition-colors duration-300">
        <Navigation />
        <main className="pt-20 pb-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-gray-600">Loading deal...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-white transition-colors duration-300">
        <Navigation />
        <main className="pt-20 pb-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-gray-600">Deal not found</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {!dealType ? (
            <DealTypeSelector onSelectDealType={handleSelectDealType} />
          ) : (
            <EditDealForm dealType={dealType} deal={deal} onBack={handleBackToDealTypes} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditDeal;
