
import React from 'react';
import { Deal } from '@/hooks/useDeals';
import CompanyHeader from './CompanyHeader';
import PriceBanner from './PriceBanner';
import QuickInfoCards from './QuickInfoCards';
import CompanyDescription from './CompanyDescription';
import DealInformation from './DealInformation';
import FinancialInformation from './FinancialInformation';
import CompanyDetails from './CompanyDetails';
import VideoPreview from './VideoPreview';
import ContactCompanyForm from './ContactCompanyForm';

interface CompanyProfileContentProps {
  deal: Deal;
  formattedDeal: Deal;
}

const CompanyProfileContent = ({ deal, formattedDeal }: CompanyProfileContentProps) => {
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return 'N/A';
    let numAmount: number;
    if (typeof amount === 'string') {
      numAmount = parseFloat(amount.replace(/[\$,]/g, ''));
    } else {
      numAmount = amount;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const getMainPrice = () => {
    if (deal.deal_type === 'sell') {
      return deal.asking_price ? formatCurrency(deal.asking_price) : 'N/A';
    }
    if (deal.deal_type === 'capital' || deal.deal_type === 'crowdfunding') {
      return deal.funding_target ? formatCurrency(deal.funding_target) : 'N/A';
    }
    return 'N/A';
  };

  const getDealTypeDisplay = () => {
    switch (deal.deal_type) {
      case 'sell':
        return 'Business for Sale';
      case 'capital':
        return 'Capital Raising';
      case 'crowdfunding':
        return 'Crowdfunding';
      default:
        return deal.deal_type;
    }
  };

  const getPriceLabel = () => {
    switch (deal.deal_type) {
      case 'sell':
        return 'Asking Price';
      case 'capital':
        return 'Funding Target';
      case 'crowdfunding':
        return 'Funding Goal';
      default:
        return 'Price';
    }
  };

  return (
    <>
      {/* Company Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <CompanyHeader deal={formattedDeal} />
        </div>

        {/* Price Banner */}
        <PriceBanner 
          deal={formattedDeal}
          priceLabel={getPriceLabel()}
          mainPrice={getMainPrice()}
        />

        {/* Quick Info Cards */}
        <QuickInfoCards 
          deal={formattedDeal}
          dealTypeDisplay={getDealTypeDisplay()}
        />
      </div>

      {/* About Company */}
      <CompanyDescription deal={formattedDeal} />

      {/* Deal Specific Information */}
      <DealInformation 
        deal={formattedDeal}
        priceLabel={getPriceLabel()}
        mainPrice={getMainPrice()}
        formatCurrency={formatCurrency}
      />

      {/* Financial Information */}
      <FinancialInformation 
        deal={formattedDeal}
        formatCurrency={formatCurrency}
      />

      {/* Company Details */}
      <CompanyDetails deal={formattedDeal} />

      {/* Video Preview - only show if video_link exists and is not empty */}
      {deal.video_link && deal.video_link.trim() !== '' && (
        <VideoPreview 
          videoLink={deal.video_link}
          title={deal.title}
        />
      )}

      {/* Contact Company Form */}
      <div className="mt-8">
        <ContactCompanyForm deal={deal} />
      </div>
    </>
  );
};

export default CompanyProfileContent;
