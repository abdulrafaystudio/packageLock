
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInvestorCount = () => {
  return useQuery({
    queryKey: ['investors', 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('investors')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting investor count:', error);
        throw error;
      }

      return count || 0;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - count doesn't change often
  });
};
