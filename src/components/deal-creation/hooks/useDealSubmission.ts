
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AllFormFields } from '../schemas/dealFormSchemas';
import { parseNumber } from '../utils/dealFormUtils';

export const useDealSubmission = (dealType: 'capital' | 'sell' | 'crowdfunding') => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const onSubmit = async (values: AllFormFields) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to publish your deal.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use only the first video link if multiple are provided
      let primaryVideoLink = null;
      if (values.videoLink) {
        primaryVideoLink = values.videoLink;
      } else if (values.videoLinks && values.videoLinks.length > 0) {
        const filteredVideoLinks = values.videoLinks.filter(link => link.trim() !== '');
        if (filteredVideoLinks.length > 0) {
          primaryVideoLink = filteredVideoLinks[0];
        }
      }

      const dealData = {
        user_id: user.id,
        deal_type: dealType!,
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
        video_link: primaryVideoLink,
        funding_target: parseNumber(values.fundingTarget),
        company_valuation: parseNumber(values.companyValuation),
        reason_for_investing: values.reasonForInvesting || null,
        asking_price: parseNumber(values.askingPrice),
        percentage_for_sale: parseNumber(values.percentageForSale),
        reason_for_selling: values.reasonForSelling || null,
        gross_revenue: parseNumber(values.grossRevenue),
        ebitda: parseNumber(values.ebitda),
        cash_flow: parseNumber(values.cashFlow)
      };

      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (error) {
        console.error('Error inserting deal:', error);
        throw error;
      }

      toast({
        title: "Deal Published Successfully!",
        description: "Your deal has been published and is now live on the platform."
      });

      navigate('/companies');
    } catch (error) {
      console.error('Error publishing deal:', error);
      toast({
        title: "Error Publishing Deal",
        description: "There was an error publishing your deal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting };
};
