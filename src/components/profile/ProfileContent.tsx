
import React from 'react';
import ProfilePersonalSection from '@/components/profile/ProfilePersonalSection';
import ProfileDealsSection from '@/components/profile/ProfileDealsSection';
import ProfileInvestorsSection from '@/components/profile/ProfileInvestorsSection';

interface PersonalInfo {
  fullName: string;
  email: string;
  companyName: string;
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
}

interface PublishedDeal {
  id: string;
  name: string;
  type: string;
  target?: string;
  price?: string;
  status: string;
  publishDate: string;
}

interface ProfileContentProps {
  personalInfo: PersonalInfo;
  isEditing: boolean;
  userDeals: PublishedDeal[];
  userDealsCount: number;
  onEditToggle: () => void;
  onInfoChange: (field: string, value: string) => void;
  onStatusChange?: (dealId: string, newStatus: string) => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  personalInfo,
  isEditing,
  userDeals,
  userDealsCount,
  onEditToggle,
  onInfoChange,
  onStatusChange
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ProfilePersonalSection
        personalInfo={personalInfo}
        isEditing={isEditing}
        onEditToggle={onEditToggle}
        onInfoChange={onInfoChange}
      />

      <ProfileDealsSection
        userDeals={userDeals}
        userDealsCount={userDealsCount}
        onStatusChange={onStatusChange}
      />

      <ProfileInvestorsSection
        packageType={personalInfo.packageType}
      />
    </div>
  );
};

export default ProfileContent;
