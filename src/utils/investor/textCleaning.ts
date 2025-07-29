
// Enhanced text cleaning utilities for investor data processing

export const cleanText = (text: string | null): string | null => {
  if (!text) return null;
  
  return text
    .replace(/_/g, ' ')           // Replace underscores with spaces
    .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
    .replace(/^[-\s]+|[-\s]+$/g, '') // Remove leading/trailing dashes and spaces
    .trim();
};

export const cleanArray = (items: string[] | null): string[] | null => {
  if (!items) return null;
  
  return items
    .map(item => cleanText(item))
    .filter(item => item && item.length > 0)
    .map(item => item!); // Safe since we filtered out nulls
};
