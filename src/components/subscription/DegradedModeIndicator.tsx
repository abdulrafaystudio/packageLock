
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface DegradedModeIndicatorProps {
  isOffline: boolean;
  isStripeUnavailable: boolean;
  lastSuccessfulCheck?: Date;
  onRetryConnection?: () => void;
  isRetrying?: boolean;
}

const DegradedModeIndicator: React.FC<DegradedModeIndicatorProps> = ({
  isOffline,
  isStripeUnavailable,
  lastSuccessfulCheck,
  onRetryConnection,
  isRetrying = false
}) => {
  if (!isOffline && !isStripeUnavailable) {
    return null;
  }

  const getStatusInfo = () => {
    if (isOffline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        title: 'Offline Mode',
        message: 'No internet connection detected. Using cached subscription data.',
        variant: 'destructive' as const
      };
    }

    if (isStripeUnavailable) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Service Degraded',
        message: 'Subscription service temporarily unavailable. Using cached data.',
        variant: 'default' as const
      };
    }

    return {
      icon: <Wifi className="h-4 w-4" />,
      title: 'Connected',
      message: 'All services operational.',
      variant: 'default' as const
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Alert variant={statusInfo.variant} className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{statusInfo.title}</span>
              <Badge variant={isOffline || isStripeUnavailable ? "destructive" : "default"}>
                {isOffline ? 'Offline' : isStripeUnavailable ? 'Degraded' : 'Online'}
              </Badge>
            </div>
            <AlertDescription className="mb-0">
              {statusInfo.message}
            </AlertDescription>
            {lastSuccessfulCheck && (
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {lastSuccessfulCheck.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {(isOffline || isStripeUnavailable) && onRetryConnection && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetryConnection}
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        )}
      </div>

      {/* Additional Info for Degraded Mode */}
      {(isOffline || isStripeUnavailable) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm space-y-1">
            <div className="font-medium">Available in degraded mode:</div>
            <ul className="text-xs space-y-0.5 ml-4">
              <li>• View cached subscription status</li>
              <li>• Access previously loaded features</li>
              <li>• Browse available plans</li>
            </ul>
            <div className="font-medium mt-2">Limited functionality:</div>
            <ul className="text-xs space-y-0.5 ml-4">
              <li>• Subscription changes require connection</li>
              <li>• Payment processing unavailable</li>
              <li>• Real-time status updates disabled</li>
            </ul>
          </div>
        </div>
      )}
    </Alert>
  );
};

export default DegradedModeIndicator;
