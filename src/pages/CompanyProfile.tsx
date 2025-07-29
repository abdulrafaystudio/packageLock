
import React from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useDeal } from '@/hooks/useDeals';
import { useAuth } from '@/hooks/useAuth';
import CompanyProfileHeader from '@/components/company-profile/CompanyProfileHeader';
import CompanyProfileContent from '@/components/company-profile/CompanyProfileContent';
import CompanyProfileLoading from '@/components/company-profile/CompanyProfileLoading';
import CompanyProfileError from '@/components/company-profile/CompanyProfileError';
import CompanyProfileUnauthenticated from '@/components/company-profile/CompanyProfileUnauthenticated';

const CompanyProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: deal, isLoading, error } = useDeal(id || '');

  // If user is not authenticated, show the unauthenticated component
  if (!user) {
    return <CompanyProfileUnauthenticated />;
  }

  if (isLoading) {
    return <CompanyProfileLoading />;
  }

  if (error || !deal) {
    return <CompanyProfileError />;
  }

  // Helper function to format location display
  const formatLocationDisplay = (location: string) => {
    const usStates = [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
      'Wisconsin', 'Wyoming'
    ];
    
    if (usStates.includes(location)) {
      return `${location}, USA`;
    }
    return location;
  };

  // Create a formatted deal object for components
  const formattedDeal = {
    ...deal,
    location: formatLocationDisplay(deal.location)
  };

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button and share */}
          <CompanyProfileHeader deal={deal} />

          {/* Main content */}
          <CompanyProfileContent 
            deal={deal}
            formattedDeal={formattedDeal}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyProfile;
