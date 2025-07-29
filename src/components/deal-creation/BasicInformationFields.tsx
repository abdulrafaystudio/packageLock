
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';

interface BasicInformationFieldsProps {
  form: UseFormReturn<any>;
  dealType?: 'capital' | 'sell' | 'crowdfunding';
}

const BasicInformationFields: React.FC<BasicInformationFieldsProps> = ({ form, dealType }) => {
  const getWebsiteLabel = () => {
    if (dealType === 'crowdfunding') {
      return 'Website of the Crowdfunding Platform *';
    }
    return 'Website (optional)';
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <FormField 
          control={form.control} 
          name="companyName" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Company or Project Name (optional)</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white border-gray-300 text-gray-900" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />

        <FormField 
          control={form.control} 
          name="yearFounded" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Year Founded *</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="2020" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />
      </div>

      <FormField 
        control={form.control} 
        name="title" 
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900 block text-left w-full">Title *</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white border-gray-300 text-gray-900" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} 
      />

      <FormField 
        control={form.control} 
        name="description" 
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900 block text-left w-full">Description *</FormLabel>
            <FormControl>
              <Textarea {...field} className="bg-white border-gray-300 text-gray-900" rows={4} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} 
      />

      <FormField 
        control={form.control} 
        name="website" 
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900 block text-left w-full">{getWebsiteLabel()}</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="https://example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} 
      />
    </>
  );
};

export default BasicInformationFields;
