
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AllFormFields } from '../schemas/dealFormSchemas';
import { parseNumber } from '../utils/dealFormUtils';

export const useEditDealSubmission = (dealType: 'capital' | 'sell' | 'crowdfunding', dealId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const onSubmit = async (values: AllFormFields) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to edit your deal.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine original videoLink with new videoLinks array
      const allVideoLinks = [];
      if (values.videoLink) allVideoLinks.push(values.videoLink);
      if (values.videoLinks) {
        const filteredVideoLinks = values.videoLinks.filter(link => link.trim() !== '');
        allVideoLinks.push(...filteredVideoLinks);
      }

      const dealData = {
        deal_type: dealType,
        company_name: values.companyName || null,
        title: values.title,
        year_founded: parseInt(values.yearFounded),
        location: values.location,
        industry: values.industry === 'Other' ? values.customIndustry! : values.industry,
        custom_industry: values.industry === 'Other' ? values.customIndustry : null,
        description: values.description,
        website: values.website || null,
        growth_expansions: values.growthExpansions || null,
        patents: values.patents || null,
        technology_assets: values.technologyAssets || null,
        video_link: allVideoLinks.length > 0 ? allVideoLinks[0] : null,
        video_links: allVideoLinks.length > 0 ? JSON.stringify(allVideoLinks) : null,
        funding_target: parseNumber(values.fundingTarget),
        company_valuation: parseNumber(values.companyValuation),
        reason_for_investing: values.reasonForInvesting || null,
        asking_price: parseNumber(values.askingPrice),
        percentage_for_sale: parseNumber(values.percentageForSale),
        reason_for_selling: values.reasonForSelling || null,
        gross_revenue: parseNumber(values.grossRevenue),
        ebitda: parseNumber(values.ebitda),
        cash_flow: parseNumber(values.cashFlow),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', dealId)
        .eq('user_id', user.id); // Ensure user can only edit their own deals

      if (error) {
        console.error('Error updating deal:', error);
        throw error;
      }

      // Invalidate React Query caches to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['deal', dealId] }),
        queryClient.invalidateQueries({ queryKey: ['userDeals', user.id] })
      ]);

      toast({
        title: "Deal Updated Successfully!",
        description: "Your deal has been updated and the changes are now live."
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error Updating Deal",
        description: "There was an error updating your deal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting };
};
