
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Deal } from '@/hooks/useDeals';

interface FinancialInformationProps {
  deal: Deal;
  formatCurrency: (amount: number | string | null | undefined) => string;
}

const FinancialInformation = ({ deal, formatCurrency }: FinancialInformationProps) => {
  if (!deal.gross_revenue && !deal.ebitda && !deal.cash_flow) {
    return null;
  }

  return (
    <Card className="mb-8 bg-white border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Information</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {deal.gross_revenue && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Gross Revenue</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(deal.gross_revenue)}
              </div>
            </div>
          )}
          {deal.ebitda && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">EBITDA</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(deal.ebitda)}
              </div>
            </div>
          )}
          {deal.cash_flow && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Cash Flow</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(deal.cash_flow)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialInformation;
