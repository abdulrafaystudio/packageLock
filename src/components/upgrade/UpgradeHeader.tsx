
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeHeaderProps {
  planName: string;
}

const UpgradeHeader = ({ planName }: UpgradeHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/pricing')}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pricing
        </Button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
          Upgrade to <span className="text-primary-600">{planName}</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
          Complete your upgrade to unlock premium features
        </p>
      </div>
    </>
  );
};

export default UpgradeHeader;
