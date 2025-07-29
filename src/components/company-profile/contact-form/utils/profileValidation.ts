
// Validate that a profile has complete contact information
export const validateProfileCompleteness = (profile: any): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  if (!profile.email || !profile.email.trim()) {
    missingFields.push('email');
  }
  
  if (!profile.full_name || !profile.full_name.trim()) {
    missingFields.push('name');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};
