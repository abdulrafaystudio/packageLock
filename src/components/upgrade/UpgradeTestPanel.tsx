
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/profile/ProfileProviderV3';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { clearAllProfileCache } from '@/utils/cache-manager';

const UpgradeTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { user, checkSubscription } = useAuth();
  const { refreshProfile, packageType, hasActiveSubscription, permissions } = useProfile();
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics = {
      timestamp: new Date().toISOString(),
      user_id: user?.id,
      email: user?.email,
      tests: {} as any
    };

    try {
      // Test 1: Database consistency check
      console.log('🔍 Running database consistency check...');
      const { data: dbCheck, error: dbError } = await supabase.functions.invoke('system-validator');
      diagnostics.tests.database_consistency = {
        success: !dbError,
        data: dbCheck,
        error: dbError?.message
      };

      // Test 2: Subscription sync test
      console.log('🔄 Testing subscription sync...');
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-user-profile');
      diagnostics.tests.subscription_sync = {
        success: !syncError,
        data: syncResult,
        error: syncError?.message
      };

      // Test 3: Cache invalidation test
      console.log('🗑️ Testing cache invalidation...');
      clearAllProfileCache();
      await refreshProfile();
      if (checkSubscription) {
        await checkSubscription();
      }
      diagnostics.tests.cache_invalidation = {
        success: true,
        message: 'Cache cleared and profile refreshed'
      };

      // Test 4: Permission validation
      console.log('🔐 Testing permission validation...');
      diagnostics.tests.permission_validation = {
        success: true,
        current_package: packageType,
        has_active_subscription: hasActiveSubscription,
        permissions: {
          canAccessInvestors: permissions.canAccessInvestors,
          canCreateDeals: permissions.canCreateDeals,
          maxDeals: permissions.maxDeals
        }
      };

      setResults(diagnostics);
      
      toast({
        title: "Diagnostics Complete",
        description: "System diagnostics have been completed successfully.",
      });

    } catch (error) {
      console.error('Diagnostics failed:', error);
      diagnostics.tests.error = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setResults(diagnostics);
      
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const fixUpgradeIssues = async () => {
    setIsRunning(true);
    
    try {
      console.log('🔧 Running upgrade recovery process...');
      
      // Clear all caches first
      clearAllProfileCache();
      
      // Run recovery process
      const { data: recoveryResult, error: recoveryError } = await supabase.functions.invoke('upgrade-recovery');
      
      if (recoveryError) {
        throw new Error(`Recovery failed: ${recoveryError.message}`);
      }
      
      // Force refresh everything
      await refreshProfile();
      if (checkSubscription) {
        await checkSubscription();
      }
      
      toast({
        title: "🎉 Recovery Complete!",
        description: "Your subscription has been recovered and activated.",
        duration: 8000,
      });
      
      // Re-run diagnostics to verify
      setTimeout(() => {
        runDiagnostics();
      }, 2000);
      
    } catch (error) {
      console.error('Recovery failed:', error);
      toast({
        title: "Recovery Failed",
        description: error instanceof Error ? error.message : "Recovery process failed",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (test: any) => {
    if (!test) return <Badge variant="outline">Not Run</Badge>;
    
    return test.success ? (
      <Badge className="bg-green-100 text-green-800">Success</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Failed</Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Upgrade Flow Diagnostics & Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current State */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Current Package</h4>
            <Badge className="capitalize">{packageType}</Badge>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Active Subscription</h4>
            {getStatusBadge({ success: hasActiveSubscription })}
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Investor Access</h4>
            {getStatusBadge({ success: permissions.canAccessInvestors })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Database className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
          
          <Button 
            onClick={fixUpgradeIssues}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            Fix Upgrade Issues
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Diagnostics Results
            </h4>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Database Consistency</span>
                {getStatusBadge(results.tests.database_consistency)}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Subscription Sync</span>
                {getStatusBadge(results.tests.subscription_sync)}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Cache Invalidation</span>
                {getStatusBadge(results.tests.cache_invalidation)}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Permission Validation</span>
                {getStatusBadge(results.tests.permission_validation)}
              </div>
            </div>

            {/* Raw Results (for debugging) */}
            <details className="space-y-2">
              <summary className="cursor-pointer font-medium">Raw Results (Debug)</summary>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpgradeTestPanel;
