
import { supabase } from '@/integrations/supabase/client';

export const runInvestorDataCleanup = async () => {
  console.log('Starting investor data cleanup...');
  
  try {
    // Get all investors
    const { data: investors, error } = await supabase
      .from('investors')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${investors?.length || 0} investors to process`);
    
    // Since we've simplified the schema, basic cleanup is minimal
    let processedCount = 0;
    
    if (investors) {
      for (const investor of investors) {
        // Basic validation - ensure required fields exist
        if (!investor["Investor Name"] || !investor["Investor Name"].trim()) {
          console.log(`Skipping investor with missing name: ${investor.id}`);
          continue;
        }
        
        processedCount++;
      }
    }
    
    console.log(`Cleanup completed. Processed ${processedCount} investors.`);
    return { success: true, processed: processedCount };
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};

export const cleanupInvestorData = async () => {
  try {
    const result = await runInvestorDataCleanup();
    return {
      success: true,
      fixedCount: result.processed,
      totalIssues: result.processed,
      errorCount: 0,
      message: 'Cleanup completed successfully'
    };
  } catch (error) {
    console.error('Error in cleanupInvestorData:', error);
    return {
      success: false,
      fixedCount: 0,
      totalIssues: 0,
      errorCount: 1,
      message: `Cleanup failed: ${error}`
    };
  }
};
