
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContactedInvestorsCard from '@/components/profile/ContactedInvestorsCard';
import { useContactedInvestors } from '@/hooks/useContactedInvestors';
import { useProfile } from '@/hooks/profile/ProfileProviderV3';

interface ProfileInvestorsSectionProps {
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
}

const ProfileInvestorsSection: React.FC<ProfileInvestorsSectionProps> = ({
  packageType
}) => {
  const navigate = useNavigate();
  const { contactedInvestors, loading } = useContactedInvestors();
  const { permissions } = useProfile();

  const handleInvestorClick = (investorId: string) => {
    // Check if user has access to investors (premium or higher)
    const hasInvestorAccess = permissions.canAccessInvestors;
    
    if (hasInvestorAccess) {
      // Redirect to specific investor profile page
      navigate(`/investor/${investorId}`);
    } else {
      // Redirect to investors page (where they'll see upgrade prompt)
      navigate('/investors');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <ContactedInvestorsCard
      contactedInvestors={contactedInvestors}
      onInvestorClick={handleInvestorClick}
      formatDate={formatDate}
      packageType={packageType}
      loading={loading}
    />
  );
};

export default ProfileInvestorsSection;
