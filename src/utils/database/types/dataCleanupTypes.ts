
export interface InvestorDataIssue {
  id: string;
  name: string;
  issues: string[];
  suggestedFixes: any;
}

export interface CleanupResult {
  success: boolean;
  message: string;
  totalIssues?: number;
  fixedCount: number;
  errorCount?: number;
  issues?: InvestorDataIssue[];
  error?: any;
}

export interface DataQualityReport {
  totalInvestors: number;
  investorsWithIssues: number;
  issueTypes: Record<string, number>;
  issues: InvestorDataIssue[];
  error?: string;
}
