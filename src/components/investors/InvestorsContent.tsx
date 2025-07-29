
import React from 'react';
import InvestorFilters from '@/components/investors/InvestorFilters';
import InvestorList from '@/components/investors/InvestorList';
import InvestorPagination from '@/components/investors/InvestorPagination';
import { useInvestorsPage } from '@/hooks/useInvestorsPage';

const InvestorsContent = () => {
  const {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    selectedCountry,
    selectedInvestorType,
    selectedInvestmentType,
    viewMode,
    setViewMode,
    investorData,
    sortedInvestors,
    isLoading,
    error,
    availableCountries,
    availableInvestorTypes,
    availableInvestmentTypes,
    hasFilters,
    handleSearchSubmit,
    handleCountryChange,
    handleInvestorTypeChange,
    handleInvestmentTypeChange
  } = useInvestorsPage();

  // Handle type click from badge - this will set the investor type filter
  const handleTypeClickFromBadge = (type: string) => {
    console.log('Badge clicked for type:', type);
    handleInvestorTypeChange(type);
  };

  // Handle errors - specifically check for RLS/permission errors
  if (error) {
    const errorMessage = error.message || '';
    console.error('Investors content error:', error);
    
    // Check if it's a permission/RLS related error
    if (errorMessage.includes('row-level security') || 
        errorMessage.includes('permission denied') || 
        errorMessage.includes('access denied') ||
        errorMessage.includes('insufficient_privilege')) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Access Restricted
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need a Premium or PremiumPro package to access the investors database.
            </p>
            <button 
              onClick={() => window.location.href = '/pricing'} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      );
    }
    
    // For other errors, show generic error message
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Error: {errorMessage}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please try refreshing the page or contact support if the issue persists.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <InvestorFilters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onSearchSubmit={handleSearchSubmit} 
        selectedCountry={selectedCountry} 
        setSelectedCountry={handleCountryChange} 
        selectedInvestorType={selectedInvestorType}
        setSelectedInvestorType={handleInvestorTypeChange}
        selectedInvestmentType={selectedInvestmentType} 
        setSelectedInvestmentType={handleInvestmentTypeChange} 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        availableCountries={availableCountries} 
        availableInvestmentTypes={availableInvestmentTypes}
        availableInvestorTypes={availableInvestorTypes}
      />

      <InvestorList 
        investors={sortedInvestors} 
        viewMode={viewMode} 
        currentPage={investorData?.currentPage || 1} 
        totalPages={investorData?.totalPages || 1} 
        totalCount={investorData?.totalCount || 0} 
        allInvestorsCount={investorData?.totalCount || 0} 
        hasFilters={hasFilters}
        onTypeClick={handleTypeClickFromBadge}
      />

      {investorData && investorData.totalPages > 1 && (
        <InvestorPagination 
          currentPage={investorData.currentPage} 
          totalPages={investorData.totalPages} 
          onPageChange={setCurrentPage} 
        />
      )}
    </div>
  );
};

export default InvestorsContent;
