
// Utility function to clean text by replacing underscores with spaces
export const cleanText = (text: string | null | undefined): string | null => {
  if (!text) return null;
  return text.replace(/_/g, ' ');
};

// Utility function to clean array items by replacing underscores with spaces
export const cleanArray = (items: string[] | null | undefined): string[] | null => {
  if (!items) return null;
  return items.map(item => cleanText(item) || item);
};
