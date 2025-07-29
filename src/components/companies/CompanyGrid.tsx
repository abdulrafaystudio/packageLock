
import React from 'react';
import CompanyCard from './CompanyCard';

interface Company {
  id: number;
  dealId?: string;
  title: string;
  industry: string;
  description: string;
  raising: string;
  location: string;
  categoryType: string;
  sector: string;
  dealType: string;
  country: string;
  yearFounded: number;
  grossRevenue: number;
  ebitda: number;
  cashFlow: number;
  employees: number;
  reasonForSelling?: string;
  growthExpansion: string;
  fundingGoal?: number;
  minimumInvestment?: number;
  companyValuation?: number;
  useOfFunds?: string;
}

interface CompanyGridProps {
  companies: Company[];
  viewMode: 'grid' | 'list';
  onCompanyClick: (companyId: number, dealId?: string) => void;
}

const CompanyGrid: React.FC<CompanyGridProps> = ({ companies, viewMode, onCompanyClick }) => {
  return (
    <div className={`grid gap-4 sm:gap-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1'
    }`}>
      {companies.map((company) => (
        <CompanyCard 
          key={company.dealId || company.id} 
          company={company} 
          onClick={onCompanyClick}
        />
      ))}
    </div>
  );
};

export default CompanyGrid;
