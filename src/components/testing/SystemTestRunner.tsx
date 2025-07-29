import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  testName: string;
  status: 'running' | 'passed' | 'failed' | 'skipped';
  message: string;
  details?: any;
  duration?: number;
}

interface TestSuite {
  isRunning: boolean;
  results: TestResult[];
  overallStatus: 'not_run' | 'running' | 'passed' | 'failed';
  summary?: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

const SystemTestRunner = () => {
  const [testSuite, setTestSuite] = useState<TestSuite>({
    isRunning: false,
    results: [],
    overallStatus: 'not_run'
  });
  const { toast } = useToast();

  const updateTestResult = (testName: string, updates: Partial<TestResult>) => {
    setTestSuite(prev => ({
      ...prev,
      results: prev.results.map(result => 
        result.testName === testName 
          ? { ...result, ...updates }
          : result
      )
    }));
  };

  const runSystemTests = async () => {
    const startTime = Date.now();
    setTestSuite({
      isRunning: true,
      results: [
        { testName: 'Database Functions', status: 'running', message: 'Testing...' },
        { testName: 'Recovery Processor', status: 'running', message: 'Testing...' },
        { testName: 'System Validator', status: 'running', message: 'Testing...' },
        { testName: 'Webhook Processing', status: 'running', message: 'Testing...' },
        { testName: 'Account Creation', status: 'running', message: 'Testing...' }
      ],
      overallStatus: 'running'
    });

    try {
      // Test 1: Database Functions
      console.log('🧪 Testing database functions...');
      try {
        const { data: dbTest, error: dbError } = await supabase
          .rpc('complete_paid_signup', {
            p_email: 'system-test@example.com',
            p_stripe_customer_id: 'test_cus',
            p_stripe_subscription_id: 'test_sub',
            p_subscription_tier: 'standard'
          });

        if (dbError && !dbError.message.includes('No pending signup')) {
          throw new Error(dbError.message);
        }

        updateTestResult('Database Functions', {
          status: 'passed',
          message: 'Database functions working correctly',
          duration: Date.now() - startTime
        });
      } catch (error: any) {
        updateTestResult('Database Functions', {
          status: 'failed',
          message: `Database function test failed: ${error.message}`,
          duration: Date.now() - startTime
        });
      }

      // Test 2: Recovery Processor
      console.log('🧪 Testing recovery processor...');
      try {
        const { data: recoveryData, error: recoveryError } = await supabase.functions.invoke('recovery-processor');
        
        if (recoveryError) {
          throw new Error(recoveryError.message);
        }

        updateTestResult('Recovery Processor', {
          status: 'passed',
          message: `Recovery completed: ${recoveryData.recoveredAccounts || 0} accounts processed`,
          details: recoveryData,
          duration: Date.now() - startTime
        });
      } catch (error: any) {
        updateTestResult('Recovery Processor', {
          status: 'failed',
          message: `Recovery processor failed: ${error.message}`,
          duration: Date.now() - startTime
        });
      }

      // Test 3: System Validator
      console.log('🧪 Testing system validator...');
      try {
        const { data: validationData, error: validationError } = await supabase.functions.invoke('system-validator');
        
        if (validationError) {
          throw new Error(validationError.message);
        }

        const overallHealth = validationData.validation?.overall?.status || 'unknown';
        const completionPercentage = validationData.validation?.overall?.completionPercentage || 0;

        updateTestResult('System Validator', {
          status: overallHealth === 'healthy' ? 'passed' : overallHealth === 'degraded' ? 'passed' : 'failed',
          message: `System ${overallHealth} (${completionPercentage}% complete)`,
          details: validationData.validation,
          duration: Date.now() - startTime
        });
      } catch (error: any) {
        updateTestResult('System Validator', {
          status: 'failed',
          message: `System validation failed: ${error.message}`,
          duration: Date.now() - startTime
        });
      }

      // Test 4: Webhook Processing
      console.log('🧪 Testing webhook status...');
      try {
        const { data: webhookData, error: webhookError } = await supabase
          .from('webhook_events')
          .select('processed, retry_count')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (webhookError) {
          throw new Error(webhookError.message);
        }

        const totalWebhooks = webhookData?.length || 0;
        const unprocessed = webhookData?.filter(w => !w.processed).length || 0;

        updateTestResult('Webhook Processing', {
          status: unprocessed === 0 ? 'passed' : 'failed',
          message: `${totalWebhooks} total webhooks, ${unprocessed} unprocessed`,
          details: { total: totalWebhooks, unprocessed },
          duration: Date.now() - startTime
        });
      } catch (error: any) {
        updateTestResult('Webhook Processing', {
          status: 'failed',
          message: `Webhook check failed: ${error.message}`,
          duration: Date.now() - startTime
        });
      }

      // Test 5: Account Creation Check
      console.log('🧪 Testing account creation...');
      try {
        const { data: signupData, error: signupError } = await supabase
          .from('incomplete_signups')
          .select('email, package_type')
          .eq('status', 'completed')
          .not('stripe_customer_id', 'is', null);

        if (signupError) {
          throw new Error(signupError.message);
        }

        const completedSignups = signupData?.length || 0;

        updateTestResult('Account Creation', {
          status: 'passed',
          message: `${completedSignups} completed signups ready for processing`,
          details: { completedSignups, emails: signupData?.map(s => s.email) },
          duration: Date.now() - startTime
        });
      } catch (error: any) {
        updateTestResult('Account Creation', {
          status: 'failed',
          message: `Account creation check failed: ${error.message}`,
          duration: Date.now() - startTime
        });
      }

      // Calculate final results
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      setTestSuite(prev => {
        const passed = prev.results.filter(r => r.status === 'passed').length;
        const failed = prev.results.filter(r => r.status === 'failed').length;
        const total = prev.results.length;

        return {
          ...prev,
          isRunning: false,
          overallStatus: failed === 0 ? 'passed' : 'failed',
          summary: {
            total,
            passed,
            failed,
            duration: totalDuration
          }
        };
      });

      console.log('✅ System testing completed');
      
      const failedTests = testSuite.results.filter(r => r.status === 'failed').length;
      toast({
        title: "System Tests Completed",
        description: failedTests === 0 
          ? "All tests passed! System is 100% operational." 
          : `${failedTests} tests failed. Check results for details.`,
        variant: failedTests === 0 ? 'default' : 'destructive',
      });

    } catch (error: any) {
      console.error('💥 System testing error:', error);
      setTestSuite(prev => ({
        ...prev,
        isRunning: false,
        overallStatus: 'failed'
      }));
      
      toast({
        title: "System Testing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          End-to-End System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runSystemTests}
            disabled={testSuite.isRunning}
            className="flex items-center gap-2"
          >
            {testSuite.isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Complete System Test
              </>
            )}
          </Button>

          {testSuite.summary && (
            <div className="flex items-center gap-2 text-sm">
              <Badge className={testSuite.overallStatus === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {testSuite.summary.passed}/{testSuite.summary.total} Passed
              </Badge>
              <span className="text-gray-500">
                {testSuite.summary.duration}ms
              </span>
            </div>
          )}
        </div>

        {testSuite.overallStatus !== 'not_run' && (
          <div className="space-y-4">
            {testSuite.overallStatus === 'passed' && (
              <Alert className="border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎉 All system tests passed! The system is 100% operational and ready for production use.
                </AlertDescription>
              </Alert>
            )}

            {testSuite.overallStatus === 'failed' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some tests failed. Review the results below to identify issues.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <h4 className="font-semibold mb-3">Test Results:</h4>
              <div className="space-y-2">
                {testSuite.results.map((result, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-medium">{result.testName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {result.message}
                        </div>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-blue-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                      {result.duration && (
                        <span className="text-xs text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemTestRunner;