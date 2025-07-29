
import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const CompanyProfileLoading = () => {
  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Loading deal...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyProfileLoading;
