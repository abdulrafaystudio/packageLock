
import React from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import CompanyShowcase from '@/components/CompanyShowcase';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main>
        <HeroSection />
        <HowItWorks />
        <CompanyShowcase />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
