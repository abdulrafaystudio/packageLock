
import { useCallback } from 'react';
import { Deal } from '@/hooks/useDeals';
import { AllFormFields } from '../schemas/dealFormSchemas';

export const useDealFormData = () => {
  const getFormDefaultValues = useCallback((deal: Deal): AllFormFields => {
    console.log('[useDealFormData] Creating form values for deal:', deal.id);
    return {
      companyName: deal.company_name || '',
      title: deal.title || '',
      yearFounded: deal.year_founded?.toString() || '',
      location: deal.location || '',
      industry: deal.industry || '',
      customIndustry: deal.custom_industry || '',
      description: deal.description || '',
      website: deal.website || '',
      growthExpansions: deal.growth_expansions || '',
      patents: deal.patents || '',
      technologyAssets: deal.technology_assets || '',
      videoLink: deal.video_link || deal.video_links || '',
      fundingTarget: deal.funding_target?.toString() || '',
      companyValuation: deal.company_valuation?.toString() || '',
      reasonForInvesting: deal.reason_for_investing || '',
      askingPrice: deal.asking_price?.toString() || '',
      percentageForSale: deal.percentage_for_sale?.toString() || '',
      reasonForSelling: deal.reason_for_selling || '',
      grossRevenue: deal.gross_revenue?.toString() || '',
      ebitda: deal.ebitda?.toString() || '',
      cashFlow: deal.cash_flow?.toString() || ''
    };
  }, []);

  return { getFormDefaultValues };
};
