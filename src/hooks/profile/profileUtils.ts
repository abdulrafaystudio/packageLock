
import { User } from '@supabase/supabase-js';
import { PersonalInfo } from './types';

export const getPersonalInfoFromUser = (user: User): PersonalInfo => {
  return {
    fullName: user.user_metadata?.full_name || '',
    email: user.email || '',
    companyName: user.user_metadata?.company_name || '',
    packageType: (user.user_metadata?.package_type as any) || 'free'
  };
};
