
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Investor } from '@/hooks/useInvestors';

interface InvestorProfileInvestmentDetailsProps {
  investor: Investor;
}

const InvestorProfileInvestmentDetails = ({ investor }: InvestorProfileInvestmentDetailsProps) => {
  // Since the simplified schema doesn't include investment details, this component will not render
  return null;
};

export default InvestorProfileInvestmentDetails;
