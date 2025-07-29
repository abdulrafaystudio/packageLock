
import React, { useState, useEffect } from 'react';
import InvestorAuthDialog from '@/components/investors/InvestorAuthDialog';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/profile/ProfileProviderV3';
import { useProfilePermissions } from '@/hooks/profile/ProfilePermissionsProvider';

interface InvestorsAuthWrapperProps {
  children: React.ReactNode;
}

const InvestorsAuthWrapper = ({ children }: InvestorsAuthWrapperProps) => {
  const { userProfile, loading } = useProfile();
  const { permissions } = useProfilePermissions();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Check authentication and permissions when component mounts
  useEffect(() => {
    if (!loading) {
      // If no user profile, show auth dialog
      if (!userProfile) {
        setShowAuthDialog(true);
        return;
      }

      // Use permissions from usePermissions to check investor access
      const hasInvestorAccess = permissions?.canAccessInvestors || false;
      
      setShowAuthDialog(!hasInvestorAccess);
    }
  }, [userProfile, loading, permissions]);

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Use permissions from usePermissions to check investor access
  const hasInvestorAccess = permissions?.canAccessInvestors || false;
  
  if (userProfile && hasInvestorAccess) {
    return <>{children}</>;
  }

  return (
    <>
      <InvestorAuthDialog 
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />
      {/* Show children only if user has full access, otherwise show dialog */}
      {userProfile && hasInvestorAccess ? children : null}
    </>
  );
};

export default InvestorsAuthWrapper;
