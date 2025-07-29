
import { Investor } from '@/hooks/investors/types';

export const extractInvestmentTypesFromInvestors = (investors: Investor[]): string[] => {
  const allTypes = new Set<string>();
  
  if (investors) {
    investors.forEach(investor => {
      const typesStr = investor.preferred_investment_types;
      if (typesStr) {
        typesStr.split(/[,;|\n]/).forEach(type => {
          const trimmed = type.trim();
          if (trimmed) {
            allTypes.add(trimmed);
          }
        });
      }
    });
  }

  const sortedTypes = Array.from(allTypes).sort((a, b) => a.localeCompare(b));
  
  return sortedTypes;
};

export const formatInvestmentTypeForDisplay = (type: string): string => {
    if (!type) return '';
    // Replace underscores with spaces and apply title case
    return type
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
