
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactFormHeaderProps {
  investorName: string;
  onClose: () => void;
}

const ContactFormHeader: React.FC<ContactFormHeaderProps> = ({
  investorName,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Contact {investorName}
      </h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ContactFormHeader;
