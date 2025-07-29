
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSchemaForDealType, AllFormFields } from './schemas/dealFormSchemas';
import { getDealTypeTitle } from './utils/dealFormUtils';
import { useEditDealSubmission } from './hooks/useEditDealSubmission';
import { useDealIndustries } from './hooks/useDealIndustries';
import { useDealDeletion } from './hooks/useDealDeletion';
import { useDealFormData } from './hooks/useDealFormData';
import { Deal } from '@/hooks/useDeals';
import EditDealFormContent from './EditDealFormContent';

interface EditDealFormProps {
  dealType: 'capital' | 'sell' | 'crowdfunding';
  deal: Deal;
  onBack: () => void;
}

const EditDealForm: React.FC<EditDealFormProps> = ({ dealType, deal, onBack }) => {
  const industries = useDealIndustries();
  const { onSubmit, isSubmitting } = useEditDealSubmission(dealType, deal.id);
  const { deleteDeal, isDeleting } = useDealDeletion();
  const { getFormDefaultValues } = useDealFormData();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<AllFormFields>({
    resolver: zodResolver(getSchemaForDealType(dealType)),
    defaultValues: getFormDefaultValues(deal)
  });

  useEffect(() => {
    if (deal && deal.id) {
      console.log('[EditDealForm] Resetting form for deal:', deal.id);
      const defaultValues = getFormDefaultValues(deal);
      form.reset(defaultValues);
    }
  }, [deal?.id, form.reset, getFormDefaultValues]); // Fixed dependency array

  const handleDeleteDeal = async () => {
    await deleteDeal(deal.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Edit {getDealTypeTitle(dealType)}
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
          <EditDealFormContent
            form={form}
            dealType={dealType}
            industries={industries}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            onBack={onBack}
            onDelete={handleDeleteDeal}
            isDeleting={isDeleting}
            isDeleteDialogOpen={isDeleteDialogOpen}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditDealForm;
