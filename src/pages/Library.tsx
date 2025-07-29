
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LibraryContent from '@/components/library/LibraryContent';

const Library = () => {
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Knowledge <span className="text-primary-600">Library</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
              Detailed guides and information to help you make the most of EasyFund.
            </p>
          </div>
          <LibraryContent selectedTopic={topic} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Library;
