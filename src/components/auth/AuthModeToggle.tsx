
import React from 'react';
import { Button } from '@/components/ui/button';

interface AuthModeToggleProps {
  isSignUp: boolean;
  toggleAuthMode?: () => void;
  onToggle?: () => void;
  isLoading?: boolean;
}

const AuthModeToggle = ({ isSignUp, toggleAuthMode, onToggle, isLoading = false }: AuthModeToggleProps) => {
  const handleToggle = toggleAuthMode || onToggle;
  
  return (
    <div className="text-center">
      <p className="text-gray-600 dark:text-gray-300">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
      </p>
      <Button 
        type="button" 
        variant="link" 
        onClick={handleToggle}
        disabled={isLoading}
        className="text-purple-600 hover:text-purple-700"
      >
        {isSignUp ? 'Sign In' : 'Sign Up'}
      </Button>
    </div>
  );
};

export default AuthModeToggle;
