
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AuthFormFields from './AuthFormFields';
import AuthSubmitButton from './AuthSubmitButton';
import AuthModeToggle from './AuthModeToggle';

interface PremiumAuthFormProps {
  isSignUp: boolean;
  isLoading: boolean;
  formData: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
  };
  formErrors?: Record<string, string>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleAuth: () => void;
}

const PremiumAuthForm = ({ 
  isSignUp, 
  isLoading, 
  formData,
  formErrors = {},
  onInputChange, 
  onSubmit, 
  onToggleAuth,
}: PremiumAuthFormProps) => {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-lg h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Join Premium' : 'Premium Sign In'}
          </h1>
          <p className="text-gray-600">
            {isSignUp 
              ? 'Get instant access to our premium investor database'
              : 'Welcome back to your Premium account'
            }
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 flex-grow">
          <AuthFormFields
            isSignUp={isSignUp}
            formData={formData}
            formErrors={formErrors}
            isDisabled={isLoading}
            onInputChange={onInputChange}
          />

          <AuthSubmitButton
            isSignUp={isSignUp}
            isLoading={isLoading}
            packageType="premium"
          />
        </form>

        <AuthModeToggle
          isSignUp={isSignUp}
          isLoading={isLoading}
          onToggle={onToggleAuth}
        />
      </CardContent>
    </Card>
  );
};

export default PremiumAuthForm;
