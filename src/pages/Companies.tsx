
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import CompanyFilters from '@/components/companies/CompanyFilters';
import CompanyGrid from '@/components/companies/CompanyGrid';
import CompanyDetailsDialog from '@/components/companies/CompanyDetailsDialog';
import { countries } from '@/data/mockData';
import { useDeals } from '@/hooks/useDeals';
import { extractIndustriesFromDeals } from '@/utils/dealIndustryExtraction';
import { useDealsTransformation } from '@/hooks/useDealsTransformation';
import { useCompanyFiltering } from '@/hooks/useCompanyFiltering';
import { useAuth } from '@/hooks/useAuth';
import { PREDEFINED_INDUSTRIES } from '@/data/industries';

const Companies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [dealType, setDealType] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { data: deals = [], isLoading, error, isFetching } = useDeals();

  // Transform deals to company format
  const convertedCompanies = useDealsTransformation(deals);

  // Create comprehensive industries list using predefined industries + deals data only
  const availableIndustries = useMemo(() => {
    // Start with predefined industries
    const industriesSet = new Set(PREDEFINED_INDUSTRIES);
    
    // Add any additional industries from deals only
    const dealIndustries = extractIndustriesFromDeals(deals);
    
    // Add any custom industries that aren't already in the predefined list
    dealIndustries.forEach(industry => {
      if (industry && industry.trim() && !industriesSet.has(industry)) {
        industriesSet.add(industry);
      }
    });
    
    // Convert to array and sort, ensuring "Other" is at the end
    const allIndustries = Array.from(industriesSet);
    const otherIndex = allIndustries.indexOf('Other');
    if (otherIndex > -1) {
      allIndustries.splice(otherIndex, 1);
      allIndustries.sort();
      allIndustries.push('Other');
    } else {
      allIndustries.sort();
    }
    
    return allIndustries;
  }, [deals]);

  // Filter companies based on search criteria
  const filteredCompanies = useCompanyFiltering({
    companies: convertedCompanies,
    searchTerm,
    selectedCountry,
    selectedState,
    selectedIndustry,
    dealType
  });

  const handleCompanyClick = (companyId: number, dealId?: string) => {
    // Use the actual deal ID if available, otherwise use the legacy company ID
    if (dealId) {
      navigate(`/company/${dealId}`);
    } else {
      navigate(`/company/${companyId}`);
    }
  };

  const handlePostDeal = () => {
    if (user) {
      navigate('/create-deal');
    } else {
      setShowAuthDialog(true);
    }
  };

  console.log('Companies page render:', { isLoading, isFetching, dealsLength: deals?.length, error });

  // Show loading only during initial load or when actively fetching
  if (isLoading || (isFetching && deals.length === 0)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Navigation />
        <main className="pt-20 pb-16 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300">Loading deals...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Log errors but don't block rendering
  if (error) {
    console.error('Error loading deals:', error);
  }

  // Determine if we have deals - this should only run after loading is complete
  const hasDeals = Array.isArray(deals) && deals.length > 0;

  console.log('Has deals check:', { hasDeals, dealsArray: Array.isArray(deals), dealsLength: deals?.length });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <CompanyDetailsDialog 
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Post Your Deal button */}
          <div className="text-center mb-12">
            <Button 
              size="lg" 
              className="rounded-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg mb-8"
              onClick={handlePostDeal}
            >
              Post Your Deal
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Companies Seeking <span className="text-primary-600">Investment</span>
            </h1>
          </div>

          {hasDeals ? (
            <>
              {/* Filters */}
              <CompanyFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                selectedIndustry={selectedIndustry}
                setSelectedIndustry={setSelectedIndustry}
                dealType={dealType}
                setDealType={setDealType}
                viewMode={viewMode}
                setViewMode={setViewMode}
                countries={countries}
                industries={availableIndustries}
              />

              {/* Companies Grid */}
              <CompanyGrid
                companies={filteredCompanies}
                viewMode={viewMode}
                onCompanyClick={handleCompanyClick}
              />

              {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-300">No deals found matching your criteria.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  No Companies Listed Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Be the first to showcase your company to potential investors. Post your deal and connect with our network of investors.
                </p>
                <Button 
                  size="lg" 
                  className="rounded-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-3"
                  onClick={handlePostDeal}
                >
                  Post the First Deal
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Companies;
