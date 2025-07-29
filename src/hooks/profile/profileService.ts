
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { PersonalInfo } from './types';
import { getPersonalInfoFromUser } from './profileUtils';

export const loadProfileFromDatabase = async (user: User): Promise<PersonalInfo | null> => {
  try {
    console.log('🔍 Loading profile from database for user:', user.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('❌ Profile loading error:', error);
      return null;
    }

    if (data) {
      console.log('✅ Profile data loaded from database');
      return {
        fullName: data.full_name || '',
        email: user.email || '',
        companyName: data.company_name || '',
        packageType: data.package_type || 'free'
      };
    }

    return null;
  } catch (error) {
    console.error('💥 Error in loadProfileFromDatabase:', error);
    return null;
  }
};

export const createDefaultProfile = async (user: User): Promise<PersonalInfo> => {
  try {
    console.log('🔨 Creating default profile for user:', user.id);
    
    const profileData = {
      id: user.id,
      full_name: user.user_metadata?.full_name || '',
      company_name: user.user_metadata?.company_name || '',
      package_type: (user.user_metadata?.package_type as any) || 'free',
      email: user.email || '',
      email_verified: true,
      is_active: true,
      signup_source: 'web_form',
      subscription_status: 'active' as const,
      subscription_start_date: new Date().toISOString(),
      phone: null,
      last_login: null,
      grace_period_end: null,
      pending_downgrade_to: null,
      pending_downgrade_date: null,
      subscription_end_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .insert(profileData);

    if (error) {
      console.error('❌ Error creating default profile:', error);
      // Return auth data as fallback
      return getPersonalInfoFromUser(user);
    }

    console.log('✅ Default profile created successfully');
    
    return {
      fullName: profileData.full_name,
      email: profileData.email,
      companyName: profileData.company_name,
      packageType: profileData.package_type
    };
  } catch (error) {
    console.error('💥 Failed to create default profile:', error);
    // Return auth data as fallback
    return getPersonalInfoFromUser(user);
  }
};

export const saveProfileToDatabase = async (user: User, personalInfo: PersonalInfo): Promise<void> => {
  console.log('💾 Saving profile data:', personalInfo);
  
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: personalInfo.fullName,
      company_name: personalInfo.companyName,
      package_type: personalInfo.packageType as any,
      email: personalInfo.email,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Profile save error:', error);
    throw error;
  }

  console.log('✅ Profile saved successfully');
};
