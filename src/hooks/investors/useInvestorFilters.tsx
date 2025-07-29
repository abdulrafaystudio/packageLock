
import { useState, useEffect } from 'react';
import { useInvestorURLParams } from './useInvestorURLParams';

export const useInvestorFilters = () => {
  const { getInitialValues, updateURLParams } = useInvestorURLParams();
  const initialValues = getInitialValues();

  const [selectedCountry, setSelectedCountry] = useState(initialValues.selectedCountry);
  const [selectedInvestorType, setSelectedInvestorType] = useState(initialValues.selectedInvestorType);
  const [selectedInvestmentType, setSelectedInvestmentType] = useState(initialValues.selectedInvestmentType);
  const [currentPage, setCurrentPage] = useState(initialValues.currentPage);

  const handleCountryChange = (country: string) => {
    console.log('Country filter changed to:', country);
    setSelectedCountry(country);
    setCurrentPage(1);
    updateURLParams({
      selectedCountry: country,
      selectedInvestorType,
      selectedInvestmentType,
      currentPage: 1
    });
  };

  const handleInvestorTypeChange = (type: string) => {
    console.log('=== INVESTOR TYPE FILTER CHANGE ===');
    console.log('Selected type:', type);
    setSelectedInvestorType(type);
    setCurrentPage(1);
    updateURLParams({
      selectedCountry,
      selectedInvestorType: type,
      selectedInvestmentType,
      currentPage: 1
    });
  };

  const handleInvestmentTypeChange = (type: string) => {
    console.log('Investment type filter changed to:', type);
    setSelectedInvestmentType(type);
    setCurrentPage(1);
    updateURLParams({
      selectedCountry,
      selectedInvestorType,
      selectedInvestmentType: type,
      currentPage: 1
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURLParams({
      selectedCountry,
      selectedInvestorType,
      selectedInvestmentType,
      currentPage: page
    });
  };

  // Reset page when filters change
  useEffect(() => {
    console.log('Filter changed, resetting to page 1');
    setCurrentPage(1);
  }, [selectedCountry, selectedInvestorType, selectedInvestmentType]);

  const hasFilters = selectedCountry !== '' || selectedInvestorType !== '' || selectedInvestmentType !== '';

  return {
    selectedCountry,
    setSelectedCountry,
    selectedInvestorType,
    setSelectedInvestorType,
    selectedInvestmentType,
    setSelectedInvestmentType,
    currentPage,
    setCurrentPage: handlePageChange,
    handleCountryChange,
    handleInvestorTypeChange,
    handleInvestmentTypeChange,
    hasFilters
  };
};
