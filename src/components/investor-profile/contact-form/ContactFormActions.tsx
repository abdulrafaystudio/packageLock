
import React from 'react';
import { Button } from '@/components/ui/button';

interface ContactFormActionsProps {
  isSubmitting: boolean;
  hasContacts: boolean;
  onCancel: () => void;
}

const ContactFormActions: React.FC<ContactFormActionsProps> = ({
  isSubmitting,
  hasContacts,
  onCancel
}) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting}
        className="border-gray-300 text-slate-950 bg-slate-50 hover:bg-accent hover:text-white"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting || !hasContacts}
        className="bg-primary-600 hover:bg-primary-700 text-white hover:text-white"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </div>
  );
};

export default ContactFormActions;
