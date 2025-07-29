
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { validateSystem } from '@/utils/testing/subscriptionValidation';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const SystemHealthMonitor: React.FC = () => {
  const {
    subscriptionStatus,
    permissions,
    packageType,
    isOfflineMode,
    lastSuccessfulCheck
  } = useAuth();

  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const [isValidating, setIsValidating] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    
    try {
      // Simulate async validation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = validateSystem(
        subscriptionStatus,
        permissions,
        packageType,
        isOfflineMode || false,
        lastSuccessfulCheck
      );
      
      setValidationResult(result);
      console.log('🔍 System validation completed:', result);
    } catch (error) {
      console.error('❌ System validation failed:', error);
      setValidationResult({
        isValid: false,
        errors: ['Validation process failed'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Run validation on mount and when auth state changes
  useEffect(() => {
    runValidation();
  }, [subscriptionStatus, permissions, packageType, isOfflineMode]);

  const getStatusIcon = () => {
    if (!validationResult) return <RefreshCw className="h-4 w-4 animate-spin" />;
    
    if (validationResult.isValid && validationResult.warnings.length === 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (validationResult.isValid && validationResult.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!validationResult) return 'Validating...';
    
    if (validationResult.isValid && validationResult.warnings.length === 0) {
      return 'System Healthy';
    } else if (validationResult.isValid && validationResult.warnings.length > 0) {
      return 'System Healthy (Warnings)';
    } else {
      return 'System Issues Detected';
    }
  };

  const getStatusVariant = () => {
    if (!validationResult) return 'secondary';
    
    if (validationResult.isValid && validationResult.warnings.length === 0) {
      return 'default';
    } else if (validationResult.isValid && validationResult.warnings.length > 0) {
      return 'secondary';
    } else {
      return 'destructive';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon()}
            System Health Monitor
          </span>
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current System State */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Package Type:</span>
            <span className="ml-2">{packageType}</span>
          </div>
          <div>
            <span className="font-medium">Subscription Status:</span>
            <span className="ml-2">
              {subscriptionStatus?.subscription_status || 'None'}
            </span>
          </div>
          <div>
            <span className="font-medium">Mode:</span>
            <span className="ml-2">
              {isOfflineMode ? 'Offline' : 'Online'}
            </span>
          </div>
          <div>
            <span className="font-medium">Last Check:</span>
            <span className="ml-2">
              {lastSuccessfulCheck 
                ? lastSuccessfulCheck.toLocaleTimeString()
                : 'Never'
              }
            </span>
          </div>
        </div>

        {/* Permissions Display */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Current Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Investors:</span>
              <Badge variant={permissions.canAccessInvestors ? "default" : "secondary"}>
                {permissions.canAccessInvestors ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Create Deals:</span>
              <Badge variant={permissions.canCreateDeals ? "default" : "secondary"}>
                {permissions.canCreateDeals ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Max Deals:</span>
              <Badge variant="outline">
                {permissions.maxDeals === -1 ? 'Unlimited' : permissions.maxDeals}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Profile Access:</span>
              <Badge variant={permissions.canAccessProfile ? "default" : "secondary"}>
                {permissions.canAccessProfile ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <>
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors</h4>
                {validationResult.errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-600">Warnings</h4>
                {validationResult.warnings.map((warning, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="border-t pt-4 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={runValidation}
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validating...' : 'Re-validate'}
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Current auth state:', {
                subscriptionStatus,
                permissions,
                packageType,
                isOfflineMode,
                lastSuccessfulCheck
              })}
            >
              Log State
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthMonitor;
