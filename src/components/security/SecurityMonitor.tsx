
import React, { useState, useEffect } from 'react';
import { useEnhancedSecurity } from '@/hooks/auth/useEnhancedSecurity';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface SecurityMonitorProps {
  showDebugInfo?: boolean;
}

const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ showDebugInfo = false }) => {
  const { user, subscriptionStatus, packageType, permissions } = useAuth();
  const { validateUserPermissions, isValidating, lastValidation } = useEnhancedSecurity();
  const [isDebugVisible, setIsDebugVisible] = useState(showDebugInfo);
  const [validationHistory, setValidationHistory] = useState<any[]>([]);

  const performSecurityCheck = async () => {
    if (!user) return;
    
    try {
      const result = await validateUserPermissions(user.id);
      setValidationHistory(prev => [
        { timestamp: new Date(), result, userId: user.id },
        ...prev.slice(0, 4) // Keep last 5 validations
      ]);
    } catch (error) {
      console.error('Security check failed:', error);
    }
  };

  useEffect(() => {
    if (user) {
      performSecurityCheck();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'grace_period': return 'bg-yellow-500';
      case 'past_due': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Security monitoring requires authentication</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitor
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDebugVisible(!isDebugVisible)}
            >
              {isDebugVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Package</div>
              <Badge variant="outline">{packageType}</Badge>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(subscriptionStatus?.subscription_status || 'active')}`} />
                <span className="text-sm">{subscriptionStatus?.subscription_status || 'active'}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Investors Access</div>
              {permissions.canAccessInvestors ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500">Deals Access</div>
              {permissions.canCreateDeals ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          {/* Security Validation */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Security Validation</div>
              {lastValidation && (
                <div className="text-xs text-gray-500">
                  Last check: {lastValidation.valid ? 'Passed' : 'Failed'}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={performSecurityCheck}
              disabled={isValidating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
              Check
            </Button>
          </div>

          {/* Debug Information */}
          {isDebugVisible && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-2">Debug Information</div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium">Subscription Status:</span>
                  <pre className="mt-1 text-xs bg-white p-2 rounded">
                    {JSON.stringify(subscriptionStatus, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="font-medium">Permissions:</span>
                  <pre className="mt-1 text-xs bg-white p-2 rounded">
                    {JSON.stringify(permissions, null, 2)}
                  </pre>
                </div>
                {lastValidation && (
                  <div>
                    <span className="font-medium">Last Validation:</span>
                    <pre className="mt-1 text-xs bg-white p-2 rounded">
                      {JSON.stringify(lastValidation, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation History */}
          {validationHistory.length > 0 && isDebugVisible && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Recent Validations</div>
              <div className="space-y-1">
                {validationHistory.map((validation, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <span>{validation.timestamp.toLocaleTimeString()}</span>
                    <Badge variant={validation.result.valid ? "default" : "destructive"}>
                      {validation.result.valid ? 'Valid' : validation.result.error}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {lastValidation && !lastValidation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Security validation failed: {lastValidation.message || lastValidation.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecurityMonitor;
