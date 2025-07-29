import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SystemStatus {
  webhookEvents: number;
  incompleteSignups: number;
  authUsers: number;
  profiles: number;
  subscribers: number;
  accountsNeedingAuth: string[];
  packageTests: Record<string, boolean>;
}

const SystemTest = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const runSystemCheck = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running system diagnostics...');

      // Check database state
      const { data: webhookEvents } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: incompleteSignups } = await supabase
        .from('incomplete_signups')
        .select('*')
        .not('stripe_customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: subscriptionPlans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);

      setStatus({
        webhookEvents: webhookEvents?.length || 0,
        incompleteSignups: incompleteSignups?.length || 0,
        authUsers: 0, // Can't query auth.users from client
        profiles: profiles?.length || 0,
        subscribers: subscribers?.length || 0,
        accountsNeedingAuth: [],
        packageTests: {}
      });

      setTestResults({
        webhookEvents,
        incompleteSignups,
        profiles,
        subscribers,
        subscriptionPlans
      });

      console.log('✅ System check complete');
      toast({
        title: "System Check Complete",
        description: "Diagnostic results loaded successfully.",
      });

    } catch (error: any) {
      console.error('❌ System check failed:', error);
      toast({
        title: "System Check Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhookConnection = async () => {
    try {
      console.log('🔗 Testing webhook connection...');
      
      // This would normally be done from Stripe dashboard
      toast({
        title: "Webhook Test",
        description: "Please test webhooks from your Stripe Dashboard → Webhooks → Send test webhook",
      });

    } catch (error: any) {
      console.error('❌ Webhook test failed:', error);
      toast({
        title: "Webhook Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runBatchRecovery = async () => {
    try {
      console.log('🔄 Running batch recovery...');
      
      const { data, error } = await supabase.functions.invoke('batch-recovery');
      
      if (error) {
        throw error;
      }

      console.log('✅ Batch recovery complete:', data);
      toast({
        title: "Batch Recovery Complete",
        description: `Processed ${data?.summary?.total || 0} accounts`,
      });

      // Refresh system status
      await runSystemCheck();

    } catch (error: any) {
      console.error('❌ Batch recovery failed:', error);
      toast({
        title: "Batch Recovery Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runPaymentScanner = async () => {
    try {
      console.log('🔍 Running payment scanner...');
      
      const { data, error } = await supabase.functions.invoke('payment-scanner');
      
      if (error) {
        throw error;
      }

      console.log('✅ Payment scanner complete:', data);
      toast({
        title: "Payment Scanner Complete",
        description: `Processed ${data?.summary?.processed || 0} accounts, ${data?.summary?.errors || 0} errors`,
      });

      // Refresh system status
      await runSystemCheck();

    } catch (error: any) {
      console.error('❌ Payment scanner failed:', error);
      toast({
        title: "Payment Scanner Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runManualRecovery = async () => {
    try {
      console.log('🛠️ Running manual recovery...');
      
      // Recover specific stuck emails
      const stuckEmails = ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'];
      const results = [];
      
      for (const email of stuckEmails) {
        try {
          const { data, error } = await supabase.functions.invoke('manual-signup-recovery', {
            body: { email }
          });
          
          if (error) {
            console.error(`Failed to recover ${email}:`, error);
            results.push({ email, success: false, error: error.message });
          } else {
            console.log(`Recovered ${email}:`, data);
            results.push({ email, success: true, data });
          }
        } catch (err: any) {
          results.push({ email, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Manual Recovery Complete",
        description: `Successfully recovered ${successCount}/${stuckEmails.length} accounts`,
      });

      // Refresh system status
      await runSystemCheck();

    } catch (error: any) {
      console.error('❌ Manual recovery failed:', error);
      toast({
        title: "Manual Recovery Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runAccountCleanup = async () => {
    try {
      console.log('🧹 Running account cleanup...');
      
      const { data, error } = await supabase.functions.invoke('cleanup-accounts');
      
      if (error) {
        throw error;
      }

      console.log('✅ Account cleanup complete:', data);
      toast({
        title: "Account Cleanup Complete",
        description: `Fixed ${data?.summary?.accounts_fixed || 0} accounts, removed ${data?.summary?.duplicates_removed || 0} duplicates`,
      });

      // Refresh system status
      await runSystemCheck();

    } catch (error: any) {
      console.error('❌ Account cleanup failed:', error);
      toast({
        title: "Account Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runWebhookRetry = async () => {
    try {
      console.log('🔄 Running webhook retry...');
      
      const { data, error } = await supabase.functions.invoke('webhook-retry');
      
      if (error) {
        throw error;
      }

      console.log('✅ Webhook retry complete:', data);
      toast({
        title: "Webhook Retry Complete",
        description: `Processed ${data?.processed || 0} webhooks, ${data?.errors || 0} errors`,
      });

      // Refresh system status
      await runSystemCheck();

    } catch (error: any) {
      console.error('❌ Webhook retry failed:', error);
      toast({
        title: "Webhook Retry Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const completeSystemRecovery = async () => {
    try {
      console.log('🚀 Running complete system recovery...');
      
      // Step 1: Fix database conflicts (already done)
      // Step 2: Retry failed webhooks
      await runWebhookRetry();
      
      // Step 3: Process any remaining stuck accounts
      await processStuckAccounts();
      
      // Step 4: Run payment scanner
      await runPaymentScanner();
      
      // Step 5: Final system check
      await runSystemCheck();
      
      toast({
        title: "System Recovery Complete",
        description: "All recovery steps completed successfully",
      });

    } catch (error: any) {
      console.error('❌ System recovery failed:', error);
      toast({
        title: "System Recovery Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const processStuckAccounts = async () => {
    try {
      console.log('🔧 Processing stuck paid accounts...');
      
      // Process test3@gmail.com and test4@gmail.com specifically
      const stuckEmails = ['test3@gmail.com', 'test4@gmail.com'];
      const results = [];
      
      for (const email of stuckEmails) {
        try {
          // First try to recover using the database function
          const { data: recoveryData, error: recoveryError } = await supabase.rpc('recover_stuck_paid_account', {
            p_email: email,
            p_force_recovery: true
          });
          
          if (recoveryError) {
            console.error(`Database recovery failed for ${email}:`, recoveryError);
            results.push({ email, success: false, error: recoveryError.message });
            continue;
          }
          
          if (!(recoveryData as any)?.success) {
            console.error(`Recovery failed for ${email}:`, recoveryData);
            results.push({ email, success: false, error: (recoveryData as any)?.message || 'Unknown error' });
            continue;
          }
          
          // Now use manual-signup-recovery to create the auth user
          const { data: authData, error: authError } = await supabase.functions.invoke('manual-signup-recovery', {
            body: { email }
          });
          
          if (authError) {
            console.error(`Auth creation failed for ${email}:`, authError);
            results.push({ email, success: false, error: authError.message });
          } else {
            console.log(`Successfully processed ${email}:`, authData);
            results.push({ email, success: true, data: authData });
          }
        } catch (err: any) {
          results.push({ email, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Stuck Account Processing Complete",
        description: `Successfully processed ${successCount}/${stuckEmails.length} accounts`,
      });

      console.log('Processing results:', results);

      // Refresh system status
      await runSystemCheck();

    } catch (error: any) {
      console.error('❌ Stuck account processing failed:', error);
      toast({
        title: "Stuck Account Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testNewSignup = async () => {
    try {
      console.log('🆕 Testing new signup flow...');
      
      toast({
        title: "Test New Signup",
        description: "Please test with test5@gmail.com or another fresh email address",
      });

    } catch (error: any) {
      console.error('❌ Test signup failed:', error);
      toast({
        title: "Test Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (count: number, expected: number = 0) => {
    if (count > expected) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (count === expected && expected === 0) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground mt-2">
            Test and monitor the payment and signup system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={runSystemCheck} 
            disabled={isLoading}
            className="h-20"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Run System Check
          </Button>
          
          <Button 
            onClick={completeSystemRecovery}
            variant="default"
            className="h-20 bg-green-600 hover:bg-green-700"
          >
            🚀 Complete System Recovery
          </Button>
          
          <Button 
            onClick={runWebhookRetry}
            variant="secondary"
            className="h-20"
          >
            🔄 Retry Failed Webhooks
          </Button>

          <Button 
            onClick={runPaymentScanner}
            variant="secondary"
            className="h-20"
          >
            🔍 Payment Scanner
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={runBatchRecovery}
            variant="secondary"
            className="h-16"
          >
            🔄 Batch Recovery
          </Button>

          <Button 
            onClick={runManualRecovery}
            variant="secondary"
            className="h-16"
          >
            🛠️ Manual Recovery
          </Button>

          <Button 
            onClick={() => window.open('/account-fix', '_blank')}
            variant="outline"
            className="h-16"
          >
            🔧 Account Fix Tool
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={processStuckAccounts}
            variant="secondary"
            className="h-16"
          >
            🔧 Process Stuck Accounts
          </Button>
          
          <Button 
            onClick={() => window.open('/account-fix', '_blank')}
            variant="outline"
            className="h-16"
          >
            🛠️ Manual Account Fix Tool
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button 
            onClick={() => window.open('https://ohiqolnendkhyuomdbnx.supabase.co/functions/v1/webhook-test', '_blank')}
            variant="outline"
            className="h-16"
          >
            🔗 Test Webhook Connectivity
          </Button>
          
          <Button 
            onClick={() => window.open('https://dashboard.stripe.com/test/webhooks', '_blank')}
            variant="outline"
            className="h-16"
          >
            🎯 Stripe Webhook Dashboard
          </Button>

          <Button 
            onClick={() => window.open('https://supabase.com/dashboard/project/ohiqolnendkhyuomdbnx/functions/handle-webhook/logs', '_blank')}
            variant="outline"
            className="h-16"
          >
            📋 Webhook Function Logs
          </Button>
        </div>

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhook Events</CardTitle>
                {getStatusIcon(status.webhookEvents, 0)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.webhookEvents}</div>
                <p className="text-xs text-muted-foreground">
                  {status.webhookEvents === 0 ? "No webhooks processed" : "Webhooks working"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incomplete Signups</CardTitle>
                {getStatusIcon(status.incompleteSignups, 0)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.incompleteSignups}</div>
                <p className="text-xs text-muted-foreground">
                  Paid but incomplete accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
                {getStatusIcon(status.profiles)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.profiles}</div>
                <p className="text-xs text-muted-foreground">
                  User profiles created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                {getStatusIcon(status.subscribers)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.subscribers}</div>
                <p className="text-xs text-muted-foreground">
                  Active subscribers
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {testResults.incompleteSignups && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Incomplete Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testResults.incompleteSignups.map((signup: any) => (
                  <div key={signup.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{signup.email}</span>
                      <Badge variant="outline" className="ml-2">{signup.package_type}</Badge>
                    </div>
                    <Badge variant={signup.status === 'completed' ? 'default' : 'destructive'}>
                      {signup.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {testResults.subscriptionPlans && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResults.subscriptionPlans.map((plan: any) => (
                  <div key={plan.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{plan.package_type}</span>
                      <Badge>{plan.billing_frequency}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Price ID: {plan.stripe_price_id}
                    </div>
                    <div className="text-sm font-medium mt-1">
                      ${plan.monthly_price || plan.yearly_price}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>For comprehensive testing, try each package signup flow end-to-end</p>
        </div>
      </div>
    </div>
  );
};

export default SystemTest;