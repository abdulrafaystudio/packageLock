
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { AllFormFields } from './schemas/dealFormSchemas';
import BasicInformationFields from './BasicInformationFields';
import LocationField from './LocationField';
import IndustryField from './IndustryField';
import DealSpecificFields from './DealSpecificFields';
import OptionalFields from './OptionalFields';

interface DealFormContentProps {
  form: UseFormReturn<AllFormFields>;
  dealType: 'capital' | 'sell' | 'crowdfunding';
  industries: string[];
  onSubmit: (values: AllFormFields) => void;
  isSubmitting: boolean;
  onBack: () => void;
}

const DealFormContent: React.FC<DealFormContentProps> = ({
  form,
  dealType,
  industries,
  onSubmit,
  isSubmitting,
  onBack
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BasicInformationFields form={form} dealType={dealType} />
        
        <div className="grid md:grid-cols-2 gap-6">
          <LocationField form={form} />
          <IndustryField form={form} industries={industries} />
        </div>

        <DealSpecificFields form={form} dealType={dealType} />
        
        <OptionalFields form={form} dealType={dealType} />

        <div className="flex justify-end space-x-4 pt-6">
          <button 
            type="button" 
            onClick={onBack} 
            disabled={isSubmitting} 
            className="border border-gray-300 text-slate-950 bg-slate-50 hover:bg-accent hover:text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="bg-primary-600 hover:bg-primary-700 text-white hover:text-white px-4 py-2 rounded" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Deal'}
          </button>
        </div>
      </form>
    </Form>
  );
};

export default DealFormContent;
