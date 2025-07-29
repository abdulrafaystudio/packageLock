
import React from 'react';
import { Deal } from '@/hooks/useDeals';

interface PriceBannerProps {
  deal: Deal;
  priceLabel: string;
  mainPrice: string;
}

const PriceBanner = ({ priceLabel, mainPrice }: PriceBannerProps) => {
  return (
    <div className="text-white p-4 rounded-lg mb-6 bg-purple-500">
      <div className="flex justify-between items-center">
        <span className="text-lg font-medium">
          {priceLabel}
        </span>
        <span className="text-2xl font-bold">
          {mainPrice}
        </span>
      </div>
    </div>
  );
};

export default PriceBanner;
