
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/useDeals';
import ContactFormFields from './contact-form/ContactFormFields';
import { useContactFormState } from './contact-form/useContactFormState';
import { useContactFormValidation } from './contact-form/useContactFormValidation';
import { useContactFormSubmission } from './contact-form/hooks/useContactFormSubmission';

interface ContactCompanyFormProps {
  deal: Deal;
}

const ContactCompanyForm = ({ deal }: ContactCompanyFormProps) => {
  const { toast } = useToast();
  const { formData, errors, handleInputChange, resetForm, setFormErrors } = useContactFormState();
  const { validateForm } = useContactFormValidation();
  const { submitForm, isSubmitting } = useContactFormSubmission(deal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const { isValid, errors: validationErrors } = validateForm(formData);
    if (!isValid) {
      setFormErrors(validationErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Submit form
    const success = await submitForm(formData);
    if (success) {
      resetForm();
    }
  };

  return (
    <Card className="w-full bg-white border-gray-200">
      <CardHeader className="bg-white">
        <CardTitle className="text-2xl font-bold text-gray-900">Contact Company</CardTitle>
      </CardHeader>
      <CardContent className="bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <ContactFormFields
            formData={formData}
            errors={errors}
            onFieldChange={handleInputChange}
          />
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white"
          >
            {isSubmitting ? 'Sending Message...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactCompanyForm;
