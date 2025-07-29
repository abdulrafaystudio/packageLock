
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthFlowMonitoring } from './useAuthFlowMonitoring';

interface SystemHealthMetrics {
  authHealthScore: number;
  databaseHealthScore: number;
  overallHealthScore: number;
  lastHealthCheck: Date | null;
  isChecking: boolean;
  criticalIssues: string[];
  warnings: string[];
}

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  message: string;
  details?: any;
}

export const useSystemHealth = () => {
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics>({
    authHealthScore: 0,
    databaseHealthScore: 0,
    overallHealthScore: 0,
    lastHealthCheck: null,
    isChecking: false,
    criticalIssues: [],
    warnings: []
  });

  const { toast } = useToast();
  const { getHealthStatus, getSuccessRate, getRecentErrors } = useAuthFlowMonitoring();

  const performHealthCheck = useCallback(async (): Promise<HealthCheckResult[]> => {
    console.log('🏥 Starting comprehensive system health check');
    const results: HealthCheckResult[] = [];

    // Auth System Health Check
    try {
      const authStatus = getHealthStatus();
      const authSuccessRate = getSuccessRate();
      const recentErrors = getRecentErrors(5);
      
      let authScore = 100;
      let authMessage = 'Authentication system is healthy';
      
      if (authStatus === 'critical') {
        authScore = 20;
        authMessage = `Critical: High error rate (${100 - authSuccessRate}%)`;
      } else if (authStatus === 'warning') {
        authScore = 60;
        authMessage = `Warning: Elevated error rate (${100 - authSuccessRate}%)`;
      } else if (recentErrors.length > 0) {
        authScore = 80;
        authMessage = `Minor issues detected (${recentErrors.length} recent errors)`;
      }
      
      results.push({
        component: 'Authentication',
        status: authStatus === 'critical' ? 'critical' : 
                authStatus === 'warning' ? 'warning' : 'healthy',
        score: authScore,
        message: authMessage,
        details: { successRate: authSuccessRate, recentErrors: recentErrors.length }
      });
    } catch (error) {
      results.push({
        component: 'Authentication',
        status: 'critical',
        score: 0,
        message: 'Failed to check auth system health',
        details: { error: error.message }
      });
    }

    // Database Health Check
    try {
      const dbStart = Date.now();
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStart;
      
      if (testError) {
        results.push({
          component: 'Database',
          status: 'critical',
          score: 0,
          message: `Database connection failed: ${testError.message}`,
          details: { error: testError.message }
        });
      } else {
        let dbScore = 100;
        let dbMessage = 'Database is healthy';
        let dbStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
        
        if (dbResponseTime > 5000) {
          dbScore = 30;
          dbMessage = `Critical: Very slow response (${dbResponseTime}ms)`;
          dbStatus = 'critical';
        } else if (dbResponseTime > 2000) {
          dbScore = 70;
          dbMessage = `Warning: Slow response (${dbResponseTime}ms)`;
          dbStatus = 'warning';
        } else if (dbResponseTime > 1000) {
          dbScore = 85;
          dbMessage = `Good: Response time ${dbResponseTime}ms`;
        }
        
        results.push({
          component: 'Database',
          status: dbStatus,
          score: dbScore,
          message: dbMessage,
          details: { responseTime: dbResponseTime }
        });
      }
    } catch (error) {
      results.push({
        component: 'Database',
        status: 'critical',
        score: 0,
        message: 'Database health check failed',
        details: { error: error.message }
      });
    }

    // Data Consistency Check
    try {
      const { data: consistencyData, error: consistencyError } = await supabase
        .rpc('validate_subscription_sync');
      
      if (consistencyError) {
        results.push({
          component: 'Data Consistency',
          status: 'warning',
          score: 60,
          message: 'Unable to validate data consistency',
          details: { error: consistencyError.message }
        });
      } else {
        const inconsistencies = consistencyData || [];
        let consistencyScore = 100;
        let consistencyMessage = 'Data is consistent';
        let consistencyStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
        
        if (inconsistencies.length > 10) {
          consistencyScore = 40;
          consistencyMessage = `Critical: ${inconsistencies.length} data inconsistencies`;
          consistencyStatus = 'critical';
        } else if (inconsistencies.length > 0) {
          consistencyScore = 75;
          consistencyMessage = `Warning: ${inconsistencies.length} minor inconsistencies`;
          consistencyStatus = 'warning';
        }
        
        results.push({
          component: 'Data Consistency',
          status: consistencyStatus,
          score: consistencyScore,
          message: consistencyMessage,
          details: { inconsistencies: inconsistencies.length }
        });
      }
    } catch (error) {
      results.push({
        component: 'Data Consistency',
        status: 'warning',
        score: 70,
        message: 'Consistency check unavailable',
        details: { error: error.message }
      });
    }

    return results;
  }, [getHealthStatus, getSuccessRate, getRecentErrors]);

  const runHealthCheck = useCallback(async () => {
    setHealthMetrics(prev => ({ ...prev, isChecking: true }));
    
    try {
      const results = await performHealthCheck();
      
      // Calculate scores
      const authResult = results.find(r => r.component === 'Authentication');
      const dbResult = results.find(r => r.component === 'Database');
      const authScore = authResult?.score || 0;
      const dbScore = dbResult?.score || 0;
      const overallScore = Math.round((authScore + dbScore) / 2);
      
      // Collect issues
      const criticalIssues = results
        .filter(r => r.status === 'critical')
        .map(r => `${r.component}: ${r.message}`);
      
      const warnings = results
        .filter(r => r.status === 'warning')
        .map(r => `${r.component}: ${r.message}`);
      
      setHealthMetrics({
        authHealthScore: authScore,
        databaseHealthScore: dbScore,
        overallHealthScore: overallScore,
        lastHealthCheck: new Date(),
        isChecking: false,
        criticalIssues,
        warnings
      });
      
      // Show notification for critical issues
      if (criticalIssues.length > 0) {
        toast({
          title: "Critical System Issues Detected",
          description: `${criticalIssues.length} critical issues found. Check system health dashboard.`,
          variant: "destructive"
        });
      }
      
      console.log('🏥 Health check completed:', {
        overallScore,
        criticalIssues: criticalIssues.length,
        warnings: warnings.length,
        results
      });
      
    } catch (error) {
      console.error('💥 Health check failed:', error);
      
      setHealthMetrics(prev => ({
        ...prev,
        isChecking: false,
        criticalIssues: ['Health check system failure']
      }));
      
      toast({
        title: "Health Check Failed",
        description: "Unable to assess system health. Please check manually.",
        variant: "destructive"
      });
    }
  }, [performHealthCheck, toast]);

  const fixDataInconsistencies = useCallback(async () => {
    try {
      console.log('🔧 Starting automated data consistency fixes');
      
      const { data: fixResult, error: fixError } = await supabase
        .rpc('reconcile_subscription_data');
      
      if (fixError) {
        throw new Error(fixError.message);
      }
      
      console.log('✅ Data consistency fixes applied:', fixResult);
      
      toast({
        title: "Data Consistency Fixed",
        description: "Automated fixes have been applied to resolve data inconsistencies.",
      });
      
      // Re-run health check to verify fixes
      await runHealthCheck();
      
    } catch (error: any) {
      console.error('💥 Failed to fix data inconsistencies:', error);
      
      toast({
        title: "Fix Failed",
        description: error.message || "Unable to apply automated fixes. Manual intervention may be required.",
        variant: "destructive"
      });
    }
  }, [toast, runHealthCheck]);

  // Auto health check on mount and periodic checks
  useEffect(() => {
    runHealthCheck();
    
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [runHealthCheck]);

  return {
    healthMetrics,
    runHealthCheck,
    fixDataInconsistencies,
    isHealthy: healthMetrics.overallHealthScore >= 80,
    hasWarnings: healthMetrics.warnings.length > 0,
    hasCriticalIssues: healthMetrics.criticalIssues.length > 0
  };
};
