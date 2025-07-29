
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDealTypeTitle } from './utils/dealFormUtils';
import { useDealFormState } from './hooks/useDealFormState';
import { useDealSubmission } from './hooks/useDealSubmission';
import { useDealIndustries } from './hooks/useDealIndustries';
import DealFormContent from './DealFormContent';

interface DealFormProps {
  dealType: 'capital' | 'sell' | 'crowdfunding';
  onBack: () => void;
}

const DealForm: React.FC<DealFormProps> = ({ dealType, onBack }) => {
  const { form } = useDealFormState(dealType);
  const industries = useDealIndustries();
  const { onSubmit, isSubmitting } = useDealSubmission(dealType);

  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        {getDealTypeTitle(dealType)}
      </h1>
      <Button 
        variant="outline" 
        onClick={onBack} 
        className="border-gray-300 bg-slate-50 text-slate-950 hover:bg-accent hover:text-white"
      >
        ← Back to Deal Types
      </Button>

      <Card className="bg-white border-gray-200 mt-8">
        <CardContent className="p-8">
          <DealFormContent
            form={form}
            dealType={dealType}
            industries={industries}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            onBack={onBack}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DealForm;
