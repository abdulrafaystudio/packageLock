
import { supabase } from '@/integrations/supabase/client';

export const getDealOwnerProfile = async (dealUserId: string) => {
  console.log('Fetching deal owner profile...');
  const { data: ownerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', dealUserId)
    .maybeSingle();

  console.log('Profile query result:', { 
    ownerProfile, 
    profileError,
    hasProfile: !!ownerProfile 
  });

  if (profileError) {
    console.error('Profile query error:', profileError);
    if (profileError.code === 'PGRST116') {
      throw new Error('Multiple profiles found for this company owner. Please contact support.');
    }
    throw new Error('Unable to access company contact information. This may be a permissions issue.');
  }

  if (!ownerProfile) {
    console.error('No profile found for deal owner:', dealUserId);
    throw new Error('Company owner profile not found. The company owner may need to complete their profile setup.');
  }

  return ownerProfile;
};
