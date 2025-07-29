
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { getSchemaForDealType, AllFormFields } from '../schemas/dealFormSchemas';
import { getDefaultValues } from '../utils/dealFormUtils';

export const useDealFormState = (dealType: 'capital' | 'sell' | 'crowdfunding') => {
  const form = useForm<AllFormFields>({
    resolver: zodResolver(getSchemaForDealType(dealType)),
    defaultValues: getDefaultValues(dealType)
  });

  useEffect(() => {
    form.reset(getDefaultValues(dealType));
  }, [dealType, form]);

  return { form };
};
