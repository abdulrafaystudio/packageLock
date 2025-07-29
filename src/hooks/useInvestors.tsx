import { useQuery } from '@tanstack/react-query';
import { buildInvestorQuery } from './investors/useInvestorQueryBuilder';
import { applyPagination, calculatePaginationMeta } from './investors/useInvestorPagination';
import type { UseInvestorsParams, UseInvestorsResult, Investor } from './investors/types';

// Re-export types for backward compatibility
export type { Investor, UseInvestorsParams, UseInvestorsResult };

export const useInvestors = ({ 
  page = 1, 
  pageSize = 48,
  searchTerm = '',
  selectedCountry = '',
  selectedInvestorType = '',
  selectedIndustry = '' // Keep this for backward compatibility but map it correctly
}: UseInvestorsParams = {}) => {
  return useQuery({
    queryKey: ['investors', 'paginated', page, pageSize, searchTerm, selectedCountry, selectedInvestorType, selectedIndustry],
    queryFn: async (): Promise<UseInvestorsResult> => {
      console.log('=== INVESTOR QUERY EXECUTION ===');
      console.log(`Page: ${page}, PageSize: ${pageSize}`);
      console.log(`Search: "${searchTerm}"`);
      console.log(`Country: "${selectedCountry}"`);
      console.log(`Investor Type: "${selectedInvestorType}"`);
      console.log(`Investment Type/Industry: "${selectedIndustry}"`);
      
      try {
        // Map selectedIndustry to selectedInvestmentType for proper parameter flow
        const queryParams = {
          searchTerm,
          selectedCountry,
          selectedInvestorType,
          selectedInvestmentType: selectedIndustry // This ensures the parameter maps correctly
        };
        
        console.log('Mapped query parameters:', queryParams);
        console.log('Actual database value to search for:', selectedIndustry);
        
        // Build query with filters
        let query = buildInvestorQuery(queryParams);

        // Apply pagination and ordering
        query = applyPagination(query, { page, pageSize });

        console.log('Executing Supabase query...');
        const { data, error, count } = await query;

        if (error) {
          console.error('=== SUPABASE QUERY ERROR ===');
          console.error('Error details:', error);
          console.error('Query parameters that caused error:', queryParams);
          
          if (selectedIndustry) {
            console.error('Investment type filter that failed:', selectedIndustry);
          }
          
          throw error;
        }

        const investors = data as Investor[];
        const totalCount = count || 0;
        const { totalPages, currentPage } = calculatePaginationMeta(totalCount, pageSize, page);
        
        console.log('=== QUERY RESULTS ===');
        console.log(`Found ${investors.length} investors on page ${page}`);
        console.log(`Total count: ${totalCount}, Total pages: ${totalPages}`);
        console.log(`Applied filters - Country: "${selectedCountry}", Type: "${selectedInvestorType}", Investment: "${selectedIndustry}"`);
        
        // Enhanced logging for investment type filtering
        if (selectedIndustry) {
          console.log('=== INVESTMENT TYPE FILTER RESULTS ===');
          console.log(`Filter value: "${selectedIndustry}"`);
          console.log(`Total results: ${totalCount}`);
          
          // Sample of results for debugging
          if (investors.length > 0) {
            console.log('Sample matching investors:');
            investors.slice(0, 3).forEach((inv, idx) => {
              console.log(`  ${idx + 1}. ${inv.investor_name}`);
              console.log(`    Preferred Investment Types: "${inv.preferred_investment_types}"`);
            });
          } else {
            console.log('No investors found for this investment type filter');
            console.log('This might indicate the selected value does not exist in the database');
          }
        }
        
        return {
          investors,
          totalCount,
          totalPages,
          currentPage,
        };
      } catch (error) {
        console.error('=== FAILED TO FETCH INVESTORS ===');
        console.error('Error:', error);
        console.error('Query parameters that caused error:', {
          searchTerm,
          selectedCountry,
          selectedInvestorType,
          selectedIndustry,
          page,
          pageSize
        });
        
        if (selectedIndustry) {
          console.error('Investment type filter that failed:', selectedIndustry);
        }
        
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Re-export the count hook for backward compatibility
export { useInvestorCount } from './investors/useInvestorCount';
