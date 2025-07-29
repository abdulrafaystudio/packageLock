// Mapping from database values to display categories
const INVESTOR_TYPE_MAPPING: { [key: string]: string } = {
  // Accelerator
  'ACCELERATOR': 'Accelerator',
  'VENTURE_CAPITAL_ACCELERATOR_INCUBATOR': 'Accelerator',
  'Accelerator': 'Accelerator',
  
  // Asset Manager
  'ASSET_MANAGER': 'Asset Manager',
  'FUND_OF_FUNDS': 'Asset Manager',
  'HEDGE_FUND': 'Asset Manager',
  'MUTUAL_FUND': 'Asset Manager',
  'Asset Manager': 'Asset Manager',
  'Fund Of Funds': 'Asset Manager',
  'Hedge Fund': 'Asset Manager',
  'Mutual Fund': 'Asset Manager',
  
  // Business Angel
  'ANGEL_GROUP': 'Business Angel',
  'ANGEL_INDIVIDUAL': 'Business Angel',
  'BUSINESS_ANGEL': 'Business Angel',
  'VENTURE_CAPITAL_ANGEL_GROUP': 'Business Angel',
  'Angel Group': 'Business Angel',
  'Angel Individual': 'Business Angel',
  'Business Angel': 'Business Angel',
  'Business Angels': 'Business Angel',
  'Angel Investor': 'Business Angel',
  'Angels': 'Business Angel',
  'Angel': 'Business Angel',
  
  // Corporation
  'CORPORATE': 'Corporation',
  'CORPORATION': 'Corporation',
  'CORPORATE_DEVELOPMENT': 'Corporation',
  'CORPORATE_VENTURE_CAPITAL': 'Corporation',
  'HOLDING_COMPANY': 'Corporation',
  'Corporate': 'Corporation',
  'Corporation': 'Corporation',
  'Corporations': 'Corporation',
  'Corporate Development': 'Corporation',
  'Corporate Venture': 'Corporation',
  'Holding Company': 'Corporation',
  'Corp': 'Corporation',
  
  // Family Office
  'FAMILY_OFFICE': 'Family Office',
  'Family Office': 'Family Office',
  'Family': 'Family Office',
  'Office': 'Family Office',
  
  // Private Equity
  'PRIVATE_EQUITY': 'Private Equity',
  'PE_BUYOUT': 'Private Equity',
  'OTHER_PRIVATE_EQUITY': 'Private Equity',
  'MEZZANINE': 'Private Equity',
  'SECONDARY_BUYER': 'Private Equity',
  'Private Equity': 'Private Equity',
  'Pe Buyout': 'Private Equity',
  'Other Private Equity': 'Private Equity',
  'Mezzanine': 'Private Equity',
  'Secondary Buyer': 'Private Equity',
  'Pe': 'Private Equity',
  'Equity': 'Private Equity',
  'Fund': 'Private Equity',
  'Capital': 'Private Equity',
  
  // Venture Capital
  'VENTURE_CAPITAL': 'Venture Capital',
  'CORPORATE_VENTURE_CAPITAL_VENTURE_CAPITAL': 'Venture Capital',
  'NOT_FOR_PROFIT_VENTURE_CAPITAL': 'Venture Capital',
  'Venture Capital': 'Venture Capital',
  'Corporate Venture Capital Venture Capital': 'Venture Capital',
  'Not For Profit Venture Capital': 'Venture Capital',
  'Vc': 'Venture Capital',
  'Venture': 'Venture Capital',
  
  // Other (catch-all)
  'OTHER': 'Other',
  'Other': 'Other'
};

// The 8 standard display categories
export const DISPLAY_INVESTOR_TYPES = [
  'Accelerator',
  'Asset Manager', 
  'Business Angel',
  'Corporation',
  'Family Office',
  'Private Equity',
  'Venture Capital',
  'Other'
];

/**
 * Maps a database investor type to a display category
 */
export const mapInvestorTypeToDisplay = (dbType: string | null | undefined): string => {
  if (!dbType || typeof dbType !== 'string') {
    return 'Other';
  }

  // Handle comma-separated types - take the first one
  const firstType = dbType.split(',')[0].trim();
  
  // Try exact match first
  if (INVESTOR_TYPE_MAPPING[firstType]) {
    return INVESTOR_TYPE_MAPPING[firstType];
  }
  
  // Try case-insensitive match
  const normalizedType = firstType
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  if (INVESTOR_TYPE_MAPPING[normalizedType]) {
    return INVESTOR_TYPE_MAPPING[normalizedType];
  }
  
  // Try partial matching for any of the mapped types
  const lowerDbType = firstType.toLowerCase();
  for (const [dbValue, displayValue] of Object.entries(INVESTOR_TYPE_MAPPING)) {
    if (lowerDbType.includes(dbValue.toLowerCase()) || dbValue.toLowerCase().includes(lowerDbType)) {
      return displayValue;
    }
  }
  
  // Default to Other if no match found
  console.log(`No mapping found for investor type: "${firstType}" - defaulting to Other`);
  return 'Other';
};

/**
 * Maps a display category back to all possible database values for querying
 */
export const mapDisplayTypeToDbValues = (displayType: string): string[] => {
  const dbValues: string[] = [];
  
  for (const [dbValue, mappedDisplay] of Object.entries(INVESTOR_TYPE_MAPPING)) {
    if (mappedDisplay === displayType) {
      dbValues.push(dbValue);
    }
  }
  
  return dbValues;
};

/**
 * Gets all unique display types from a list of investors
 */
export const extractDisplayTypesFromInvestors = (investors: any[]): string[] => {
  const typeSet = new Set<string>();
  
  investors.forEach(investor => {
    if (investor.Type) {
      const displayType = mapInvestorTypeToDisplay(investor.Type);
      typeSet.add(displayType);
    }
  });
  
  // Return in the standard order
  return DISPLAY_INVESTOR_TYPES.filter(type => typeSet.has(type));
};
