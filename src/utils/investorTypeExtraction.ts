
import { Investor } from '@/hooks/useInvestors';

export const extractInvestorTypesFromInvestors = (investors: Investor[]): string[] => {
  const typeSet = new Set<string>();
  const rawTypesFound = new Set<string>();

  console.log('Starting investor type extraction from', investors.length, 'investors');

  investors.forEach(investor => {
    if (investor.type) {
      const rawType = investor.type.trim();
      rawTypesFound.add(rawType);
      
      // Split by comma and process each type
      const types = rawType.split(',').map(type => type.trim());
      
      types.forEach(type => {
        if (type && type.length > 0) {
          // Clean and standardize the type for display
          let standardType = type
            .replace(/_/g, ' ')                    // Replace underscores with spaces
            .replace(/\s+/g, ' ')                  // Normalize multiple spaces
            .trim();
          
          // Convert to title case for consistent display
          standardType = standardType
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          if (standardType.length > 0) {
            typeSet.add(standardType);
          }
        }
      });
    }
  });

  const sortedTypes = Array.from(typeSet).sort();
  
  console.log('Raw types found in database:', Array.from(rawTypesFound).sort());
  console.log('Standardized types for dropdown:', sortedTypes);
  console.log('Total unique types found:', sortedTypes.length);
  
  return sortedTypes;
};
