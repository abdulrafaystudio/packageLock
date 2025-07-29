
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDealTypeDisplay } from '@/utils/dealFormatting';

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
  status?: string;
}

interface CompanyCardProps {
  company: Company;
  onClick: (companyId: number, dealId?: string) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
  const getStatusBadge = () => {
    if (!company.status || company.status === 'Active') return null;
    
    const statusConfig = {
      'Pending': {
        text: 'Pending',
        className: 'bg-blue-500 text-white hover:bg-blue-600'
      },
      'Funded': {
        text: 'Funded',
        className: 'bg-green-500 text-white hover:bg-green-600'
      }
    };

    const config = statusConfig[company.status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge 
        className={`absolute top-3 right-3 z-10 text-xs font-medium ${config.className}`}
      >
        {config.text}
      </Badge>
    );
  };

  return (
    <Card 
      className="bg-white border-gray-200 hover:border-primary-600 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col relative overflow-hidden"
      onClick={() => onClick(company.id, company.dealId)}
    >
      {getStatusBadge()}
      <CardContent className="p-4 sm:p-6 flex flex-col h-full">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 transition-colors duration-300 break-words hyphens-auto line-clamp-2">
          {company.title}
        </h3>
        <div className="mb-3">
          <Badge 
            variant="outline" 
            className="text-xs border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100 truncate max-w-full"
          >
            {formatDealTypeDisplay(company.dealType)}
          </Badge>
        </div>
        <div className="text-gray-700 mb-4 text-sm transition-colors duration-300 flex-1 min-h-0">
          <p className="line-clamp-3 break-words hyphens-auto leading-relaxed">
            {company.description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-auto">
          <span className="text-gray-900 font-semibold transition-colors duration-300 text-sm sm:text-base break-words">
            {company.raising}
          </span>
          <span className="text-gray-500 text-xs sm:text-sm transition-colors duration-300 break-words truncate">
            {company.location}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyCard;
