
import { InvestorDataIssue } from '../types/dataCleanupTypes';

// Function to detect and fix data quality issues
export const analyzeInvestorData = (investor: any): InvestorDataIssue | null => {
  const issues: string[] = [];
  const suggestedFixes: any = {};

  // Check for corrupted names
  if (investor.name?.includes('.,') || investor.name?.match(/^\d+\./) || investor.name?.includes('RESEARCH AND CONSULTING SERVICES')) {
    issues.push('Corrupted name format');
    // Try to extract meaningful name or mark for manual review
    if (investor.company_name && investor.company_name !== investor.name) {
      suggestedFixes.name = investor.company_name;
    } else {
      suggestedFixes.name = 'Data Review Required';
    }
  }

  // Check for mixed data in location field
  if (investor.location?.includes('@') || investor.location?.includes(',Managing Director') || investor.location?.includes('VENTURE CAPITAL,')) {
    issues.push('Mixed data in location field');
    // Extract just the country/location part
    const locationParts = investor.location.split(',');
    const possibleLocation = locationParts.find((part: string) => 
      part.includes('United States') || part.includes('Europe') || part.includes('Asia') || 
      part.includes('America') || part.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    );
    suggestedFixes.location = possibleLocation || 'Location Not Specified';
  }

  // Check for investment amounts in website field
  if (investor.website?.includes('$') || investor.website?.match(/^\d+\s*-\s*\$?\d+/)) {
    issues.push('Investment amount in website field');
    suggestedFixes.website = null;
  }

  // Check for email addresses in wrong fields
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (investor.location?.match(emailPattern)) {
    issues.push('Email in location field');
    const emails = investor.location.match(emailPattern);
    if (!investor.email && emails) {
      suggestedFixes.email = emails[0];
    }
  }

  // Check for phone numbers in wrong fields
  const phonePattern = /\d{10,}/;
  if (investor.location?.match(phonePattern)) {
    issues.push('Phone in location field');
    const phones = investor.location.match(phonePattern);
    if (!investor.phone && phones) {
      suggestedFixes.phone = phones[0];
    }
  }

  // Check for role information mixed in contact data
  if (investor.key_contacts && Array.isArray(investor.key_contacts)) {
    investor.key_contacts.forEach((contact: any, index: number) => {
      if (contact.name === 'Managing Director' && !contact.email && !contact.phone) {
        issues.push(`Contact ${index} has only role, no actual contact info`);
        suggestedFixes[`key_contacts_${index}_remove`] = true;
      }
    });
  }

  return issues.length > 0 ? {
    id: investor.id,
    name: investor.name,
    issues,
    suggestedFixes
  } : null;
};
