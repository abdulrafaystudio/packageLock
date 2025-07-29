import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ContactedInvestor {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_type: string | null;
  contact_date: string;
}

export const useContactedInvestors = () => {
  const { user } = useAuth();
  const [contactedInvestors, setContactedInvestors] = useState<ContactedInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactedInvestors = async () => {
    if (!user) {
      setContactedInvestors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacted_investors')
        .select('*')
        .eq('user_id', user.id)
        .order('contact_date', { ascending: false });

      if (error) {
        console.error('Error fetching contacted investors:', error);
        setError(error.message);
        return;
      }

      setContactedInvestors(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error in fetchContactedInvestors:', err);
      setError(err.message || 'Failed to fetch contacted investors');
    } finally {
      setLoading(false);
    }
  };

  const addContactedInvestor = async (investorId: string, investorName: string, investorType?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contacted_investors')
        .insert({
          user_id: user.id,
          investor_id: investorId,
          investor_name: investorName,
          investor_type: investorType || null,
          contact_date: new Date().toISOString()
        });

      if (error) {
        console.error('Error adding contacted investor:', error);
        return false;
      }

      // Refresh the list
      await fetchContactedInvestors();
      return true;
    } catch (err: any) {
      console.error('Error in addContactedInvestor:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchContactedInvestors();
  }, [user]);

  return {
    contactedInvestors,
    loading,
    error,
    addContactedInvestor,
    refetch: fetchContactedInvestors
  };
};