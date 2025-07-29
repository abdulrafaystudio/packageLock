import React from 'react';
import { AlertCircle, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscriptionEnhanced } from '@/hooks/useSubscriptionEnhanced';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}

export const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({ 
  compact = false,
  showDetails = false 
}) => {
  const { 
    loading, 
    error, 
    canRetry, 
    retry, 
    retryCount, 
    nextRetryTime,
    subscribed,
    subscription_tier,
    subscription_status,
    subscription_end,
    refresh
  } = useSubscriptionEnhanced();

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (loading) return 'secondary';
    if (subscribed && subscription_status === 'active') return 'default';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (error) return <XCircle className="h-4 w-4" />;
    if (subscribed && subscription_status === 'active') return <CheckCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (error) return 'Connection Error';
    if (subscribed && subscription_status === 'active') return `${subscription_tier} Plan`;
    return 'Free Plan';
  };

  const getTimeUntilRetry = () => {
    if (!nextRetryTime) return null;
    const now = Date.now();
    const timeLeft = Math.max(0, Math.ceil((nextRetryTime - now) / 1000));
    return timeLeft > 0 ? timeLeft : null;
  };

  const timeUntilRetry = getTimeUntilRetry();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor()} className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        {error && canRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={retry}
            disabled={!!timeUntilRetry}
            className="h-6 px-2"
          >
            {timeUntilRetry ? (
              <>
                <Clock className="h-3 w-3 mr-1" />
                {timeUntilRetry}s
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  if (!showDetails && !error) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      {(error || showDetails) && (
        <CardContent>
          {error && (
            <div className="space-y-3">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium mb-1">Connection Issue</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              
              {retryCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  Retry attempts: {retryCount}/3
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retry}
                  disabled={!canRetry || !!timeUntilRetry}
                  className="flex-1"
                >
                  {timeUntilRetry ? (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Retry in {timeUntilRetry}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry Now
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  onClick={refresh}
                  className="flex-1"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
          
          {showDetails && !error && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium capitalize">{subscription_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{subscription_status}</span>
              </div>
              {subscription_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">
                    {new Date(subscription_end).toLocaleDateString()}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={refresh}
                className="w-full mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Status
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};