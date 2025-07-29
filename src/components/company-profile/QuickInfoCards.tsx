
import React from 'react';
import { Deal } from '@/hooks/useDeals';

interface QuickInfoCardsProps {
  deal: Deal;
  dealTypeDisplay: string;
}

const QuickInfoCards = ({ deal, dealTypeDisplay }: QuickInfoCardsProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Deal Type</div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium capitalize">
            {dealTypeDisplay}
          </span>
        </div>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Location</div>
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-medium">{deal.location}</span>
        </div>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Year Founded</div>
        <div className="text-gray-900 font-medium">{deal.year_founded}</div>
      </div>
    </div>
  );
};

export default QuickInfoCards;
