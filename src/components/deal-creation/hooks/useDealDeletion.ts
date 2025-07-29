
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDealDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const deleteDeal = async (dealId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete your deal.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId)
        .eq('user_id', user.id); // Ensure user can only delete their own deals

      if (error) {
        console.error('Error deleting deal:', error);
        throw error;
      }

      toast({
        title: "Deal Deleted Successfully",
        description: "Your deal has been permanently deleted."
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast({
        title: "Error Deleting Deal",
        description: "There was an error deleting your deal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteDeal, isDeleting };
};
