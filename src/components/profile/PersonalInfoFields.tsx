
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalInfo {
  fullName: string;
  email: string;
  companyName: string;
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
}

interface PersonalInfoFieldsProps {
  personalInfo: PersonalInfo;
  isEditing: boolean;
  onInfoChange: (field: string, value: string) => void;
}

const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({
  personalInfo,
  isEditing,
  onInfoChange
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label className="text-gray-900 dark:text-gray-300 transition-colors duration-300">Full Name</Label>
        {isEditing ? (
          <Input 
            value={personalInfo.fullName} 
            onChange={e => onInfoChange('fullName', e.target.value)} 
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 transition-colors duration-300" 
          />
        ) : (
          <p className="mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300">{personalInfo.fullName || 'Not set'}</p>
        )}
      </div>
      <div>
        <Label className="text-gray-900 dark:text-gray-300 transition-colors duration-300">Email</Label>
        <p className="mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300">{personalInfo.email}</p>
      </div>
      <div>
        <Label className="text-gray-900 dark:text-gray-300 transition-colors duration-300">Company</Label>
        {isEditing ? (
          <Input 
            value={personalInfo.companyName} 
            onChange={e => onInfoChange('companyName', e.target.value)} 
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 transition-colors duration-300" 
          />
        ) : (
          <p className="mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300">{personalInfo.companyName || 'Not set'}</p>
        )}
      </div>
      <div>
        <Label className="text-gray-900 dark:text-gray-300 transition-colors duration-300">Package Type</Label>
        <p className="mt-1 capitalize text-gray-600 dark:text-gray-400 transition-colors duration-300">{personalInfo.packageType}</p>
      </div>
    </div>
  );
};

export default PersonalInfoFields;
