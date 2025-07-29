
import { FIELD_MAPPINGS } from './fieldMappings';

interface RawInvestorData {
  [key: string]: any;
}

export const mapToInvestorProfile = (name: string, data: RawInvestorData): any => {
  console.log('=== PROCESSING INVESTOR:', name, '===');
  console.log('Available columns:', Object.keys(data));
  
  // Simple field finder using exact column names only
  const findValue = (fieldKey: string): string | null => {
    const possibleNames = FIELD_MAPPINGS[fieldKey as keyof typeof FIELD_MAPPINGS] || [];
    
    // Try exact matches only - no transformations
    for (const fieldName of possibleNames) {
      if (data[fieldName] && typeof data[fieldName] === 'string' && data[fieldName].trim()) {
        const value = data[fieldName].trim();
        console.log(`✓ Found exact match for "${fieldKey}" in column "${fieldName}":`, value);
        return value;
      }
    }
    
    console.log(`✗ No data found for: ${fieldKey}`);
    return null;
  };

  try {
    // Get all field values using exact column names
    const website = findValue('website');
    const description = findValue('description');
    const verticals = findValue('verticals');
    const sectors = findValue('sectors');
    const preferredInvestmentTypes = findValue('preferred_investment_types');
    const geography = findValue('preferred_geography');
    const country = findValue('country');
    const type = findValue('type');
    const contactName = findValue('contact_name');
    const email = findValue('email');
    const phone = findValue('phone');
    const role = findValue('role');

    const profile = {
      investor_name: name,
      website: website,
      description: description,
      verticals: verticals,
      sectors: sectors,
      preferred_investment_types: preferredInvestmentTypes,
      preferred_geographical_areas: geography,
      country: country,
      type: type,
      contact_name: contactName,
      email: email,
      phone: phone,
      role: role
    };

    console.log('Final mapped profile for', name, ':', profile);
    return profile;
    
  } catch (error) {
    console.error('Error mapping investor profile for:', name, error);
    return null;
  }
};
