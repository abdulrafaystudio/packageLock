
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AuthHeader from './AuthHeader';
import AuthFormFields from './AuthFormFields';
import AuthSubmitButton from './AuthSubmitButton';
import AuthModeToggle from './AuthModeToggle';
import { useUnifiedAuthForm } from '@/hooks/auth/useUnifiedAuthForm';

interface AuthFormProps {
  packageType?: string;
  defaultToSignUp?: boolean;
}

const AuthForm = ({ packageType = 'free', defaultToSignUp = false }: AuthFormProps) => {
  const {
    isSignUp,
    isLoading,
    formData,
    formErrors,
    handleInputChange,
    handleSubmit,
    toggleAuthMode,
  } = useUnifiedAuthForm({ defaultToSignUp, packageType });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <AuthHeader isSignUp={isSignUp} />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthFormFields
            isSignUp={isSignUp}
            formData={formData}
            formErrors={formErrors}
            handleInputChange={handleInputChange}
          />
          
          <AuthSubmitButton isSignUp={isSignUp} isLoading={isLoading} />
          
          <AuthModeToggle isSignUp={isSignUp} toggleAuthMode={toggleAuthMode} />
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
