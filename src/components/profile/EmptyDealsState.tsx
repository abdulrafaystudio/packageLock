
import React from 'react';

interface EmptyDealsStateProps {
  permissions: {
    canCreateDeals: boolean;
    maxDeals: number;
  };
}

const EmptyDealsState: React.FC<EmptyDealsStateProps> = ({ permissions }) => {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
        {permissions.maxDeals === -1 ? "Start posting your deals" : "Post your deal to see more info"}
      </p>
    </div>
  );
};

export default EmptyDealsState;
