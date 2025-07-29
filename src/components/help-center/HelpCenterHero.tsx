
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface HelpCenterHeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const HelpCenterHero = ({ searchQuery, setSearchQuery }: HelpCenterHeroProps) => {
  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
        Help <span className="text-primary-600">Center</span>
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 transition-colors duration-300">
        Find answers to your questions, browse our knowledge base, or get in touch with our support team.
      </p>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-4 text-lg border-gray-300 dark:border-gray-600 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default HelpCenterHero;
