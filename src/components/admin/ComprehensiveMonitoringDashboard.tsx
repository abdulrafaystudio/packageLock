import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Database, 
  Webhook, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Activity,
  Clock,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SystemValidator from '@/components/testing/SystemValidator';
import SecurityDashboard from '@/components/admin/SecurityDashboard';

interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  retry_count: number;
  error_message?: string;
  created_at: string;
}

interface IncompleteSignup {
  id: string;
  email: string;
  package_type: string;
  status: string;
  stripe_customer_id?: string;
  created_at: string;
}

interface RecoveryResult {
  success: boolean;
  message: string;
  details?: any;
}

const ComprehensiveMonitoringDashboard: React.FC = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [incompleteSignups, setIncompleteSignups] = useState<IncompleteSignup[]>([]);
  const [recoveryResults, setRecoveryResults] = useState<RecoveryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load webhook events
      const { data: webhooks } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      // Load incomplete signups
      const { data: signups } = await supabase
        .from('incomplete_signups')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(20);

      setWebhookEvents(webhooks || []);
      setIncompleteSignups(signups || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runRecovery = async (type: 'failed-signups' | 'failed-webhooks' | 'missing-profiles') => {
    setIsLoading(true);
    try {
      let functionName = '';
      switch (type) {
        case 'failed-signups':
          functionName = 'cleanup-failed-signups';
          break;
        case 'failed-webhooks':
          functionName = 'webhook-retry';
          break;
        case 'missing-profiles':
          functionName = 'manual-recovery';
          break;
      }

      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;

      const result: RecoveryResult = {
        success: data.success,
        message: data.message || `${type} recovery completed`,
        details: data
      };

      setRecoveryResults(prev => [result, ...prev.slice(0, 9)]);
      
      toast({
        title: result.success ? "Recovery Successful" : "Recovery Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      // Refresh data after recovery
      await loadData();
    } catch (error: any) {
      const result: RecoveryResult = {
        success: false,
        message: error.message || `${type} recovery failed`
      };
      
      setRecoveryResults(prev => [result, ...prev.slice(0, 9)]);
      
      toast({
        title: "Recovery Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8" />
          Comprehensive Monitoring Dashboard
        </h1>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          <Button
            onClick={loadData}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
          <TabsTrigger value="signups">Incomplete Signups</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Tools</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Failed Webhooks</p>
                    <p className="text-2xl font-bold">{webhookEvents.length}</p>
                  </div>
                  <Webhook className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Stuck Signups</p>
                    <p className="text-2xl font-bold">{incompleteSignups.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recovery Actions</p>
                    <p className="text-2xl font-bold">{recoveryResults.length}</p>
                  </div>
                  <Settings className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Status</p>
                    <p className="text-sm font-medium">
                      {webhookEvents.length === 0 && incompleteSignups.length === 0 ? 'Healthy' : 'Issues'}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    webhookEvents.length === 0 && incompleteSignups.length === 0 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`} />
                </div>
              </CardContent>
            </Card>
          </div>

          <SystemValidator />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Failed Webhook Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {webhookEvents.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All webhook events processed successfully
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {webhookEvents.map((webhook) => (
                    <div key={webhook.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{webhook.event_type}</div>
                          <div className="text-sm text-gray-600">
                            ID: {webhook.stripe_event_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            Retries: {webhook.retry_count}
                          </div>
                          {webhook.error_message && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {webhook.error_message}
                            </div>
                          )}
                        </div>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Incomplete Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incompleteSignups.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No incomplete signups found
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {incompleteSignups.map((signup) => (
                    <div key={signup.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{signup.email}</div>
                          <div className="text-sm text-gray-600">
                            Package: {signup.package_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {new Date(signup.created_at).toLocaleString()}
                          </div>
                          {signup.stripe_customer_id && (
                            <div className="text-sm text-blue-600">
                              Stripe Customer: {signup.stripe_customer_id}
                            </div>
                          )}
                        </div>
                        <Badge variant={signup.status === 'pending' ? 'secondary' : 'destructive'}>
                          {signup.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Failed Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Clean up and retry failed signup processes
                </p>
                <Button
                  onClick={() => runRecovery('failed-signups')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Run Cleanup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Failed Webhooks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Retry processing of failed webhook events
                </p>
                <Button
                  onClick={() => runRecovery('failed-webhooks')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Retry Webhooks
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Missing Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Recover missing user profiles and data
                </p>
                <Button
                  onClick={() => runRecovery('missing-profiles')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Recover Profiles
                </Button>
              </CardContent>
            </Card>
          </div>

          {recoveryResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Recovery Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recoveryResults.map((result, index) => (
                    <Alert key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                      <AlertDescription className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        {result.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveMonitoringDashboard;