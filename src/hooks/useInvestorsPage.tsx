
import { useState, useEffect } from 'react';
import { useInvestors } from '@/hooks/useInvestors';
import { useInvestorFiltering } from '@/hooks/useInvestorFiltering';
import { useInvestorSearch } from '@/hooks/investors/useInvestorSearch';
import { useInvestorFilters } from '@/hooks/investors/useInvestorFilters';
import { useInvestorFilterOptions } from '@/hooks/investors/useInvestorFilterOptions';
import { useInvestorDebug } from '@/hooks/investors/useInvestorDebug';

export const useInvestorsPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Use separate hooks for different concerns
  const {
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    handleSearchSubmit
  } = useInvestorSearch();

  const {
    selectedCountry,
    setSelectedCountry,
    selectedInvestorType,
    setSelectedInvestorType,
    selectedInvestmentType,
    setSelectedInvestmentType,
    currentPage,
    setCurrentPage,
    handleCountryChange,
    handleInvestorTypeChange,
    handleInvestmentTypeChange,
    hasFilters
  } = useInvestorFilters();

  const {
    availableCountries,
    availableInvestorTypes,
    availableInvestmentTypes,
    allInvestorsData
  } = useInvestorFilterOptions();

  // Run data cleanup on component mount
  useEffect(() => {
    console.log('Investors page loaded, cleanup will run automatically');
  }, []);

  // Get filtered and paginated investors from server
  // FIX: Pass selectedInvestmentType as selectedIndustry parameter for proper mapping
  const {
    data: investorData,
    isLoading,
    error
  } = useInvestors({
    page: currentPage,
    pageSize: 48,
    searchTerm: activeSearchTerm,
    selectedCountry,
    selectedInvestorType,
    selectedIndustry: selectedInvestmentType // This ensures proper parameter flow
  });

  // Use debugging hook
  useInvestorDebug({
    investorData,
    selectedInvestorType,
    allInvestorsData,
    activeSearchTerm,
    selectedCountry,
    selectedInvestmentType,
    currentPage
  });

  // Apply client-side sorting
  const sortedInvestors = useInvestorFiltering({
    investors: investorData?.investors || [],
    searchTerm: activeSearchTerm,
    selectedCountry,
    selectedInvestorType,
    selectedIndustry: selectedInvestmentType
  });

  return {
    // State
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    selectedCountry,
    setSelectedCountry,
    selectedInvestorType,
    setSelectedInvestorType,
    selectedInvestmentType,
    setSelectedInvestmentType,
    viewMode,
    setViewMode,
    
    // Data
    investorData,
    sortedInvestors,
    isLoading,
    error,
    availableCountries,
    availableInvestorTypes,
    availableInvestmentTypes,
    hasFilters,
    
    // Functions
    handleSearchSubmit,
    handleCountryChange,
    handleInvestorTypeChange,
    handleInvestmentTypeChange
  };
};
