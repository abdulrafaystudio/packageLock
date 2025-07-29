
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 border-t border-gray-800 dark:border-gray-700 py-12 px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img src="/lovable-uploads/a48c8cf6-ac96-4cae-bc4c-1d3fafc85d73.png" alt="EasyFund Logo" className="h-10 w-auto mb-4" />
            <p className="text-gray-300 mb-4 max-w-md">
              The exclusive platform connecting innovative companies with visionary investors. 
              Building the future of capital raising.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/companies" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">Companies</Link></li>
              <li><Link to="/investors" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">Investors</Link></li>
              <li><Link to="/pricing" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/help-center" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/terms" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center transition-colors duration-300">
          <p className="text-gray-400">
            © 2024 EasyFund. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
