import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '@/hooks/useDeals';
import { useDealsTransformation } from '@/hooks/useDealsTransformation';
import CompanyCard from '@/components/companies/CompanyCard';

const CompanyShowcase = () => {
  const navigate = useNavigate();
  const [displayedCompanies, setDisplayedCompanies] = useState<any[]>([]);

  // Fetch real companies from the database
  const { data: deals = [], isLoading, error } = useDeals();
  const companies = useDealsTransformation(deals);

  // Function to get 4 random companies
  const getRandomCompanies = (companiesArray: any[]) => {
    if (companiesArray.length <= 4) return companiesArray;
    
    const shuffled = [...companiesArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  useEffect(() => {
    if (companies.length > 0) {
      // Set initial random companies
      setDisplayedCompanies(getRandomCompanies(companies));
      
      // Switch to new random companies every 5 seconds
      const interval = setInterval(() => {
        setDisplayedCompanies(getRandomCompanies(companies));
      }, 5000); // Change every 5 seconds

      return () => clearInterval(interval);
    }
  }, [companies]);

  const handleCompanyClick = (companyId: number, dealId?: string) => {
    // Use the actual deal ID if available, otherwise use the legacy company ID
    if (dealId) {
      navigate(`/company/${dealId}`);
    } else {
      navigate(`/company/${companyId}`);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-20 px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Featured <span className="text-primary-600">Companies</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
              Discover innovative companies seeking investment opportunities
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="py-20 px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Featured <span className="text-primary-600">Companies</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
              Unable to load companies at this time
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Show message if no companies
  if (companies.length === 0) {
    return (
      <section className="py-20 px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Featured <span className="text-primary-600">Companies</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
              No companies available at this time
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            Featured <span className="text-primary-600">Companies</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            Discover innovative companies seeking investment opportunities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedCompanies.map((company, index) => (
            <CompanyCard
              key={`${company.dealId || company.id}-${Date.now()}-${index}`}
              company={company}
              onClick={handleCompanyClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyShowcase;
