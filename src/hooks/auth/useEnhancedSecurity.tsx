
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  valid: boolean;
  status?: string;
  error?: string;
  message?: string;
  subscription_tier?: string;
  subscription_end?: string;
  grace_period_end?: string;
  current_tier?: string;
  required_tier?: string;
}

export interface SyncValidationResult {
  user_id: string;
  email: string;
  issue_type: string;
  profiles_status: string;
  subscribers_status: string;
  recommended_action: string;
}

export const useEnhancedSecurity = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);

  const validateUserPermissions = useCallback(async (
    userId?: string, 
    requiredTier: string = 'free'
  ): Promise<ValidationResult> => {
    try {
      setIsValidating(true);
      console.log('🔐 Validating user permissions:', { userId, requiredTier });

      const { data, error } = await supabase.rpc('validate_user_permissions', {
        check_user_id: userId || undefined,
        required_tier: requiredTier
      });

      if (error) {
        console.error('❌ Permission validation error:', error);
        throw error;
      }

      // Properly type the result with type assertion and validation
      const result = data as unknown as ValidationResult;
      
      // Validate the result structure
      if (!result || typeof result !== 'object' || !('valid' in result)) {
        throw new Error('Invalid validation result structure');
      }
      
      setLastValidation(result);
      
      console.log('✅ Permission validation result:', result);
      return result;
      
    } catch (error: any) {
      console.error('💥 Error validating permissions:', error);
      const errorResult: ValidationResult = {
        valid: false,
        error: 'validation_failed',
        message: error.message || 'Permission validation failed'
      };
      setLastValidation(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateSubscriptionSync = useCallback(async (): Promise<SyncValidationResult[]> => {
    try {
      console.log('🔄 Validating subscription sync...');

      const { data, error } = await supabase.rpc('validate_subscription_sync');

      if (error) {
        console.error('❌ Sync validation error:', error);
        throw error;
      }

      console.log('✅ Sync validation completed:', data?.length || 0, 'issues found');
      return data || [];
      
    } catch (error: any) {
      console.error('💥 Error validating sync:', error);
      throw error;
    }
  }, []);

  const reconcileSubscriptionData = useCallback(async () => {
    try {
      console.log('🔧 Reconciling subscription data...');

      const { data, error } = await supabase.rpc('reconcile_subscription_data');

      if (error) {
        console.error('❌ Reconciliation error:', error);
        throw error;
      }

      console.log('✅ Reconciliation completed:', data);
      return data;
      
    } catch (error: any) {
      console.error('💥 Error reconciling data:', error);
      throw error;
    }
  }, []);

  const logSecurityEvent = useCallback(async (
    actionType: 'sync' | 'reconcile' | 'validation_failed' | 'webhook_processed' | 'manual_update',
    details: any,
    errorDetails?: string
  ) => {
    try {
      const { error } = await supabase
        .from('subscription_audit')
        .insert({
          action_type: actionType,
          new_values: details,
          source: 'client',
          error_details: errorDetails
        });

      if (error) {
        console.warn('⚠️ Failed to log security event:', error);
      }
    } catch (error) {
      console.warn('⚠️ Error logging security event:', error);
    }
  }, []);

  return {
    validateUserPermissions,
    validateSubscriptionSync,
    reconcileSubscriptionData,
    logSecurityEvent,
    isValidating,
    lastValidation
  };
};
