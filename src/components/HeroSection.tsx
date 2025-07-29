
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const HeroSection = () => {
  const { user } = useAuth();
  
  return (
    <section className="pt-20 pb-16 px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors duration-300">
            Where <span className="text-primary-600">Capital</span> Meets
            <br />
            <span className="text-primary-600">Innovation</span>
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Leading platform for connecting companies and individuals with global investors. Post your deal, connect with the right investors, and fuel your growth.
          </p>
          {!user && (
            <div className="flex justify-center animate-fade-in-delay">
              <Link to="/pricing">
                <Button size="lg" className="rounded-full bg-primary-600 hover:bg-primary-700 text-white hover:text-white px-8 py-4 text-lg">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
