import { useMemo } from 'react';

interface Deal {
  id: string;
  title: string;
  description: string;
  industry: string;
  location: string;
  deal_type: string;
  year_founded: number;
  funding_target?: number;
  asking_price?: number;
  company_valuation?: number;
  gross_revenue?: number;
  ebitda?: number;
  cash_flow?: number;
  reason_for_selling?: string;
  growth_expansions?: string;
  status?: string;
  is_usa?: boolean; // Add this field to handle USA checkbox
}

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

export const useDealsTransformation = (deals: Deal[]) => {
  return useMemo(() => {
    const usStates = [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
      'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
      'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
      'Wisconsin', 'Wyoming'
    ];

    return deals.map((deal, index) => {
      // Extract country from location
      const locationParts = deal.location?.split(',') || [];
      let country = locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : deal.location || 'Unknown';
      let displayLocation = deal.location || 'Location not specified';
      
      // Handle USA checkbox functionality
      if (deal.is_usa || usStates.includes(deal.location?.trim() || '')) {
        country = deal.location?.trim() || 'Unknown';
        // If it's a US state, format the display to show "State, USA"
        if (usStates.includes(deal.location?.trim() || '')) {
          displayLocation = `${deal.location.trim()}, USA`;
        }
      } else if (locationParts.length > 0) {
        // Check if any part of the location is a US state
        const stateInLocation = locationParts.find(part => usStates.includes(part.trim()));
        if (stateInLocation) {
          country = stateInLocation.trim();
          // Keep the original location format if it already includes country info
          displayLocation = deal.location;
        }
      }
      
      // Format raising amount
      let raising = '';
      if (deal.deal_type === 'capital' && deal.funding_target) {
        raising = `$${deal.funding_target.toLocaleString()}`;
      } else if (deal.deal_type === 'sell' && deal.asking_price) {
        raising = `$${deal.asking_price.toLocaleString()}`;
      } else if (deal.deal_type === 'crowdfunding' && deal.funding_target) {
        raising = `$${deal.funding_target.toLocaleString()}`;
      } else {
        raising = 'Contact for details';
      }

      return {
        id: index + 1, // Legacy ID for compatibility
        dealId: deal.id, // Real deal ID
        title: deal.title,
        industry: deal.industry,
        description: deal.description,
        raising,
        location: displayLocation, // Use formatted location
        categoryType: deal.deal_type,
        sector: deal.industry,
        dealType: deal.deal_type,
        country,
        yearFounded: deal.year_founded || 0,
        grossRevenue: deal.gross_revenue || 0,
        ebitda: deal.ebitda || 0,
        cashFlow: deal.cash_flow || 0,
        employees: 0, // Not available in deals data
        reasonForSelling: deal.reason_for_selling,
        growthExpansion: deal.growth_expansions || '',
        fundingGoal: deal.funding_target,
        minimumInvestment: 0, // Not available in deals data
        companyValuation: deal.company_valuation,
        useOfFunds: '', // Not available in deals data
        status: deal.status || 'Active'
      } as Company;
    });
  }, [deals]);
};
