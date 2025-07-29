
import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { formatIndustryForDisplay } from '@/utils/industryFormatting';

interface IndustryFieldProps {
  form: UseFormReturn<any>;
  industries: string[];
}

const IndustryField: React.FC<IndustryFieldProps> = ({ form, industries }) => {
  const currentIndustry = form.watch('industry');
  const currentCustomIndustry = form.watch('customIndustry');
  
  // Initialize showCustomIndustry based on current form values
  const [showCustomIndustry, setShowCustomIndustry] = useState(() => {
    return currentIndustry === 'Other' || !!currentCustomIndustry;
  });

  // Update showCustomIndustry when form values change
  useEffect(() => {
    setShowCustomIndustry(currentIndustry === 'Other' || !!currentCustomIndustry);
  }, [currentIndustry, currentCustomIndustry]);

  return (
    <>
      <FormField
        control={form.control}
        name="industry"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900 block text-left w-full">Industry *</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                setShowCustomIndustry(value === 'Other');
                // Clear custom industry if not "Other"
                if (value !== 'Other') {
                  form.setValue('customIndustry', '');
                }
              }}
              value={field.value}
              key={field.value} // Force re-render when value changes
            >
              <FormControl>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white border-gray-300 max-h-60 overflow-y-auto">
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry} className="text-gray-900">
                    {formatIndustryForDisplay(industry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {showCustomIndustry && (
        <FormField 
          control={form.control} 
          name="customIndustry" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Please specify your industry *</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="Enter your industry" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />
      )}
    </>
  );
};

export default IndustryField;
