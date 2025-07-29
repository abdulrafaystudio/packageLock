
import React from 'react';
import { Button } from '@/components/ui/button';

interface AuthSubmitButtonProps {
  isSignUp: boolean;
  isLoading: boolean;
  packageType?: string;
}

const AuthSubmitButton = ({ isSignUp, isLoading, packageType = 'free' }: AuthSubmitButtonProps) => {
  const getButtonText = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      );
    }

    if (!isSignUp) {
      return 'Sign In';
    }

    // For free packages, show "Create Free Account"
    if (packageType === 'free' || packageType === 'freepro') {
      return 'Create Free Account';
    }

    // For paid packages, show "Create Account"
    return 'Create Account';
  };

  return (
    <Button 
      type="submit"
      disabled={isLoading}
      className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {getButtonText()}
    </Button>
  );
};

export default AuthSubmitButton;
