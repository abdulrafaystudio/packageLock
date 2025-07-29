
import { supabase } from '@/integrations/supabase/client';
import { analyzeInvestorData } from '../analysis/dataIssueAnalyzer';
import { DataQualityReport, InvestorDataIssue } from '../types/dataCleanupTypes';

// Function to get data quality report without making changes
export const getDataQualityReport = async (): Promise<DataQualityReport> => {
  const { data: investors, error } = await supabase
    .from('investors')
    .select('*');

  if (error || !investors) {
    return { 
      error: 'Failed to fetch investors',
      totalInvestors: 0,
      investorsWithIssues: 0,
      issueTypes: {},
      issues: []
    };
  }

  const issues: InvestorDataIssue[] = [];
  
  for (const investor of investors) {
    const issue = analyzeInvestorData(investor);
    if (issue) {
      issues.push(issue);
    }
  }

  return {
    totalInvestors: investors.length,
    investorsWithIssues: issues.length,
    issueTypes: issues.reduce((acc: any, issue) => {
      issue.issues.forEach(issueType => {
        acc[issueType] = (acc[issueType] || 0) + 1;
      });
      return acc;
    }, {}),
    issues: issues.slice(0, 20) // Return first 20 for review
  };
};
