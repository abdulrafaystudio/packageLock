
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-20 px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-4xl mx-auto text-center">
        <div className="animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            Ready to <span className="text-primary-600">Get Started?</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto transition-colors duration-300">
            Join thousands of companies and investors who have already found success on our platform.
          </p>
          <div className="flex justify-center animate-fade-in-delay">
            <Link to="/pricing">
              <Button size="lg" className="rounded-full bg-primary-600 hover:bg-primary-700 text-white hover:text-white px-8 py-4 text-lg">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
