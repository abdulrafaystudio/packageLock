
import React from 'react';
import { Link } from 'react-router-dom';

interface AuthToggleProps {
  isSignUp: boolean;
  onToggle: () => void;
}

const AuthToggle = ({ isSignUp, onToggle }: AuthToggleProps) => {
  return (
    <div>
      <div className="text-center mt-6">
        {isSignUp ? (
          <button
            onClick={onToggle}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Already have an account? Sign in
          </button>
        ) : (
          <Link
            to="/pricing"
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Don't have an account? Sign up
          </Link>
        )}
      </div>

      {isSignUp && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Need premium features? 
            <Link to="/pricing" className="text-primary-600 hover:text-primary-700 ml-1">
              View all plans
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthToggle;
