/**
 * Formats industry names for display by replacing underscores with spaces
 * and applying proper capitalization
 */
export const formatIndustryForDisplay = (industry: string): string => {
  if (!industry) return '';
  
  return industry
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ')
    .map(word => {
      // Handle special cases for acronyms and abbreviations
      const upperCaseWords = ['AI', 'AR', 'VR', 'IOT', 'API', 'SaaS', 'PaaS', 'IaaS', 'CRM', 'ERP'];
      if (upperCaseWords.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      
      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Converts display format back to database format by replacing spaces with underscores
 * and converting to lowercase
 */
export const formatIndustryForDatabase = (industry: string): string => {
  if (!industry) return '';
  
  return industry
    .replace(/ /g, '_') // Replace spaces with underscores
    .toLowerCase();
};