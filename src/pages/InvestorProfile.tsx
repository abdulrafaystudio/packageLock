import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Investor } from '@/hooks/useInvestors';
import InvestorProfileHeader from '@/components/investor-profile/InvestorProfileHeader';
import InvestorProfileAbout from '@/components/investor-profile/InvestorProfileAbout';
import InvestorProfileVerticals from '@/components/investor-profile/InvestorProfileVerticals';
import InvestorProfileSectors from '@/components/investor-profile/InvestorProfileSectors';
import InvestorProfilePreferredInvestmentTypes from '@/components/investor-profile/InvestorProfilePreferredInvestmentTypes';
import InvestorProfileGeography from '@/components/investor-profile/InvestorProfileGeography';
import InvestorProfileInvestmentDetails from '@/components/investor-profile/InvestorProfileInvestmentDetails';
import InvestorProfileLocation from '@/components/investor-profile/InvestorProfileLocation';
import InvestorProfileContacts from '@/components/investor-profile/InvestorProfileContacts';
import InvestorProfileContactForm from '@/components/investor-profile/InvestorProfileContactForm';
import InvestorAuthDialog from '@/components/investors/InvestorAuthDialog';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/profile/ProfileProviderV3';

const InvestorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { permissions } = useProfile();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  // Get the return filters from URL parameters
  const returnFilters = searchParams.get('returnFilters');
  const backToInvestorsUrl = returnFilters ? `/investors?${returnFilters}` : '/investors';

  // Check authentication and permissions when auth loading is complete
  useEffect(() => {
    console.log('=== INVESTOR PROFILE AUTH STATE DEBUG ===');
    console.log('auth loading:', loading);
    console.log('user exists:', !!user);
    console.log('canAccessInvestors:', permissions.canAccessInvestors);
    
    if (!loading) {
      // Show dialog if user is not logged in OR doesn't have permissions
      const userNotLoggedIn = !user;
      const userLacksPermissions = user && !permissions.canAccessInvestors;
      const shouldShowDialog = userNotLoggedIn || userLacksPermissions;
      
      console.log('userNotLoggedIn:', userNotLoggedIn);
      console.log('userLacksPermissions:', userLacksPermissions);
      console.log('shouldShowDialog:', shouldShowDialog);
      
      setShowAuthDialog(shouldShowDialog);
    }
  }, [user, loading, permissions.canAccessInvestors]);

  const { data: investor, isLoading, error } = useQuery({
    queryKey: ['investor', id],
    queryFn: async () => {
      console.log('Fetching investor profile for ID:', id);
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching investor:', error);
        throw error;
      }

      console.log('Fetched investor:', data);
      return data as Investor;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Navigation />
        <InvestorAuthDialog 
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
        />
        <main className="pt-20 pb-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Loading investor profile...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Navigation />
        <InvestorAuthDialog 
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
        />
        <main className="pt-20 pb-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-red-600">Error loading investor profile</p>
              <Link to={backToInvestorsUrl}>
                <Button className="mt-4">Back to Investors</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <InvestorAuthDialog 
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />
      
      {showContactForm && investor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <InvestorProfileContactForm 
              investor={investor}
              onClose={() => setShowContactForm(false)}
            />
          </div>
        </div>
      )}
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back Button */}
          <Link to={backToInvestorsUrl} className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Investors
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <InvestorProfileHeader investor={investor} />
              <InvestorProfileAbout investor={investor} />
              <InvestorProfileVerticals investor={investor} />
              <InvestorProfileSectors investor={investor} />
              <InvestorProfilePreferredInvestmentTypes investor={investor} />
              <InvestorProfileGeography investor={investor} />
              <InvestorProfileInvestmentDetails investor={investor} />
            </div>

            {/* Right Column - Contact Info & Location */}
            <div className="space-y-6">
              <InvestorProfileLocation investor={investor} />
              <InvestorProfileContacts investor={investor} />
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contact This Investor
                </h3>
                <Button 
                  onClick={() => setShowContactForm(true)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InvestorProfile;
