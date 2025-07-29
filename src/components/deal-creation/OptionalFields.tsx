import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface OptionalFieldsProps {
  form: UseFormReturn<any>;
  dealType: 'capital' | 'sell' | 'crowdfunding';
}

const OptionalFields: React.FC<OptionalFieldsProps> = ({ form, dealType }) => {
  const [videoLinks, setVideoLinks] = useState<string[]>(['']);

  const addVideoLink = () => {
    const newVideoLinks = [...videoLinks, ''];
    setVideoLinks(newVideoLinks);
    form.setValue('videoLinks', newVideoLinks);
  };

  const removeVideoLink = (index: number) => {
    const newVideoLinks = videoLinks.filter((_, i) => i !== index);
    setVideoLinks(newVideoLinks);
    form.setValue('videoLinks', newVideoLinks);
  };

  const updateVideoLink = (index: number, value: string) => {
    const newVideoLinks = [...videoLinks];
    newVideoLinks[index] = value;
    setVideoLinks(newVideoLinks);
    form.setValue('videoLinks', newVideoLinks);
  };

  return (
    <>
      {/* Optional Financial Fields */}
      {(dealType === 'capital' || dealType === 'sell') && (
        <div className="grid md:grid-cols-3 gap-6">
          <FormField 
            control={form.control} 
            name="grossRevenue" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Gross Revenue (optional)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="1,000,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <FormField 
            control={form.control} 
            name="ebitda" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">EBITDA (optional)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="200,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />

          <FormField 
            control={form.control} 
            name="cashFlow" 
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 block text-left w-full">Cash Flow (optional)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border-gray-300 text-gray-900" placeholder="150,000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
        </div>
      )}

      {/* Optional Additional Fields */}
      <FormField 
        control={form.control} 
        name="growthExpansions" 
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900 block text-left w-full">Growth Expansions (optional)</FormLabel>
            <FormDescription className="text-gray-500">
              Describe potential opportunities for growth and expansion.
            </FormDescription>
            <FormControl>
              <Textarea {...field} className="bg-white border-gray-300 text-gray-900" rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} 
      />

      <div className="grid md:grid-cols-2 gap-6">
        <FormField 
          control={form.control} 
          name="patents" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Patents (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white border-gray-300 text-gray-900" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />

        <FormField 
          control={form.control} 
          name="technologyAssets" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 block text-left w-full">Technology Assets (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white border-gray-300 text-gray-900" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} 
        />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <FormLabel className="text-gray-900 text-lg font-medium">Add Video Links (optional)</FormLabel>
          <Button
            type="button"
            onClick={addVideoLink}
            className="bg-white border border-black text-black hover:bg-gray-50 hover:text-black flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Video
          </Button>
        </div>
        
        <div className="space-y-3">
          {videoLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-3">
              <Input
                value={link}
                onChange={(e) => updateVideoLink(index, e.target.value)}
                className="bg-white border-gray-300 text-gray-900 flex-1"
                placeholder="https://youtube.com/watch?v=... or upload video file"
              />
              {videoLinks.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeVideoLink(index)}
                  className="bg-white border border-black text-black hover:bg-gray-50 hover:text-black"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default OptionalFields;
