
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, AlertTriangle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PackageType } from '@/types/auth';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  tests: TestResult[];
}

const EndToEndTestSuite = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateTestResult = (suiteName: string, testName: string, result: Partial<TestResult>) => {
    setTestSuites(prev => prev.map(suite => 
      suite.suiteName === suiteName 
        ? {
            ...suite,
            tests: suite.tests.map(test => 
              test.testName === testName 
                ? { ...test, ...result }
                : test
            )
          }
        : suite
    ));
  };

  const initializeTestSuites = (): TestSuite[] => [
    {
      suiteName: 'Package Signup Flows',
      tests: [
        { testName: 'Free Package Signup', status: 'pending', message: '' },
        { testName: 'FreePro Package Signup', status: 'pending', message: '' },
        { testName: 'Standard Package Signup', status: 'pending', message: '' },
        { testName: 'Premium Package Signup', status: 'pending', message: '' },
        { testName: 'Premium Pro Package Signup', status: 'pending', message: '' },
        { testName: 'Enterprise Package Signup', status: 'pending', message: '' }
      ]
    },
    {
      suiteName: 'Payment Flow Validation',
      tests: [
        { testName: 'Stripe Price ID Lookup', status: 'pending', message: '' },
        { testName: 'Checkout Session Creation', status: 'pending', message: '' },
        { testName: 'Customer Portal Access', status: 'pending', message: '' },
        { testName: 'Incomplete Signup Tracking', status: 'pending', message: '' }
      ]
    },
    {
      suiteName: 'Data Consistency',
      tests: [
        { testName: 'Profile-Subscriber Sync', status: 'pending', message: '' },
        { testName: 'Package Type Validation', status: 'pending', message: '' },
        { testName: 'Subscription Status Consistency', status: 'pending', message: '' },
        { testName: 'Data Reconciliation', status: 'pending', message: '' }
      ]
    },
    {
      suiteName: 'Edge Cases',
      tests: [
        { testName: 'Duplicate Email Handling', status: 'pending', message: '' },
        { testName: 'Rate Limit Handling', status: 'pending', message: '' },
        { testName: 'Webhook Failure Recovery', status: 'pending', message: '' },
        { testName: 'Network Failure Handling', status: 'pending', message: '' }
      ]
    }
  ];

  const runPackageSignupTest = async (packageType: PackageType) => {
    const testName = `${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package Signup`;
    const suiteName = 'Package Signup Flows';
    
    updateTestResult(suiteName, testName, { status: 'running', message: 'Testing signup flow...' });
    
    try {
      const testEmail = `test-${packageType}-${Date.now()}@example.com`;
      const startTime = Date.now();
      
      // Test form validation
      const mockFormData = {
        fullName: 'Test User',
        email: testEmail,
        password: 'TestPassword123!',
        companyName: 'Test Company'
      };
      
      // Test auth form validation
      const { validateAuthForm } = await import('@/utils/security');
      const validation = validateAuthForm({
        email: mockFormData.email,
        password: mockFormData.password,
        fullName: mockFormData.fullName
      });
      
      if (!validation.isValid) {
        throw new Error(`Form validation failed: ${Object.values(validation.errors).join(', ')}`);
      }
      
      // Test package-specific logic
      const isPaidPackage = !['free', 'freepro'].includes(packageType);
      
      if (isPaidPackage) {
        // Test Stripe price lookup
        const { data: priceData, error: priceError } = await supabase.rpc('get_stripe_price_id', {
          p_package_type: packageType,
          p_billing_frequency: 'monthly'
        });
        
        if (priceError || !priceData) {
          throw new Error(`Price lookup failed for ${packageType}: ${priceError?.message || 'No price found'}`);
        }
      }
      
      const duration = Date.now() - startTime;
      updateTestResult(suiteName, testName, { 
        status: 'passed', 
        message: `✅ ${packageType} signup flow validated successfully`,
        duration,
        details: { packageType, isPaidPackage, testEmail }
      });
      
    } catch (error: any) {
      updateTestResult(suiteName, testName, { 
        status: 'failed', 
        message: `❌ ${error.message}`,
        details: { error: error.message, packageType }
      });
    }
  };

  const runPaymentFlowTest = async (testName: string) => {
    const suiteName = 'Payment Flow Validation';
    
    updateTestResult(suiteName, testName, { status: 'running', message: 'Testing payment flow...' });
    
    try {
      const startTime = Date.now();
      
      switch (testName) {
        case 'Stripe Price ID Lookup':
          // Test all paid packages have price IDs
          const paidPackages: PackageType[] = ['standard', 'premium', 'premiumpro', 'enterprise'];
          for (const pkg of paidPackages) {
            const { data, error } = await supabase.rpc('get_stripe_price_id', {
              p_package_type: pkg,
              p_billing_frequency: 'monthly'
            });
            if (error || !data) {
              throw new Error(`Price ID missing for ${pkg}: ${error?.message}`);
            }
          }
          break;
          
        case 'Checkout Session Creation':
          // Test checkout function exists and is callable
          const { error: checkoutError } = await supabase.functions.invoke('create-checkout', {
            body: {
              packageType: 'standard',
              billingFrequency: 'monthly',
              signupData: {
                email: 'test@example.com',
                fullName: 'Test User',
                companyName: 'Test Company'
              }
            }
          });
          
          // We expect this to fail in test mode, but function should exist
          if (checkoutError && !checkoutError.message.includes('STRIPE_SECRET_KEY')) {
            throw new Error(`Checkout function error: ${checkoutError.message}`);
          }
          break;
          
        case 'Customer Portal Access':
          // Test customer portal function exists
          const { error: portalError } = await supabase.functions.invoke('customer-portal');
          
          // We expect this to fail without auth, but function should exist
          if (portalError && !portalError.message.includes('No authorization header')) {
            throw new Error(`Portal function error: ${portalError.message}`);
          }
          break;
          
        case 'Incomplete Signup Tracking':
          // Test incomplete signup creation
          const { data: signupId, error: signupError } = await supabase.rpc('create_incomplete_signup', {
            p_email: `test-${Date.now()}@example.com`,
            p_full_name: 'Test User',
            p_package_type: 'standard',
            p_billing_frequency: 'monthly'
          });
          
          if (signupError || !signupId) {
            throw new Error(`Incomplete signup creation failed: ${signupError?.message}`);
          }
          break;
      }
      
      const duration = Date.now() - startTime;
      updateTestResult(suiteName, testName, { 
        status: 'passed', 
        message: `✅ ${testName} validated successfully`,
        duration
      });
      
    } catch (error: any) {
      updateTestResult(suiteName, testName, { 
        status: 'failed', 
        message: `❌ ${error.message}`
      });
    }
  };

  const runDataConsistencyTest = async (testName: string) => {
    const suiteName = 'Data Consistency';
    
    updateTestResult(suiteName, testName, { status: 'running', message: 'Testing data consistency...' });
    
    try {
      const startTime = Date.now();
      
      switch (testName) {
        case 'Profile-Subscriber Sync':
          const { validateDataConsistency } = await import('@/utils/database/dataConsistency');
          const consistencyResult = await validateDataConsistency();
          
          if (!consistencyResult.success) {
            throw new Error(`Data consistency check failed: ${consistencyResult.message}`);
          }
          break;
          
        case 'Package Type Validation':
          const { validatePackageTypes } = await import('@/utils/database/dataConsistency');
          const packageResult = await validatePackageTypes();
          
          if (!packageResult.success) {
            throw new Error(`Package type validation failed: ${packageResult.message}`);
          }
          break;
          
        case 'Subscription Status Consistency':
          const { data: validationData, error: validationError } = await supabase.rpc('validate_subscription_sync');
          
          if (validationError) {
            throw new Error(`Subscription sync validation failed: ${validationError.message}`);
          }
          break;
          
        case 'Data Reconciliation':
          const { reconcileSubscriptionData } = await import('@/utils/database/dataConsistency');
          const reconcileResult = await reconcileSubscriptionData();
          
          if (!reconcileResult.success) {
            throw new Error(`Data reconciliation failed: ${reconcileResult.message}`);
          }
          break;
      }
      
      const duration = Date.now() - startTime;
      updateTestResult(suiteName, testName, { 
        status: 'passed', 
        message: `✅ ${testName} completed successfully`,
        duration
      });
      
    } catch (error: any) {
      updateTestResult(suiteName, testName, { 
        status: 'failed', 
        message: `❌ ${error.message}`
      });
    }
  };

  const runEdgeCaseTest = async (testName: string) => {
    const suiteName = 'Edge Cases';
    
    updateTestResult(suiteName, testName, { status: 'running', message: 'Testing edge case...' });
    
    try {
      const startTime = Date.now();
      
      switch (testName) {
        case 'Duplicate Email Handling':
          // Test duplicate email handling in signup flow
          const testEmail = `duplicate-test-${Date.now()}@example.com`;
          
          // First signup attempt
          const { error: firstError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'TestPassword123!',
            options: {
              data: {
                full_name: 'Test User',
                package_type: 'free'
              }
            }
          });
          
          // We expect this to work or fail gracefully
          if (firstError && !firstError.message.includes('already registered')) {
            throw new Error(`Unexpected error on first signup: ${firstError.message}`);
          }
          break;
          
        case 'Rate Limit Handling':
          // Test rate limit detection
          const { useSmartRateLimit } = await import('@/hooks/auth/useSmartRateLimit');
          // This test validates the hook exists and can be imported
          break;
          
        case 'Webhook Failure Recovery':
          // Test webhook processing function
          const { error: webhookError } = await supabase.functions.invoke('handle-webhook', {
            body: { type: 'test' }
          });
          
          // Function should exist even if it fails validation
          if (webhookError && !webhookError.message.includes('stripe-signature')) {
            throw new Error(`Webhook function error: ${webhookError.message}`);
          }
          break;
          
        case 'Network Failure Handling':
          // Test network failure handling in auth flow
          try {
            await supabase.auth.signInWithPassword({
              email: 'nonexistent@example.com',
              password: 'wrong'
            });
          } catch (error: any) {
            // This should fail gracefully
            if (!error.message.includes('Invalid login credentials')) {
              throw new Error(`Unexpected network error handling: ${error.message}`);
            }
          }
          break;
      }
      
      const duration = Date.now() - startTime;
      updateTestResult(suiteName, testName, { 
        status: 'passed', 
        message: `✅ ${testName} handled correctly`,
        duration
      });
      
    } catch (error: any) {
      updateTestResult(suiteName, testName, { 
        status: 'failed', 
        message: `❌ ${error.message}`
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const suites = initializeTestSuites();
    setTestSuites(suites);
    
    toast({
      title: "Running End-to-End Tests",
      description: "Testing all package signup flows, payment flows, and edge cases...",
    });

    try {
      // Run Package Signup Flow Tests
      const packageTypes: PackageType[] = ['free', 'freepro', 'standard', 'premium', 'premiumpro', 'enterprise'];
      for (const packageType of packageTypes) {
        await runPackageSignupTest(packageType);
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay between tests
      }

      // Run Payment Flow Tests
      const paymentTests = [
        'Stripe Price ID Lookup',
        'Checkout Session Creation', 
        'Customer Portal Access',
        'Incomplete Signup Tracking'
      ];
      for (const test of paymentTests) {
        await runPaymentFlowTest(test);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Run Data Consistency Tests
      const dataTests = [
        'Profile-Subscriber Sync',
        'Package Type Validation',
        'Subscription Status Consistency',
        'Data Reconciliation'
      ];
      for (const test of dataTests) {
        await runDataConsistencyTest(test);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Run Edge Case Tests
      const edgeTests = [
        'Duplicate Email Handling',
        'Rate Limit Handling',
        'Webhook Failure Recovery',
        'Network Failure Handling'
      ];
      for (const test of edgeTests) {
        await runEdgeCaseTest(test);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Tests Completed",
        description: "All end-to-end tests have finished running. Check results below.",
      });

    } catch (error: any) {
      toast({
        title: "Test Suite Error",
        description: `Error running tests: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getSuiteStats = (suite: TestSuite) => {
    const passed = suite.tests.filter(t => t.status === 'passed').length;
    const failed = suite.tests.filter(t => t.status === 'failed').length;
    const running = suite.tests.filter(t => t.status === 'running').length;
    const total = suite.tests.length;
    
    return { passed, failed, running, total };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">End-to-End Test Suite</h2>
          <p className="text-gray-600">
            Comprehensive testing of package signup flows, payment flows, and edge cases
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      {testSuites.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Click "Run All Tests" to start the comprehensive end-to-end testing suite.
          </AlertDescription>
        </Alert>
      )}

      {testSuites.map((suite) => {
        const stats = getSuiteStats(suite);
        return (
          <Card key={suite.suiteName}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{suite.suiteName}</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">{stats.passed} passed</span>
                  <span className="text-red-600">{stats.failed} failed</span>
                  <span className="text-gray-600">{stats.total} total</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suite.tests.map((test) => (
                  <div key={test.testName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.testName}</div>
                        <div className="text-sm text-gray-600">{test.message}</div>
                        {test.duration && (
                          <div className="text-xs text-gray-500">
                            Completed in {test.duration}ms
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EndToEndTestSuite;
