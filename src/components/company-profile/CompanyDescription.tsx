
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Deal } from '@/hooks/useDeals';
import { sanitizeHtml } from '@/utils/security';

interface CompanyDescriptionProps {
  deal: Deal;
}

const CompanyDescription = ({ deal }: CompanyDescriptionProps) => {
  // Sanitize the description to prevent XSS attacks
  const sanitizedDescription = sanitizeHtml(deal.description || '');

  return (
    <Card className="mb-8 bg-white border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
        <div 
          className="text-gray-700 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
        />
      </CardContent>
    </Card>
  );
};

export default CompanyDescription;
