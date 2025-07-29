
// Simple utility for investment type handling - no artificial mappings needed

/**
 * Normalizes investment type for consistent display formatting
 */
export const normalizeInvestmentType = (dbValue: string): string => {
  if (!dbValue || typeof dbValue !== 'string') {
    return 'ANY';
  }

  // Just trim and return the actual database value
  return dbValue.trim();
};

/**
 * Prepares the selected investment type for database querying
 * Returns the value as-is for direct matching
 */
export const prepareInvestmentTypeForQuery = (selectedType: string): string => {
  if (!selectedType || selectedType === 'ANY') {
    return '';
  }
  
  return selectedType.trim();
};
