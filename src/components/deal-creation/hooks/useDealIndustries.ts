
import { useMemo } from 'react';
import { PREDEFINED_INDUSTRIES } from '@/data/industries';

export const useDealIndustries = () => {
  const industries = useMemo(() => {
    // Return only the predefined industries (no additional extraction from deals)
    return PREDEFINED_INDUSTRIES;
  }, []);

  return industries;
};
