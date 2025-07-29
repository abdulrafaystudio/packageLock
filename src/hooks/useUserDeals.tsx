
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserDeals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's deals count
  const { data: userDealsCount = 0 } = useQuery({
    queryKey: ['userDealsCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching deals count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch user's actual deals
  const { data: userDeals = [] } = useQuery({
    queryKey: ['userDeals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user deals:', error);
        return [];
      }
      
      return data.map(deal => ({
        id: deal.id,
        name: deal.title,
        type: deal.deal_type,
        target: deal.funding_target ? `$${deal.funding_target.toLocaleString()}` : undefined,
        price: deal.asking_price ? `$${deal.asking_price.toLocaleString()}` : undefined,
        status: deal.status || 'Active', // Default to Active if no status is set
        publishDate: new Date(deal.created_at).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
      }));
    },
    enabled: !!user?.id,
  });

  // Mutation to update deal status
  const updateDealStatusMutation = useMutation({
    mutationFn: async ({ dealId, status }: { dealId: string; status: string }) => {
      const { error } = await supabase
        .from('deals')
        .update({ status })
        .eq('id', dealId)
        .eq('user_id', user?.id); // Ensure user can only update their own deals

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch user deals
      queryClient.invalidateQueries({ queryKey: ['userDeals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] }); // Also invalidate general deals query
      
      toast({
        title: "Deal status updated",
        description: "Your deal status has been successfully updated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating deal status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateDealStatus = (dealId: string, status: string) => {
    updateDealStatusMutation.mutate({ dealId, status });
  };

  return {
    userDeals,
    userDealsCount,
    updateDealStatus,
    isUpdatingStatus: updateDealStatusMutation.isPending
  };
};
