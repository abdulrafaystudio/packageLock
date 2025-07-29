
import { supabase } from '@/integrations/supabase/client';

export const getInvestorStats = async () => {
  try {
    const { data, error, count } = await supabase
      .from('investors')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return {
      totalInvestors: count || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting investor stats:', error);
    throw error;
  }
};

export const getInvestorByName = async (investorName: string) => {
  try {
    const { data, error } = await supabase
      .from('investors')
      .select('*')
      .eq('investor_name', investorName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error getting investor by name ${investorName}:`, error);
    throw error;
  }
};

export const saveInvestorsToDatabase = async (investors: any[]) => {
  try {
    console.log(`Attempting to save ${investors.length} investors to database`);
    
    const { data, error } = await supabase
      .from('investors')
      .insert(investors)
      .select();

    if (error) {
      console.error('Error saving investors:', error);
      throw error;
    }

    console.log(`Successfully saved ${data?.length || 0} investors`);
    return data;
  } catch (error) {
    console.error('Error in saveInvestorsToDatabase:', error);
    throw error;
  }
};
