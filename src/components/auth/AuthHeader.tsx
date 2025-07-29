
import React from 'react';

interface AuthHeaderProps {
  isSignUp: boolean;
}

const AuthHeader = ({ isSignUp }: AuthHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
        {isSignUp 
          ? 'Create your account and start connecting with investors immediately' 
          : 'Sign in to your account to continue'
        }
      </p>
    </div>
  );
};

export default AuthHeader;
