import { supabase } from '@/integrations/supabase/client';
import { mapDisplayTypeToDbValues } from '@/utils/investorTypeMapping';
import { prepareInvestmentTypeForQuery } from '@/utils/investmentTypeMapping';

interface QueryBuilderParams {
  searchTerm?: string;
  selectedCountry?: string;
  selectedInvestorType?: string;
  selectedInvestmentType?: string;
}

export const buildInvestorQuery = ({ 
  searchTerm = '', 
  selectedCountry = '', 
  selectedInvestorType = '', 
  selectedInvestmentType = ''
}: QueryBuilderParams) => {
  console.log('=== BUILDING INVESTOR QUERY ===');
  console.log('Query parameters:', {
    searchTerm,
    selectedCountry,
    selectedInvestorType,
    selectedInvestmentType
  });

  try {
    let query = supabase
      .from('investors')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      console.log('Applying search filter for term:', term);
      
      query = query.or(`investor_name.ilike.%${term}%,description.ilike.%${term}%,verticals.ilike.%${term}%,sectors.ilike.%${term}%,preferred_investment_types.ilike.%${term}%,country.ilike.%${term}%,type.ilike.%${term}%`);
    }

    // Apply country filter
    if (selectedCountry && selectedCountry.trim()) {
      console.log('Applying country filter:', selectedCountry);
      query = query.ilike('country', `%${selectedCountry}%`);
    }

    // Apply investor type filter with proper mapping
    if (selectedInvestorType && selectedInvestorType.trim()) {
      console.log('Applying investor type filter:', selectedInvestorType);
      
      const dbValues = mapDisplayTypeToDbValues(selectedInvestorType);
      console.log('Mapped database values for investor type:', dbValues);
      
      if (dbValues.length > 0) {
        const typeConditions = dbValues.map(dbValue => `type.ilike.%${dbValue}%`).join(',');
        query = query.or(typeConditions);
      }
    }

    // Apply investment type filter using actual database values
    if (selectedInvestmentType && selectedInvestmentType.trim()) {
      console.log('=== APPLYING INVESTMENT TYPE FILTER ===');
      console.log('Investment type selected:', selectedInvestmentType);
      
      const queryValue = prepareInvestmentTypeForQuery(selectedInvestmentType);
      
      if (queryValue) {
        console.log('Querying for investment type containing:', queryValue);
        
        // Search in the "preferred_investment_types" column with case-insensitive partial matching
        // This handles comma-separated values by using ILIKE with wildcards
        query = query.ilike('preferred_investment_types', `%${queryValue}%`);
      }
    }

    console.log('=== QUERY BUILT SUCCESSFULLY ===');
    return query;
    
  } catch (error) {
    console.error('Error building investor query:', error);
    console.error('Failed with parameters:', {
      searchTerm,
      selectedCountry,
      selectedInvestorType,
      selectedInvestmentType
    });
    
    // Return basic query as fallback
    return supabase
      .from('investors')
      .select('*', { count: 'exact' });
  }
};
