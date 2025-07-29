
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Deal } from '@/hooks/useDeals';

interface DealInformationProps {
  deal: Deal;
  priceLabel: string;
  mainPrice: string;
  formatCurrency: (amount: number | string | null | undefined) => string;
}

const DealInformation = ({ deal, priceLabel, mainPrice, formatCurrency }: DealInformationProps) => {
  return (
    <Card className="mb-8 bg-white border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Deal Information</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">{priceLabel}</div>
            <div className="text-xl font-bold text-gray-900">
              {mainPrice}
            </div>
          </div>
          {deal.company_valuation && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Company Valuation</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(deal.company_valuation)}
              </div>
            </div>
          )}
          {deal.percentage_for_sale && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Percentage for Sale</div>
              <div className="text-xl font-bold text-gray-900">
                {deal.percentage_for_sale}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DealInformation;
