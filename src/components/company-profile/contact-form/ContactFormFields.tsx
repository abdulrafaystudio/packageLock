
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactFormFieldsProps {
  formData: ContactFormData;
  errors: Partial<ContactFormData>;
  onFieldChange: (field: keyof ContactFormData, value: string) => void;
}

const ContactFormFields = ({ formData, errors, onFieldChange }: ContactFormFieldsProps) => {
  return (
    <>
      {/* Row with name, email, and phone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            type="text"
            placeholder="Your full name *"
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className={`w-full ${errors.name ? 'border-red-500' : ''}`}
            required
            maxLength={100}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <Input
            type="email"
            placeholder="Your email *"
            value={formData.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className={`w-full ${errors.email ? 'border-red-500' : ''}`}
            required
            maxLength={254}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <Input
            type="tel"
            placeholder="Your phone number"
            value={formData.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
            maxLength={20}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
      </div>
      {/* Message box */}
      <div>
        <Textarea
          placeholder="Your message *"
          rows={8}
          value={formData.message}
          onChange={(e) => onFieldChange('message', e.target.value)}
          className={`w-full resize-none ${errors.message ? 'border-red-500' : ''}`}
          required
          maxLength={800}
        />
        <div className="flex justify-between items-center mt-1">
          <div>
            {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
          </div>
          <div className="text-right text-sm text-gray-500">
            {formData.message.length} / 800
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactFormFields;
