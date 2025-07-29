
export interface Investor {
  id: string;
  investor_name: string;
  website?: string;
  description?: string;
  verticals?: string;
  sectors?: string;
  preferred_investment_types?: string;
  preferred_geographical_areas?: string;
  country?: string;
  type?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface UseInvestorsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  selectedCountry?: string;
  selectedInvestorType?: string;
  selectedIndustry?: string;
}

export interface UseInvestorsResult {
  investors: Investor[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
