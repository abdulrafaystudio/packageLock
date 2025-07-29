
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CompanyDetailsDialog from '@/components/companies/CompanyDetailsDialog';

const CompanyProfileUnauthenticated = () => {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(true);

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <Navigation />
      <CompanyDetailsDialog 
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          navigate('/companies');
        }}
      />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyProfileUnauthenticated;
