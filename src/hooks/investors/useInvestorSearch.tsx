
import { useState, useEffect } from 'react';
import { useInvestorURLParams } from './useInvestorURLParams';

export const useInvestorSearch = () => {
  const { getInitialValues, updateURLParams } = useInvestorURLParams();
  const initialValues = getInitialValues();

  const [searchTerm, setSearchTerm] = useState(initialValues.searchTerm);
  const [activeSearchTerm, setActiveSearchTerm] = useState(initialValues.searchTerm);

  const handleSearchSubmit = (term: string) => {
    console.log('Search submitted:', term);
    setActiveSearchTerm(term);
    updateURLParams({
      searchTerm: term
    });
  };

  // Update URL when search term changes
  useEffect(() => {
    updateURLParams({
      searchTerm: activeSearchTerm
    });
  }, [activeSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    handleSearchSubmit
  };
};
