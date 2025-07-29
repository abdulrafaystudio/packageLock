import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import AuthFormFields from './AuthFormFields';
import AuthSubmitButton from './AuthSubmitButton';
import AuthModeToggle from './AuthModeToggle';

interface PremiumProAuthFormProps {
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

const PremiumProAuthForm = ({
  isSignUp,
  isLoading,
  formData,
  formErrors = {},
  onInputChange,
  onSubmit,
  onToggleAuth,
}: PremiumProAuthFormProps) => {
  
  return (
    <Card className="bg-white border-gray-200 shadow-lg h-full">
      <CardContent className="p-8 h-full flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Access your Premium Pro account' : 'Welcome back to EasyFund'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 flex-grow">
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
            packageType="premiumpro"
          />
        </form>

        <AuthModeToggle
          isSignUp={isSignUp}
          isLoading={isLoading}
          onToggle={onToggleAuth}
        />

        {isSignUp && (
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Need basic access? 
              <Link to="/auth-free" className="text-purple-600 hover:text-purple-700 ml-1">
                Try Free
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Want standard features? 
              <Link to="/auth-standard" className="text-purple-600 hover:text-purple-700 ml-1">
                Go Standard
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Looking for business features? 
              <Link to="/auth-enterprise" className="text-purple-600 hover:text-purple-700 ml-1">
                Try Enterprise
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumProAuthForm;
