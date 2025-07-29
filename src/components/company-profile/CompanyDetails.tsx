
import React from 'react';
import { ArrowLeft, Building2, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Deal } from '@/hooks/useDeals';
import { sanitizeHtml, validateUrl } from '@/utils/security';

interface CompanyDetailsProps {
  deal: Deal;
}

const CompanyDetails = ({ deal }: CompanyDetailsProps) => {
  // Sanitize all user-generated content
  const sanitizedIndustry = sanitizeHtml(deal.industry || '');
  const sanitizedCompanyName = sanitizeHtml(deal.company_name || '');
  const sanitizedLocation = sanitizeHtml(deal.location || '');
  const sanitizedReasonForSelling = sanitizeHtml(deal.reason_for_selling || '');
  const sanitizedGrowthExpansions = sanitizeHtml(deal.growth_expansions || '');
  const sanitizedReasonForInvesting = sanitizeHtml(deal.reason_for_investing || '');

  // Validate and sanitize website URL
  const isValidWebsite = deal.website && validateUrl(deal.website);
  const sanitizedWebsite = isValidWebsite ? deal.website : null;

  return (
    <Card className="mb-8 bg-white border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Industry</div>
            <div 
              className="text-gray-900 font-medium break-words overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{ __html: sanitizedIndustry }}
            />
          </div>
          {deal.company_name && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Company Name</div>
              <div 
                className="text-gray-900 font-medium break-words overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{ __html: sanitizedCompanyName }}
              />
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Location</div>
            <div 
              className="text-gray-900 font-medium break-words overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{ __html: sanitizedLocation }}
            />
          </div>
        </div>


        {/* Expandable Sections */}
        {deal.reason_for_selling && (
          <Collapsible className="mb-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Reason for Selling</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-500 rotate-[-90deg] transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 pl-11">
              <div 
                className="text-gray-700 break-words overflow-wrap-anywhere whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: sanitizedReasonForSelling }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {deal.growth_expansions && (
          <Collapsible className="mb-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Growth & Expansion</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-500 rotate-[-90deg] transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 pl-11">
              <div 
                className="text-gray-700 break-words overflow-wrap-anywhere whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: sanitizedGrowthExpansions }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Crowdfunding Platform CTA */}
        {deal.deal_type.toLowerCase() === 'crowdfunding' && sanitizedWebsite && (
          <div className="mb-4">
            <Button 
              asChild
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a 
                href={sanitizedWebsite} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Go to Crowdfunding Platform
              </a>
            </Button>
          </div>
        )}

        {deal.reason_for_investing && (
          <Collapsible className="mb-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Use of Funds</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-500 rotate-[-90deg] transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 pl-11">
              <div 
                className="text-gray-700 break-words overflow-wrap-anywhere whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: sanitizedReasonForInvesting }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

      </CardContent>
    </Card>
  );
};

export default CompanyDetails;
