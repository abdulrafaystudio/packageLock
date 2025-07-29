
import React from 'react';
import { Building2, Clock, MapPin } from 'lucide-react';
import { Deal } from '@/hooks/useDeals';

interface CompanyHeaderProps {
  deal: Deal;
}

const CompanyHeader = ({ deal }: CompanyHeaderProps) => {
  return (
    <div>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 transition-colors duration-300">
        {deal.title}
      </h1>
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{deal.industry}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Founded {deal.year_founded}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{deal.location}</span>
        </div>
      </div>
    </div>
  );
};

export default CompanyHeader;
