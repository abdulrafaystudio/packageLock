
// Helper function to extract industries from deals
export const extractIndustriesFromDeals = (deals: any[]): string[] => {
  const industriesSet = new Set<string>();
  
  deals.forEach(deal => {
    if (deal.industry && deal.industry.trim()) {
      // Clean up the industry name by removing underscores and converting to proper case
      const cleanIndustry = deal.industry.replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      industriesSet.add(cleanIndustry);
    }
    
    // Also include custom industries
    if (deal.custom_industry && deal.custom_industry.trim()) {
      const cleanCustomIndustry = deal.custom_industry.replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      industriesSet.add(cleanCustomIndustry);
    }
  });
  
  return Array.from(industriesSet).sort();
};
