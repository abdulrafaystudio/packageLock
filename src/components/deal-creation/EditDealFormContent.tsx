
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AllFormFields } from './schemas/dealFormSchemas';
import BasicInformationFields from './BasicInformationFields';
import LocationField from './LocationField';
import IndustryField from './IndustryField';
import DealSpecificFields from './DealSpecificFields';
import OptionalFields from './OptionalFields';

interface EditDealFormContentProps {
  form: UseFormReturn<AllFormFields>;
  dealType: 'capital' | 'sell' | 'crowdfunding';
  industries: string[];
  onSubmit: (values: AllFormFields) => void;
  isSubmitting: boolean;
  onBack: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
}

const EditDealFormContent: React.FC<EditDealFormContentProps> = ({
  form,
  dealType,
  industries,
  onSubmit,
  isSubmitting,
  onBack,
  onDelete,
  isDeleting,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen
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

        <div className="flex justify-between items-center pt-6">
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                type="button" 
                variant="destructive"
                disabled={isSubmitting || isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-black">Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-black">
                  This action cannot be undone. This will permanently delete your deal and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white text-black border border-black hover:bg-gray-100">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete my Deal'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack} 
              disabled={isSubmitting || isDeleting} 
              className="border-gray-300 text-slate-950 bg-slate-50 hover:bg-accent hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary-600 hover:bg-primary-700 text-white hover:text-white" 
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default EditDealFormContent;
