
import { AllFormFields } from '../schemas/dealFormSchemas';

export const getDefaultValues = (dealType: 'capital' | 'sell' | 'crowdfunding'): Partial<AllFormFields> => {
  const baseDefaults = {
    companyName: '',
    title: '',
    yearFounded: '',
    location: '',
    industry: '',
    customIndustry: '',
    description: '',
    website: '',
    growthExpansions: '',
    patents: '',
    technologyAssets: '',
    videoLink: ''
  };

  switch (dealType) {
    case 'capital':
      return {
        ...baseDefaults,
        fundingTarget: '',
        companyValuation: '',
        grossRevenue: '',
        ebitda: '',
        cashFlow: '',
        reasonForInvesting: ''
      };
    case 'sell':
      return {
        ...baseDefaults,
        askingPrice: '',
        percentageForSale: '',
        grossRevenue: '',
        ebitda: '',
        cashFlow: '',
        reasonForSelling: ''
      };
    case 'crowdfunding':
      return {
        ...baseDefaults,
        fundingTarget: '',
        companyValuation: '',
        reasonForInvesting: ''
      };
    default:
      return baseDefaults;
  }
};

export const parseNumber = (value: string | undefined): number | null => {
  if (!value || value.trim() === '') return null;
  const cleanValue = value.replace(/,/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
};

export const getDealTypeTitle = (dealType: 'capital' | 'sell' | 'crowdfunding') => {
  switch (dealType) {
    case 'capital':
      return 'Capital Raising';
    case 'sell':
      return 'Sell Your Business';
    case 'crowdfunding':
      return 'Crowdfunding Campaign';
    default:
      return 'Create Deal';
  }
};
