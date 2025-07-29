
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import EnterprisePackageCard from '@/components/auth/EnterprisePackageCard';
import SimplifiedAuthForm from '@/components/auth/SimplifiedAuthForm';
import { useUnifiedAuthForm } from '@/hooks/auth/useUnifiedAuthForm';

const AuthEnterprise = () => {
  const [searchParams] = useSearchParams();
  const billing = searchParams.get('billing');
  const isYearly = billing === 'yearly';

  const {
    isSignUp,
    isLoading,
    formData,
    formErrors,
    handleInputChange,
    handleSubmit,
    toggleAuthMode,
  } = useUnifiedAuthForm({ defaultToSignUp: true, packageType: 'enterprise' });

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <EnterprisePackageCard isYearly={isYearly} />
            <SimplifiedAuthForm
              isSignUp={isSignUp}
              isLoading={isLoading}
              formData={formData}
              formErrors={formErrors}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              toggleAuthMode={toggleAuthMode}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthEnterprise;
