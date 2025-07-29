
import { useMemo } from 'react';
import { useInvestors } from '@/hooks/useInvestors';
import { extractCountriesFromInvestors } from '@/utils/countryNormalization';
import { extractInvestmentTypesFromInvestors } from '@/utils/investmentTypeExtraction';
import { DISPLAY_INVESTOR_TYPES, extractDisplayTypesFromInvestors } from '@/utils/investorTypeMapping';

export const useInvestorFilterOptions = () => {
  // Get all investors for filter options (without pagination)
  const {
    data: allInvestorsData,
    isLoading: isLoadingFilterOptions,
    error: filterOptionsError
  } = useInvestors({
    page: 1,
    pageSize: 10000
  });

  const availableCountries = useMemo(() => {
    try {
      if (!allInvestorsData) return [];
      
      const countries = extractCountriesFromInvestors(allInvestorsData.investors);
      console.log('Extracted countries for filter dropdown:', countries.slice(0, 10), '...');
      return countries;
    } catch (error) {
      console.error('Error extracting countries:', error);
      return [];
    }
  }, [allInvestorsData]);

  const availableInvestorTypes = useMemo(() => {
    try {
      if (!allInvestorsData) return DISPLAY_INVESTOR_TYPES;
      
      // Get the display types that actually exist in the data
      const existingDisplayTypes = extractDisplayTypesFromInvestors(allInvestorsData.investors);
      console.log('Available investor display types for dropdown:', existingDisplayTypes);
      
      // Return all 8 standard types in order
      return DISPLAY_INVESTOR_TYPES;
    } catch (error) {
      console.error('Error extracting investor types:', error);
      return DISPLAY_INVESTOR_TYPES;
    }
  }, [allInvestorsData]);

  const availableInvestmentTypes = useMemo(() => {
    try {
      if (!allInvestorsData) return ['Other'];
      
      // Extract investment types with "Other" as first option
      const allInvestmentTypes = extractInvestmentTypesFromInvestors(allInvestorsData.investors);
      console.log('Available investment types extracted from database:', allInvestmentTypes.slice(0, 10), '...');
      
      return allInvestmentTypes;
    } catch (error) {
      console.error('Error extracting investment types:', error);
      return ['Other'];
    }
  }, [allInvestorsData]);

  return {
    availableCountries,
    availableInvestorTypes,
    availableInvestmentTypes,
    allInvestorsData,
    isLoadingFilterOptions,
    filterOptionsError
  };
};
