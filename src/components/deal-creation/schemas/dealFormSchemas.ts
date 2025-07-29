
import * as z from 'zod';

export const baseSchema = z.object({
  companyName: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  yearFounded: z.string().regex(/^\d+$/, 'Only numbers allowed'),
  location: z.string().min(1, 'Location is required'),
  industry: z.string().min(1, 'Industry is required'),
  customIndustry: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  website: z.string().optional(),
  growthExpansions: z.string().optional(),
  patents: z.string().optional(),
  technologyAssets: z.string().optional(),
  videoLink: z.string().optional(),
  videoLinks: z.array(z.string()).optional()
});

export const capitalRaisingSchema = baseSchema.extend({
  fundingTarget: z.string().regex(/^[\d,\.]+$/, 'Only numbers, commas, and periods allowed'),
  companyValuation: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  grossRevenue: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  ebitda: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  cashFlow: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  reasonForInvesting: z.string().min(1, 'Reason for investing is required')
});

export const sellSchema = baseSchema.extend({
  askingPrice: z.string().regex(/^[\d,\.]+$/, 'Only numbers, commas, and periods allowed'),
  percentageForSale: z.string().regex(/^[\d,\.]+$/, 'Only numbers, commas, and periods allowed'),
  grossRevenue: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  ebitda: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  cashFlow: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  reasonForSelling: z.string().min(1, 'Reason for selling is required')
});

export const crowdfundingSchema = baseSchema.extend({
  website: z.string().min(1, 'Website of the Crowdfunding Platform is required'),
  fundingTarget: z.string().regex(/^[\d,\.]+$/, 'Only numbers, commas, and periods allowed'),
  companyValuation: z.string().regex(/^[\d,\.]*$/, 'Only numbers, commas, and periods allowed').optional(),
  reasonForInvesting: z.string().min(1, 'Reason for investing is required')
});

export type AllFormFields = z.infer<typeof capitalRaisingSchema> & z.infer<typeof sellSchema> & z.infer<typeof crowdfundingSchema> & {
  customIndustry?: string;
  videoLinks?: string[];
};

export const getSchemaForDealType = (dealType: 'capital' | 'sell' | 'crowdfunding') => {
  switch (dealType) {
    case 'capital':
      return capitalRaisingSchema;
    case 'sell':
      return sellSchema;
    case 'crowdfunding':
      return crowdfundingSchema;
    default:
      return baseSchema;
  }
};
