
import React, { useState, useEffect } from 'react';
import { useEnhancedSecurity } from '@/hooks/auth/useEnhancedSecurity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import SecurityMonitor from '@/components/security/SecurityMonitor';

const SecurityDashboard: React.FC = () => {
  const {
    validateSubscriptionSync,
    reconcileSubscriptionData,
    isValidating
  } = useEnhancedSecurity();

  const [syncIssues, setSyncIssues] = useState<any[]>([]);
  const [reconciliationResult, setReconciliationResult] = useState<any>(null);
  const [lastSyncCheck, setLastSyncCheck] = useState<Date | null>(null);

  const handleValidateSync = async () => {
    try {
      const issues = await validateSubscriptionSync();
      setSyncIssues(issues);
      setLastSyncCheck(new Date());
    } catch (error) {
      console.error('Error validating sync:', error);
    }
  };

  const handleReconcile = async () => {
    try {
      const result = await reconcileSubscriptionData();
      setReconciliationResult(result);
      // Re-validate after reconciliation
      await handleValidateSync();
    } catch (error) {
      console.error('Error reconciling data:', error);
    }
  };

  useEffect(() => {
    // Auto-validate on mount
    handleValidateSync();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Dashboard
        </h2>
        <Button
          onClick={handleValidateSync}
          disabled={isValidating}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Monitor */}
      <SecurityMonitor showDebugInfo={true} />

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {syncIssues.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">
                  {syncIssues.length === 0 ? 'All systems synchronized' : `${syncIssues.length} sync issues found`}
                </span>
              </div>
              {lastSyncCheck && (
                <p className="text-sm text-gray-500">
                  Last checked: {lastSyncCheck.toLocaleString()}
                </p>
              )}
            </div>
            {syncIssues.length > 0 && (
              <Button
                onClick={handleReconcile}
                disabled={isValidating}
                variant="outline"
              >
                Fix Issues
              </Button>
            )}
          </div>

          {/* Sync Issues List */}
          {syncIssues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Issues Found:</h4>
              {syncIssues.map((issue, index) => (
                <div key={index} className="p-3 bg-yellow-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{issue.email}</div>
                      <div className="text-sm text-gray-600">
                        <Badge variant="outline" className="mr-2">
                          {issue.issue_type}
                        </Badge>
                        Profiles: {issue.profiles_status} | Subscribers: {issue.subscribers_status}
                      </div>
                      <div className="text-sm text-blue-600">
                        Recommended: {issue.recommended_action}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reconciliation Results */}
          {reconciliationResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Reconciliation completed successfully!</div>
                  <div className="text-sm">
                    • Synced {reconciliationResult.synced_profiles} profile records
                  </div>
                  <div className="text-sm">
                    • Created {reconciliationResult.created_subscribers} subscriber records
                  </div>
                  <div className="text-sm text-gray-500">
                    Completed at: {new Date(reconciliationResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
