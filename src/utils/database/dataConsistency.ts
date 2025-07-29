
import { supabase } from '@/integrations/supabase/client';

export const validateDataConsistency = async () => {
  console.log('🔍 Starting data consistency validation...');
  
  try {
    // Check for users with missing subscriber records
    const { data: validationResults, error } = await supabase.rpc('validate_subscription_sync');
    
    if (error) {
      console.error('❌ Data validation error:', error);
      throw error;
    }
    
    console.log('📊 Validation results:', validationResults);
    
    return {
      success: true,
      issues: validationResults || [],
      message: `Found ${validationResults?.length || 0} data consistency issues`
    };
    
  } catch (error) {
    console.error('💥 Data consistency validation failed:', error);
    return {
      success: false,
      issues: [],
      message: `Validation failed: ${error}`
    };
  }
};

export const reconcileSubscriptionData = async () => {
  console.log('🔧 Starting subscription data reconciliation...');
  
  try {
    const { data: reconciliationResult, error } = await supabase.rpc('reconcile_subscription_data');
    
    if (error) {
      console.error('❌ Reconciliation error:', error);
      throw error;
    }
    
    console.log('✅ Reconciliation completed:', reconciliationResult);
    
    return {
      success: true,
      result: reconciliationResult,
      message: 'Data reconciliation completed successfully'
    };
    
  } catch (error) {
    console.error('💥 Data reconciliation failed:', error);
    return {
      success: false,
      result: null,
      message: `Reconciliation failed: ${error}`
    };
  }
};

export const validatePackageTypes = async () => {
  console.log('🔍 Validating package type consistency...');
  
  try {
    // Test package type enum values
    const { data: enumTest, error: enumError } = await supabase.rpc('test_package_type_enum');
    
    if (enumError) {
      console.error('❌ Package type enum test failed:', enumError);
      throw enumError;
    }
    
    // Test profiles table access
    const { data: profileTest, error: profileError } = await supabase.rpc('test_profiles_table_access');
    
    if (profileError) {
      console.error('❌ Profiles table test failed:', profileError);
      throw profileError;
    }
    
    console.log('✅ Package type validation completed');
    
    return {
      success: true,
      enumTest,
      profileTest,
      message: 'Package type validation completed successfully'
    };
    
  } catch (error) {
    console.error('💥 Package type validation failed:', error);
    return {
      success: false,
      enumTest: null,
      profileTest: null,
      message: `Validation failed: ${error}`
    };
  }
};
