
import { useMemo } from 'react';
import { Investor } from '@/hooks/useInvestors';
import { normalizeCountryName } from '@/utils/countryNormalization';

interface UseInvestorFilteringParams {
  investors: Investor[];
  searchTerm?: string;
  selectedCountry?: string;
  selectedInvestorType?: string;
  selectedIndustry?: string;
}

// This hook is now mainly used for client-side sorting since filtering is done server-side
export const useInvestorFiltering = ({
  investors,
  searchTerm = '',
  selectedCountry = '',
  selectedInvestorType = '',
  selectedIndustry = '',
}: UseInvestorFilteringParams) => {
  return useMemo(() => {
    return investors.sort((a, b) => {
      // Helper function to check if investor is from United States
      const isFromUS = (investor: Investor): boolean => {
        const country = investor.country?.toLowerCase() || '';
        const geography = investor.preferred_geographical_areas?.toLowerCase() || '';
        
        // Check for various US identifiers
        const usIdentifiers = [
          'usa', 'united states', 'us,', ', us', ' us', 'u.s.', 'u.s.a',
          'united states of america', 'america'
        ];
        
        // Check country and geography
        const countryMatch = usIdentifiers.some(identifier => 
          country.includes(identifier) || 
          country.endsWith(' us') ||
          country === 'us'
        );
        
        const geographyMatch = usIdentifiers.some(identifier => 
          geography.includes(identifier) || 
          geography.endsWith(' us') ||
          geography === 'us'
        );
        
        return countryMatch || geographyMatch;
      };

      // Helper function to check if name starts with letter
      const startsWithLetter = (name: string): boolean => {
        return /^[a-zA-Z]/.test(name.trim());
      };

      const aFromUS = isFromUS(a);
      const bFromUS = isFromUS(b);
      const aStartsWithLetter = startsWithLetter(a.investor_name || '');
      const bStartsWithLetter = startsWithLetter(b.investor_name || '');

      // PRIORITY 1: US investors always come first
      if (aFromUS && !bFromUS) return -1;
      if (!aFromUS && bFromUS) return 1;

      // PRIORITY 2: Within same geography group, prioritize names starting with letters
      if (aStartsWithLetter && !bStartsWithLetter) return -1;
      if (!aStartsWithLetter && bStartsWithLetter) return 1;

      // PRIORITY 3: Sort alphabetically within the same group
      return (a.investor_name || '').localeCompare(b.investor_name || '');
    });
  }, [investors]);
};
