
import React from 'react';
import InvestorCard from './InvestorCard';
import { Investor } from '@/hooks/useInvestors';

interface InvestorListProps {
  investors: Investor[];
  viewMode: 'grid' | 'list';
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allInvestorsCount: number;
  hasFilters: boolean;
  onTypeClick?: (type: string) => void;
}

const InvestorList: React.FC<InvestorListProps> = ({
  investors,
  viewMode,
  currentPage,
  totalPages,
  totalCount,
  allInvestorsCount,
  hasFilters,
  onTypeClick,
}) => {
  const pageSize = 48;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  return (
    <>
      {/* Investors Grid */}
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4 md:gap-6 mb-8`}>
        {investors.map((investor) => (
          <InvestorCard 
            key={investor.id} 
            investor={investor} 
            onTypeClick={onTypeClick}
          />
        ))}
      </div>

      {investors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No investors found matching your criteria.
          </p>
        </div>
      )}
    </>
  );
};

export default InvestorList;
