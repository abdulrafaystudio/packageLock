
import { cleanText } from './textCleaning';

interface RawInvestorData {
  [key: string]: any;
}

export const mergeInvestorRows = (rows: RawInvestorData[]): RawInvestorData => {
  const merged: RawInvestorData = {};
  
  // Collect all non-empty values for each field
  const fieldArrays: { [key: string]: string[] } = {};
  
  rows.forEach(row => {
    Object.keys(row).forEach(key => {
      if (row[key] && row[key].trim()) {
        if (!fieldArrays[key]) {
          fieldArrays[key] = [];
        }
        const value = row[key].trim();
        if (!fieldArrays[key].includes(value)) {
          fieldArrays[key].push(value);
        }
      }
    });
  });
  
  // For most fields, take the first value. For contact info, combine all unique values
  Object.keys(fieldArrays).forEach(key => {
    const values = fieldArrays[key];
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('email') || lowerKey.includes('phone') || lowerKey.includes('contact')) {
      merged[key] = values.join(', ');
    } else {
      merged[key] = values[0]; // Take first non-empty value
    }
  });
  
  return merged;
};
