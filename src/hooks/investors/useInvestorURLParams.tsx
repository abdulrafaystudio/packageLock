
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useInvestorURLParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL parameters
  const getInitialValues = () => ({
    searchTerm: searchParams.get('search') || '',
    selectedCountry: searchParams.get('country') || '',
    selectedInvestorType: searchParams.get('investorType') || '',
    selectedInvestmentType: searchParams.get('investmentType') || '',
    currentPage: parseInt(searchParams.get('page') || '1', 10),
  });

  // Update URL parameters when filters change
  const updateURLParams = (params: {
    searchTerm?: string;
    selectedCountry?: string;
    selectedInvestorType?: string;
    selectedInvestmentType?: string;
    currentPage?: number;
  }) => {
    const newParams = new URLSearchParams(searchParams);

    // Update or remove parameters based on values
    Object.entries(params).forEach(([key, value]) => {
      const paramKey = key === 'searchTerm' ? 'search' : 
                      key === 'selectedCountry' ? 'country' :
                      key === 'selectedInvestorType' ? 'investorType' :
                      key === 'selectedInvestmentType' ? 'investmentType' :
                      key === 'currentPage' ? 'page' : key;

      if (value && value !== '' && value !== 1) {
        newParams.set(paramKey, value.toString());
      } else {
        newParams.delete(paramKey);
      }
    });

    setSearchParams(newParams);
  };

  return {
    getInitialValues,
    updateURLParams,
    searchParams
  };
};
