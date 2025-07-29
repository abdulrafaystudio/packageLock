
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const CompanyProfileError = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Deal Not Found</h1>
          <Button onClick={() => navigate('/companies')}>
            Back to Companies
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyProfileError;
