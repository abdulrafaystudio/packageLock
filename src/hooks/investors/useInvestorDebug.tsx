import { useEffect } from 'react';
import type { Investor } from '@/hooks/investors/types';
import { mapInvestorTypeToDisplay, DISPLAY_INVESTOR_TYPES } from '@/utils/investorTypeMapping';

interface UseInvestorDebugParams {
  investorData?: {
    investors?: Investor[];
    totalCount?: number;
  };
  selectedInvestorType: string;
  allInvestorsData?: {
    investors: Investor[];
  };
  activeSearchTerm: string;
  selectedCountry: string;
  selectedInvestmentType: string;
  currentPage: number;
}

export const useInvestorDebug = ({
  investorData,
  selectedInvestorType,
  allInvestorsData,
  activeSearchTerm,
  selectedCountry,
  selectedInvestmentType,
  currentPage
}: UseInvestorDebugParams) => {
  // Enhanced debugging for filter results
  useEffect(() => {
    if (investorData && selectedInvestorType) {
      console.log(`\n=== DETAILED FILTER ANALYSIS for "${selectedInvestorType}" ===`);
      console.log(`Query returned ${investorData.investors?.length || 0} investors`);
      console.log(`Total count from database: ${investorData.totalCount || 0}`);
      
      if (investorData.investors && investorData.investors.length > 0) {
        console.log('Sample matching investors with their Type values:');
        investorData.investors.slice(0, 10).forEach((investor, index) => {
          const dbType = investor.type;
          const displayType = mapInvestorTypeToDisplay(dbType);
          console.log(`${index + 1}. "${investor.investor_name}" - DB Type: "${dbType}" - Display Type: "${displayType}"`);
        });
      } else {
        console.log('❌ NO INVESTORS FOUND!');
        console.log('This suggests the database query is not matching any records.');
      }
      console.log('=== END DETAILED ANALYSIS ===\n');
    }
  }, [investorData, selectedInvestorType]);

  // Enhanced type analysis for debugging
  useEffect(() => {
    if (allInvestorsData?.investors) {
      console.log('\n=== COMPREHENSIVE DATABASE TYPE ANALYSIS WITH MAPPING ===');
      
      // Get all unique Type field values
      const allTypeValues = new Set<string>();
      const typeDistribution: { [key: string]: number } = {};
      const displayTypeDistribution: { [key: string]: number } = {};
      
      allInvestorsData.investors.forEach(investor => {
        if (investor.type) {
          allTypeValues.add(investor.type);
          
          // Count individual types (after splitting by comma)
          const individualTypes = investor.type.split(',').map(t => t.trim());
          individualTypes.forEach(type => {
            if (type) {
              typeDistribution[type] = (typeDistribution[type] || 0) + 1;
              
              // Also count display types
              const displayType = mapInvestorTypeToDisplay(type);
              displayTypeDistribution[displayType] = (displayTypeDistribution[displayType] || 0) + 1;
            }
          });
        }
      });
      
      console.log(`Total investors in database: ${allInvestorsData.investors.length}`);
      console.log(`Unique Type field values: ${allTypeValues.size}`);
      
      console.log('\nDisplay type distribution (after mapping):');
      DISPLAY_INVESTOR_TYPES.forEach(displayType => {
        const count = displayTypeDistribution[displayType] || 0;
        console.log(`"${displayType}": ${count} investors`);
      });
      
      console.log('\nTop 20 database type distribution (individual types after comma split):');
      Object.entries(typeDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .forEach(([type, count]) => {
          const displayType = mapInvestorTypeToDisplay(type);
          console.log(`"${type}" → "${displayType}": ${count} investors`);
        });
      
      console.log('=== END COMPREHENSIVE ANALYSIS ===\n');
    }
  }, [allInvestorsData]);

  // Log current filters
  useEffect(() => {
    console.log('useInvestorsPage - Current filters:', {
      activeSearchTerm,
      selectedCountry,
      selectedInvestorType,
      selectedInvestmentType,
      currentPage
    });
  }, [activeSearchTerm, selectedCountry, selectedInvestorType, selectedInvestmentType, currentPage]);

  // Log investor data
  useEffect(() => {
    console.log('useInvestorsPage - Investor data:', investorData);
  }, [investorData]);
};
