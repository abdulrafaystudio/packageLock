
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Deal {
  id: string;
  title: string;
  industry: string;
  description: string;
  location: string;
  deal_type: string;
  year_founded: number;
  user_id: string;
  company_name?: string;
  website?: string;
  funding_target?: number;
  asking_price?: number;
  company_valuation?: number;
  gross_revenue?: number;
  ebitda?: number;
  cash_flow?: number;
  created_at: string;
  percentage_for_sale?: number;
  reason_for_selling?: string;
  reason_for_investing?: string;
  growth_expansions?: string;
  custom_industry?: string;
  patents?: string;
  technology_assets?: string;
  video_link?: string;
  video_links?: string;
  status?: string;
}

export const useDeals = () => {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      console.log('Fetching deals from database...');
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
        throw error;
      }

      console.log('Deals fetched successfully:', data?.length || 0, 'deals found');
      
      // Always return an array, even if data is null or undefined
      return (data as Deal[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });
};

export const useDeal = (dealId: string) => {
  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      console.log('Fetching deal:', dealId);
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (error) {
        console.error('Error fetching deal:', error);
        throw error;
      }

      console.log('Deal fetched successfully:', data);
      return data as Deal;
    },
    enabled: !!dealId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });
};
