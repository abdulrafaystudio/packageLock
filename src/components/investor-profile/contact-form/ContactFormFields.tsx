
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

interface ContactFormFieldsProps {
  formData: ContactFormData;
  errors?: ContactFormErrors;
  onFieldChange: (field: keyof ContactFormData, value: string) => void;
  isSubmitting?: boolean;
}

const ContactFormFields = ({ 
  formData, 
  errors = {}, 
  onFieldChange, 
  isSubmitting = false 
}: ContactFormFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Your full name *"
          value={formData.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          className={cn(
            "w-full",
            errors.name && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={isSubmitting}
          required
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Your email *"
          value={formData.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
          className={cn(
            "w-full",
            errors.email && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={isSubmitting}
          required
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Input
          type="tel"
          placeholder="Your phone number"
          value={formData.phone}
          onChange={(e) => onFieldChange('phone', e.target.value)}
          className={cn(
            "w-full",
            errors.phone && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Textarea
          placeholder="Your message *"
          rows={4}
          value={formData.message}
          onChange={(e) => onFieldChange('message', e.target.value)}
          className={cn(
            "w-full resize-none",
            errors.message && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={isSubmitting}
          required
        />
        <div className="flex justify-between text-sm">
          {errors.message && (
            <p className="text-red-600">{errors.message}</p>
          )}
          <div className={cn(
            "text-gray-500 ml-auto",
            formData.message.length > 800 && "text-red-600"
          )}>
            {formData.message.length} / 800
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactFormFields;
