
import React from 'react';
import Footer from '@/components/Footer';
import ProcessInvestorData from '@/components/ProcessInvestorData';

const ProcessInvestors = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="pt-4 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Process <span className="text-primary-600">Investor Data</span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
              Import and process investor data from storage into the database
            </p>
          </div>

          <ProcessInvestorData />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProcessInvestors;
