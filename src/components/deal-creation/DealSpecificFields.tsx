
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';

interface DealSpecificFieldsProps {
  form: UseFormReturn<any>;
  dealType: 'capital' | 'sell' | 'crowdfunding';
}

const DealSpecificFields: React.FC<DealSpecificFieldsProps> = ({ form, dealType }) => {
  if (dealType === 'capital') {
    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <FormField 
            control={form.control} 
            name="fundingTarget" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Funding Target *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="1,000,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <FormField 
            control={form.control} 
            name="companyValuation" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Company Valuation (optional)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="5,000,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>

        <FormField 
          control={form.control} 
          name="reasonForInvesting" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Reason for Investing *</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white border-gray-300 text-gray-900" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />
      </>
    );
  }

  if (dealType === 'sell') {
    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <FormField 
            control={form.control} 
            name="askingPrice" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Asking Price *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="2,000,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <FormField 
            control={form.control} 
            name="percentageForSale" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Percentage for Sale *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>

        <FormField 
          control={form.control} 
          name="reasonForSelling" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Reason for Selling *</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white border-gray-300 text-gray-900" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />
      </>
    );
  }

  if (dealType === 'crowdfunding') {
    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <FormField 
            control={form.control} 
            name="fundingTarget" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Funding Target *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="100,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <FormField 
            control={form.control} 
            name="companyValuation" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Company Valuation (optional)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="500,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>

        <FormField 
          control={form.control} 
          name="reasonForInvesting" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Reason for Investing *</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white border-gray-300 text-gray-900" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />
      </>
    );
  }

  return null;
};

export default DealSpecificFields;
