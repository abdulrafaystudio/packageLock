
import { FIELD_MAPPINGS } from './fieldMappings';
import { cleanText } from './textCleaning';

interface RawInvestorData {
  [key: string]: any;
}

// Pattern to identify financial/revenue data that shouldn't be names
const FINANCIAL_PATTERNS = [
  /\$[\d,.]+(million|billion|k|m|b)/i,
  /\$[\d,.]+(\s*(million|billion|k|m|b))?/i,
  /(revenue|ebitda|ebit|profit|sales|turnover)/i,
  /^\$[\d,.-]+/,
  /[\d,.]+(million|billion|k|m|b)\s*(revenue|ebitda|ebit|profit|sales)/i,
  /(minimum|maximum|min|max)\s*[\$\d]/i,
  /[\d,.]+(mm|bn)\s*(revenue|ebitda)/i
];

// Pattern to identify descriptions that shouldn't be names
const DESCRIPTION_PATTERNS = [
  /investment portfolio/i,
  /companies across/i,
  /focus on/i,
  /specializes in/i,
  /invests in/i,
  /private equity/i,
  /venture capital/i,
  /founded in \d{4}/i,
  /established in \d{4}/i,
  /\d{4}-\d{4}/,
  /since \d{4}/i
];

const isValidInvestorName = (text: string): boolean => {
  if (!text || text.length < 2 || text.length > 100) {
    return false;
  }

  // Check if it matches financial patterns
  for (const pattern of FINANCIAL_PATTERNS) {
    if (pattern.test(text)) {
      console.log(`Rejecting "${text}" - matches financial pattern`);
      return false;
    }
  }

  // Check if it matches description patterns
  for (const pattern of DESCRIPTION_PATTERNS) {
    if (pattern.test(text)) {
      console.log(`Rejecting "${text}" - matches description pattern`);
      return false;
    }
  }

  // Reject if it's just numbers
  if (/^\d+$/.test(text.trim())) {
    return false;
  }

  // Reject if it contains too many numbers relative to letters
  const numbers = (text.match(/\d/g) || []).length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  if (numbers > letters && numbers > 3) {
    console.log(`Rejecting "${text}" - too many numbers`);
    return false;
  }

  return true;
};

export const extractInvestorName = (row: RawInvestorData): string => {
  console.log('Extracting investor name from row:', Object.keys(row));
  
  // Try all possible name field mappings
  const nameFields = FIELD_MAPPINGS.name;
  
  for (const fieldName of nameFields) {
    // Try exact match first
    if (row[fieldName] && row[fieldName].trim()) {
      const cleanedName = cleanText(row[fieldName].trim());
      if (cleanedName && isValidInvestorName(cleanedName)) {
        console.log(`Found valid name in field "${fieldName}":`, cleanedName);
        return cleanedName;
      }
    }
    
    // Try case-insensitive match
    const caseInsensitiveKey = Object.keys(row).find(key => 
      key.toLowerCase().trim() === fieldName.toLowerCase().trim()
    );
    if (caseInsensitiveKey && row[caseInsensitiveKey] && row[caseInsensitiveKey].trim()) {
      const cleanedName = cleanText(row[caseInsensitiveKey].trim());
      if (cleanedName && isValidInvestorName(cleanedName)) {
        console.log(`Found valid name in case-insensitive field "${caseInsensitiveKey}":`, cleanedName);
        return cleanedName;
      }
    }
  }
  
  // If no name field found, try first few columns that might contain names
  // But be more selective about what we consider a valid name
  const potentialNameColumns = Object.keys(row).slice(0, 3);
  for (const column of potentialNameColumns) {
    if (row[column] && row[column].trim()) {
      const value = row[column].trim();
      const cleanedName = cleanText(value);
      if (cleanedName && isValidInvestorName(cleanedName)) {
        console.log(`Using potential name from column "${column}":`, cleanedName);
        return cleanedName;
      }
    }
  }
  
  console.log('No valid name found, using fallback');
  return 'Unnamed Investor';
};
