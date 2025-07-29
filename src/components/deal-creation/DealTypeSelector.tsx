
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, TrendingUp, Users } from 'lucide-react';

interface DealTypeSelectorProps {
  onSelectDealType: (dealType: 'capital' | 'sell' | 'crowdfunding') => void;
}

const DealTypeSelector: React.FC<DealTypeSelectorProps> = ({ onSelectDealType }) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Create Your <span className="text-primary-600">Deal</span>
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
        Choose the type of deal you want to create
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <Card 
          className="bg-white border-gray-200 hover:border-primary-600 transition-colors cursor-pointer" 
          onClick={() => onSelectDealType('capital')}
        >
          <CardHeader className="text-center">
            <TrendingUp className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <CardTitle className="text-gray-900">Capital Raising</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center">
              Raise capital for your business growth and expansion
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-gray-200 hover:border-primary-600 transition-colors cursor-pointer" 
          onClick={() => onSelectDealType('sell')}
        >
          <CardHeader className="text-center">
            <Building className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <CardTitle className="text-gray-900">Sell</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center">
              Sell your company or a percentage of your business
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-gray-200 hover:border-primary-600 transition-colors cursor-pointer" 
          onClick={() => onSelectDealType('crowdfunding')}
        >
          <CardHeader className="text-center">
            <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <CardTitle className="text-gray-900">Crowdfunding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center">
              Launch a crowdfunding campaign for your project
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealTypeSelector;
