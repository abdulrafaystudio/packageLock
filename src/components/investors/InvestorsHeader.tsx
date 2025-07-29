
import React from 'react';

const InvestorsHeader = () => {
  return (
    <section className="pt-20 pb-16 px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors duration-300">
            Find <span className="text-primary-600">Investors</span>
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Discover and connect with investors worldwide. Network with the right investors, and fuel your growth.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InvestorsHeader;
