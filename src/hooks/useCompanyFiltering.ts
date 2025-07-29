
import { useMemo } from 'react';
import { isDealUSABased } from '@/utils/dealFormatting';

interface Company {
  id: number;
  dealId?: string;
  title: string;
  industry: string;
  description: string;
  raising: string;
  location: string;
  categoryType: string;
  sector: string;
  dealType: string;
  country: string;
  yearFounded: number;
  grossRevenue: number;
  ebitda: number;
  cashFlow: number;
  employees: number;
  reasonForSelling?: string;
  growthExpansion: string;
  fundingGoal?: number;
  minimumInvestment?: number;
  companyValuation?: number;
  useOfFunds?: string;
  status?: string;
}

interface FilterParams {
  companies: Company[];
  searchTerm: string;
  selectedCountry: string;
  selectedState: string;
  selectedIndustry: string;
  dealType: string;
}

export const useCompanyFiltering = ({
  companies,
  searchTerm,
  selectedCountry,
  selectedState,
  selectedIndustry,
  dealType
}: FilterParams) => {
  return useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = searchTerm === '' || 
        company.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesLocation = true;
      if (selectedCountry !== '') {
        if (selectedCountry === 'United States of America') {
          // For USA, check if it's a US state, "United States of America", or the location contains USA
          matchesLocation = isDealUSABased(company.country) || 
                           isDealUSABased(company.location) ||
                           company.country === 'United States of America' ||
                           company.location.includes('USA') ||
                           company.location.includes('United States') ||
                           company.location.endsWith(', USA'); // Add check for formatted USA locations
          
          // If a specific state is selected, filter by that state
          if (selectedState !== '') {
            matchesLocation = matchesLocation && (
              company.country === selectedState || 
              company.location.includes(selectedState) ||
              company.location.startsWith(selectedState + ',') || // Match "State, USA" format
              company.location === selectedState // Exact state match
            );
          }
        } else {
          // For non-USA countries, match exactly and exclude USA states
          matchesLocation = company.country === selectedCountry && !isDealUSABased(company.country);
        }
      }
      
      const matchesIndustry = selectedIndustry === '' || company.industry === selectedIndustry;
      const matchesDealType = dealType === '' || company.dealType === dealType;

      return matchesSearch && matchesLocation && matchesIndustry && matchesDealType;
    });
  }, [companies, searchTerm, selectedCountry, selectedState, selectedIndustry, dealType]);
};
