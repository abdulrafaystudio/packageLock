
import React from 'react';
import PersonalInformationCard from '@/components/profile/PersonalInformationCard';

interface PersonalInfo {
  fullName: string;
  email: string;
  companyName: string;
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
}

interface ProfilePersonalSectionProps {
  personalInfo: PersonalInfo;
  isEditing: boolean;
  onEditToggle: () => void;
  onInfoChange: (field: string, value: string) => void;
}

const ProfilePersonalSection: React.FC<ProfilePersonalSectionProps> = ({
  personalInfo,
  isEditing,
  onEditToggle,
  onInfoChange
}) => {
  return (
    <PersonalInformationCard
      personalInfo={personalInfo}
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onInfoChange={onInfoChange}
    />
  );
};

export default ProfilePersonalSection;
