
import { Investor } from '@/hooks/investors/types';

export const extractIndustriesFromInvestors = (investors: Investor[]): string[] => {
  if (!investors) return [];
  const industries = new Set<string>();

  investors.forEach(investor => {
    // Process both verticals and sectors as potential sources for industries
    const fieldsToProcess = [investor.verticals, investor.sectors];
    
    fieldsToProcess.forEach(field => {
      if (field && typeof field === 'string') {
        field.split(',').forEach(industry => {
          const trimmedIndustry = industry.trim();
          if (trimmedIndustry) {
            // Optional: Standardize to Title Case for consistency, similar to other extractions.
            const standardizedIndustry = trimmedIndustry
              .toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            industries.add(standardizedIndustry);
          }
        });
      }
    });
  });

  return Array.from(industries).sort();
};
