
// Utility for normalizing and validating investor types

const VALID_INVESTOR_TYPES = [
  'Private Equity',
  'Venture Capital', 
  'Asset Manager',
  'Family Office',
  'Accelerator',
  'Incubator',
  'Business Angels',
  'Angel Investor',
  'Corporations',
  'Corporate Venture',
  'Government',
  'Foundation',
  'Endowment',
  'Pension Fund',
  'Insurance Company',
  'Bank',
  'Investment Bank',
  'Hedge Fund',
  'Mutual Fund',
  'REIT',
  'Crowdfunding',
  'Peer to Peer'
];

// Patterns that indicate invalid type data (descriptions, locations, etc.)
const INVALID_TYPE_PATTERNS = [
  /focus on/i,
  /connecting/i,
  /portfolio/i,
  /company/i,
  /investing/i,
  /investment/i,
  /particular/i,
  /leading/i,
  /stage/i,
  /coast/i,
  /finance/i,
  /services/i,
  /management/i,
  /partnership/i,
  /\.com/i,
  /www\./i,
  /http/i,
  /@/i,
  /\d{3,}/,  // 3 or more consecutive digits
  /^\d+$/,   // Only numbers
];

export const normalizeInvestorType = (type: string | null | undefined): string => {
  // Return default if no type provided
  if (!type || typeof type !== 'string') {
    return 'Private Equity';
  }

  const cleanType = type.trim();
  
  // Check if the type contains invalid patterns (descriptions, etc.)
  const isInvalid = INVALID_TYPE_PATTERNS.some(pattern => pattern.test(cleanType));
  if (isInvalid) {
    console.log(`Invalid type detected: "${cleanType}" - using default`);
    return 'Private Equity';
  }

  // Handle comma-separated types - take the first one
  const firstType = cleanType.split(',')[0].trim();
  
  // Check if it's too long (likely a description)
  if (firstType.length > 50) {
    console.log(`Type too long: "${firstType}" - using default`);
    return 'Private Equity';
  }

  // Normalize the type display
  const normalizedType = firstType
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Map common variations to standard types
  const typeMapping: { [key: string]: string } = {
    'Vc': 'Venture Capital',
    'Pe': 'Private Equity',
    'Angel': 'Angel Investor',
    'Angels': 'Angel Investor',
    'Corp': 'Corporations',
    'Corporate': 'Corporations',
    'Fund': 'Private Equity',
    'Equity': 'Private Equity',
    'Capital': 'Private Equity',
    'Venture': 'Venture Capital',
    'Asset': 'Asset Manager',
    'Family': 'Family Office',
    'Office': 'Family Office'
  };

  // Check if the normalized type matches our mapping
  const mappedType = typeMapping[normalizedType];
  if (mappedType) {
    return mappedType;
  }

  // Check if it's a valid type (case insensitive)
  const validType = VALID_INVESTOR_TYPES.find(validType => 
    validType.toLowerCase() === normalizedType.toLowerCase()
  );
  
  if (validType) {
    return validType;
  }

  // Check if it contains any valid type as substring
  const containsValidType = VALID_INVESTOR_TYPES.find(validType =>
    normalizedType.toLowerCase().includes(validType.toLowerCase()) ||
    validType.toLowerCase().includes(normalizedType.toLowerCase())
  );

  if (containsValidType) {
    return containsValidType;
  }

  // If no valid type found, return default
  console.log(`No valid type found for: "${cleanType}" - using default`);
  return 'Private Equity';
};
