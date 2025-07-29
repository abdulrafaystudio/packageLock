
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const { user } = useAuth();

  const { data: isAdmin = false } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      try {
        const { data, error } = await supabase.rpc('is_admin_user');
        
        if (error) {
          console.error('Admin check failed:', error);
          return false;
        }
        
        return data === true;
      } catch (error) {
        console.error('Admin check error:', error);
        return false;
      }
    },
    enabled: !!user?.id,
  });

  return isAdmin;
};
