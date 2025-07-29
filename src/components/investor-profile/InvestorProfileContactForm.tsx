
import React from 'react';
import { useInvestorContactFormState } from './contact-form/useInvestorContactFormState';
import { useInvestorContactFormValidation } from './contact-form/useInvestorContactFormValidation';
import { useContactFormSubmission } from './contact-form/useContactFormSubmission';
import { useEmailContacts } from './contact-form/useEmailContacts';
import { Investor } from '@/hooks/useInvestors';
import ContactFormHeader from './contact-form/ContactFormHeader';
import ContactFormFields from './contact-form/ContactFormFields';
import ContactFormActions from './contact-form/ContactFormActions';

interface InvestorProfileContactFormProps {
  investor: Investor;
  onClose: () => void;
}

const InvestorProfileContactForm: React.FC<InvestorProfileContactFormProps> = ({
  investor,
  onClose
}) => {
  const { formData, errors, handleInputChange, setFormErrors, resetForm } = useInvestorContactFormState(investor.id);
  const { validateForm } = useInvestorContactFormValidation();
  const { getEmailContacts } = useEmailContacts(investor);
  const { handleSubmit: submitForm, isSubmitting } = useContactFormSubmission(investor, getEmailContacts());

  const emailContacts = getEmailContacts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { isValid, errors: validationErrors } = validateForm(formData);
    
    if (!isValid) {
      setFormErrors(validationErrors);
      return;
    }

    if (emailContacts.length === 0) {
      setFormErrors({ email: 'No valid email contacts found for this investor' });
      return;
    }

    const success = await submitForm(formData, resetForm);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ContactFormHeader 
        investorName={investor.investor_name}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <ContactFormFields
          formData={formData}
          errors={errors}
          onFieldChange={handleInputChange}
          isSubmitting={isSubmitting}
        />

        <ContactFormActions
          isSubmitting={isSubmitting}
          hasContacts={emailContacts.length > 0}
          onCancel={onClose}
        />
      </form>
    </div>
  );
};

export default InvestorProfileContactForm;
