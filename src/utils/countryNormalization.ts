import { Investor } from '@/hooks/investors/types';

export const extractCountriesFromInvestors = (investors: Investor[]): string[] => {
  if (!investors) return [];
  const countries = new Set<string>();
  investors.forEach(investor => {
    if (investor.country) {
      const countryName = investor.country.trim();
      if (countryName) {
        countries.add(countryName);
      }
    }
  });
  return Array.from(countries).sort();
};

// This function was imported but not used, keeping it here as a placeholder.
export const normalizeCountryName = (name: string): string => {
    return name;
}
