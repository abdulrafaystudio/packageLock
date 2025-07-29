
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HelpCenterHero from '@/components/help-center/HelpCenterHero';
import HelpCenterFAQ from '@/components/help-center/HelpCenterFAQ';
import HelpCenterCategories from '@/components/help-center/HelpCenterCategories';
import HelpCenterContact from '@/components/help-center/HelpCenterContact';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HelpCenterHero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <HelpCenterFAQ />
          <HelpCenterCategories />
          <HelpCenterContact />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
