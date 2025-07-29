import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthFlowMetrics {
  signupAttempts: number;
  signupSuccesses: number;
  signinAttempts: number;
  signinSuccesses: number;
  errorRate: number;
  lastError?: string;
  lastSuccess?: string;
}

interface AuthFlowEvent {
  type: 'signup' | 'signin' | 'error';
  success: boolean;
  error?: string;
  email?: string;
  timestamp: Date;
  userAgent?: string;
}

export const useAuthFlowMonitoring = () => {
  const [metrics, setMetrics] = useState<AuthFlowMetrics>({
    signupAttempts: 0,
    signupSuccesses: 0,
    signinAttempts: 0,
    signinSuccesses: 0,
    errorRate: 0
  });
  
  const [recentEvents, setRecentEvents] = useState<AuthFlowEvent[]>([]);

  const logAuthEvent = useCallback(async (event: Omit<AuthFlowEvent, 'timestamp'>) => {
    const fullEvent: AuthFlowEvent = {
      ...event,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    };
    
    // Log to console for development
    console.log('📊 Auth Flow Event:', fullEvent);
    
    // Update local metrics
    setMetrics(prev => {
      const updated = { ...prev };
      
      if (event.type === 'signup') {
        updated.signupAttempts++;
        if (event.success) updated.signupSuccesses++;
      } else if (event.type === 'signin') {
        updated.signinAttempts++;
        if (event.success) updated.signinSuccesses++;
      }
      
      const totalAttempts = updated.signupAttempts + updated.signinAttempts;
      const totalSuccesses = updated.signupSuccesses + updated.signinSuccesses;
      updated.errorRate = totalAttempts > 0 ? 
        ((totalAttempts - totalSuccesses) / totalAttempts) * 100 : 0;
      
      if (event.success) {
        updated.lastSuccess = new Date().toISOString();
      } else if (event.error) {
        updated.lastError = event.error;
      }
      
      return updated;
    });
    
    // Update recent events (keep last 50)
    setRecentEvents(prev => [fullEvent, ...prev].slice(0, 50));
    
    // Log to Supabase for persistence and analysis
    try {
      await supabase.rpc('log_signup_attempt_enhanced', {
        user_email: event.email || 'unknown',
        package_type: 'unknown', // This would need to be passed from the calling context
        success: event.success,
        error_message: event.error || null,
        ip_address: '0.0.0.0', // Would need to be determined on server side
        user_agent: navigator.userAgent,
        metadata: {
          event_type: event.type,
          timestamp: fullEvent.timestamp.toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to log auth event to database:', error);
    }
  }, []);

  const getHealthStatus = useCallback(() => {
    const { errorRate, signupAttempts, signinAttempts } = metrics;
    const totalAttempts = signupAttempts + signinAttempts;
    
    if (totalAttempts === 0) return 'unknown';
    if (errorRate < 10) return 'healthy';
    if (errorRate < 25) return 'warning';
    return 'critical';
  }, [metrics]);

  const getRecentErrors = useCallback((limit: number = 10) => {
    return recentEvents
      .filter(event => !event.success && event.error)
      .slice(0, limit);
  }, [recentEvents]);

  const getSuccessRate = useCallback((type?: 'signup' | 'signin') => {
    if (type === 'signup') {
      return metrics.signupAttempts > 0 ? 
        (metrics.signupSuccesses / metrics.signupAttempts) * 100 : 0;
    }
    if (type === 'signin') {
      return metrics.signinAttempts > 0 ? 
        (metrics.signinSuccesses / metrics.signinAttempts) * 100 : 0;
    }
    
    const totalAttempts = metrics.signupAttempts + metrics.signinAttempts;
    const totalSuccesses = metrics.signupSuccesses + metrics.signinSuccesses;
    return totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;
  }, [metrics]);

  return {
    metrics,
    recentEvents,
    logAuthEvent,
    getHealthStatus,
    getRecentErrors,
    getSuccessRate
  };
};
