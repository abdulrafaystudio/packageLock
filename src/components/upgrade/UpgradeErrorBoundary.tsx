
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UpgradeErrorBoundaryProps {
  error: Error;
  onRetry: () => void;
  onContactSupport: () => void;
  isRetrying?: boolean;
}

const UpgradeErrorBoundary = ({ 
  error, 
  onRetry, 
  onContactSupport, 
  isRetrying = false 
}: UpgradeErrorBoundaryProps) => {
  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('Authentication')) return 'auth';
    if (errorMessage.includes('No checkout URL')) return 'server';
    if (errorMessage.includes('Failed to modify subscription')) return 'stripe';
    if (errorMessage.includes('Network')) return 'network';
    return 'unknown';
  };

  const getErrorTitle = (errorType: string) => {
    switch (errorType) {
      case 'auth': return 'Authentication Required';
      case 'server': return 'Server Error';
      case 'stripe': return 'Subscription Error';
      case 'network': return 'Connection Error';
      default: return 'Upgrade Failed';
    }
  };

  const getErrorDescription = (errorType: string) => {
    switch (errorType) {
      case 'auth': return 'Please log in again to continue with your upgrade.';
      case 'server': return 'Our servers are experiencing issues. Please try again in a few moments.';
      case 'stripe': return 'There was an issue processing your subscription. Your payment method was not charged.';
      case 'network': return 'Please check your internet connection and try again.';
      default: return 'Something went wrong during the upgrade process. Please try again.';
    }
  };

  const errorType = getErrorType(error.message);

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
          <AlertTriangle className="w-5 h-5" />
          {getErrorTitle(errorType)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-red-700 dark:text-red-300">
          {getErrorDescription(errorType)}
        </p>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 font-mono">
            {error.message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onRetry}
            disabled={isRetrying}
            className="flex-1"
          >
            {isRetrying ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Try Again
          </Button>
          <Button 
            onClick={onContactSupport}
            variant="outline"
            className="flex-1"
          >
            Contact Support
          </Button>
        </div>

        {errorType === 'auth' && (
          <div className="text-center">
            <Button 
              onClick={() => window.location.href = '/login'}
              variant="link"
              className="text-sm"
            >
              Go to Login Page
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpgradeErrorBoundary;
