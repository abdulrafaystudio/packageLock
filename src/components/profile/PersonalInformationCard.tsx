
import React from 'react';
import { Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PersonalInfoFields from './PersonalInfoFields';
import PasswordChangeSection from './PasswordChangeSection';

interface PersonalInfo {
  fullName: string;
  email: string;
  companyName: string;
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
}

interface PersonalInformationCardProps {
  personalInfo: PersonalInfo;
  isEditing: boolean;
  onEditToggle: () => void;
  onInfoChange: (field: string, value: string) => void;
}

const PersonalInformationCard: React.FC<PersonalInformationCardProps> = ({
  personalInfo,
  isEditing,
  onEditToggle,
  onInfoChange
}) => {
  return (
    <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white transition-colors duration-300">Personal Information</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEditToggle} 
          className="text-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-slate-300 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 hover:text-white transition-colors duration-300"
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <PersonalInfoFields
          personalInfo={personalInfo}
          isEditing={isEditing}
          onInfoChange={onInfoChange}
        />

        {/* Password Change Section - Only visible when editing */}
        {isEditing && <PasswordChangeSection />}
      </CardContent>
    </Card>
  );
};

export default PersonalInformationCard;
