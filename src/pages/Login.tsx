
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedAuthForm } from '@/hooks/auth/useUnifiedAuthForm';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthFormFields from '@/components/auth/AuthFormFields';
import AuthSubmitButton from '@/components/auth/AuthSubmitButton';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    isSignUp, 
    isLoading, 
    formData,
    formErrors,
    handleInputChange, 
    handleSubmit, 
    toggleAuthMode
  } = useUnifiedAuthForm({ defaultToSignUp: false, packageType: 'free' });

  const { 
    isResetLoading,
    resetEmail,
    isResetDialogOpen,
    setResetEmail,
    setIsResetDialogOpen,
    handlePasswordReset
  } = usePasswordReset();

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg transition-colors duration-300">
            <CardContent className="p-8">
              <AuthHeader isSignUp={isSignUp} />
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthFormFields
                  isSignUp={isSignUp}
                  formData={formData}
                  formErrors={formErrors}
                  isDisabled={isLoading}
                  onInputChange={handleInputChange}
                />

                <AuthSubmitButton
                  isSignUp={isSignUp}
                  isLoading={isLoading}
                />
              </form>

              {/* Forgot Password Dialog - only show for login */}
              {!isSignUp && (
                <ForgotPasswordDialog
                  isOpen={isResetDialogOpen}
                  onOpenChange={setIsResetDialogOpen}
                  resetEmail={resetEmail}
                  onResetEmailChange={setResetEmail}
                  onSubmit={handlePasswordReset}
                  isLoading={isResetLoading}
                />
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSignUp 
                    ? "Already have an account?" 
                    : "Don't have an account?"}{' '}
                  {isSignUp ? (
                    <button onClick={toggleAuthMode} className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                      Sign in
                    </button>
                  ) : (
                    <Link to="/pricing" className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                      Sign up
                    </Link>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
