
/**
 * Formats phone numbers, converting scientific notation to regular numbers
 * @param phoneNumber - The phone number string that may contain scientific notation
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || !phoneNumber.trim()) {
    return phoneNumber;
  }

  const trimmedPhone = phoneNumber.trim();
  
  // Check if the phone number is in scientific notation (contains E+ or e+)
  if (trimmedPhone.includes('E+') || trimmedPhone.includes('e+')) {
    try {
      // Convert scientific notation to regular number
      const numericValue = parseFloat(trimmedPhone);
      if (!isNaN(numericValue)) {
        // Convert to string without scientific notation
        return numericValue.toFixed(0);
      }
    } catch (error) {
      console.warn('Error converting scientific notation phone number:', trimmedPhone, error);
      return trimmedPhone;
    }
  }

  // Return the phone number as-is if it's not in scientific notation
  return trimmedPhone;
};

/**
 * Formats a comma-separated list of phone numbers
 * @param phoneNumbers - Comma-separated phone numbers string
 * @returns Formatted comma-separated phone numbers string
 */
export const formatPhoneNumberList = (phoneNumbers: string): string => {
  if (!phoneNumbers || !phoneNumbers.trim()) {
    return phoneNumbers;
  }

  return phoneNumbers
    .split(',')
    .map(phone => formatPhoneNumber(phone))
    .join(', ');
};
