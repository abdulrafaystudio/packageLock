
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/profile/ProfileProviderV3';
import { useUserDeals } from '@/hooks/useUserDeals';
import ProfileHeader from '@/components/profile/ProfileHeader';
import OptimizedProfileLoading from '@/components/profile/OptimizedProfileLoading';
import ProfileError from '@/components/profile/ProfileError';
import ProfileContent from '@/components/profile/ProfileContent';
import RealtimeStatusIndicator from '@/components/profile/RealtimeStatusIndicator';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    personalInfo, 
    isEditing, 
    loading, 
    profileError, 
    handlePersonalInfoChange, 
    handleEditToggle 
  } = useProfile();
  const { userDeals, userDealsCount, updateDealStatus } = useUserDeals();

  console.log('🔍 Profile page - User:', user?.email, 'Loading:', loading, 'ProfileError:', profileError);

  const handleStatusChange = (dealId: string, newStatus: string) => {
    updateDealStatus(dealId, newStatus);
  };

  const handleRetryProfile = () => {
    window.location.reload();
  };

  // Show error state if there's a profile error
  if (profileError && !loading) {
    return <ProfileError error={profileError} onRetry={handleRetryProfile} />;
  }

  // Show loading state
  if (loading) {
    return <OptimizedProfileLoading />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />

      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ProfileHeader />
          <ProfileContent
            personalInfo={personalInfo}
            isEditing={isEditing}
            userDeals={userDeals}
            userDealsCount={userDealsCount}
            onEditToggle={handleEditToggle}
            onInfoChange={handlePersonalInfoChange}
            onStatusChange={handleStatusChange}
          />
        </div>
      </main>
      
      <RealtimeStatusIndicator />
      <Footer />
    </div>
  );
};

const Profile = () => {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
};

export default Profile;
