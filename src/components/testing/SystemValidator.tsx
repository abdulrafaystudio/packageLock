import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, AlertTriangle, X, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  status: 'healthy' | 'warning' | 'error' | 'checking' | 'unhealthy' | 'degraded';
  message: string;
  details?: any;
  completionPercentage?: number;
}

interface ValidationResponse {
  success: boolean;
  timestamp: string;
  validation: {
    databaseFunctions: ValidationResult;
    webhookEvents: ValidationResult;
    userAccounts: ValidationResult;
    subscriptionSync: ValidationResult;
    overall: ValidationResult;
  };
  error?: string;
}

const SystemValidator = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationResponse | null>(null);
  const { toast } = useToast();

  const runValidation = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🔄 Starting system validation...');
      
      const { data, error } = await supabase.functions.invoke('system-validator');
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ Validation completed:', data);
      setResults(data);
      
      if (data.success) {
        const overall = data.validation.overall;
        toast({
          title: "Validation Completed",
          description: `System status: ${overall.message} (${overall.completionPercentage}% complete)`,
          variant: overall.status === 'healthy' ? 'default' : 'destructive',
        });
      } else {
        throw new Error(data.error || 'Validation failed');
      }
      
    } catch (error: any) {
      console.error('💥 Validation error:', error);
      setResults({
        success: false,
        timestamp: new Date().toISOString(),
        validation: {
          databaseFunctions: { status: 'error', message: 'Check failed' },
          webhookEvents: { status: 'error', message: 'Check failed' },
          userAccounts: { status: 'error', message: 'Check failed' },
          subscriptionSync: { status: 'error', message: 'Check failed' },
          overall: { status: 'unhealthy', message: error.message, completionPercentage: 0 }
        },
        error: error.message
      });
      
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'unhealthy':
        return <X className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    if (typeof details === 'string') return details;
    return JSON.stringify(details, null, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runValidation}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Run Validation
              </>
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {!results.success && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Validation failed: {results.error}
                </AlertDescription>
              </Alert>
            )}

            {results.validation.overall && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Overall System Health</h4>
                  <Badge className={getStatusColor(results.validation.overall.status)}>
                    {results.validation.overall.status.toUpperCase()}
                  </Badge>
                </div>
                
                {results.validation.overall.completionPercentage !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>System Completion</span>
                      <span>{results.validation.overall.completionPercentage}%</span>
                    </div>
                    <Progress value={results.validation.overall.completionPercentage} />
                  </div>
                )}
                
                <Alert className={
                  results.validation.overall.status === 'healthy' ? 'border-green-200' :
                  results.validation.overall.status === 'degraded' ? 'border-yellow-200' :
                  'border-red-200'
                }>
                  <AlertDescription>
                    {results.validation.overall.message}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-3">Component Health Checks:</h4>
              <div className="space-y-3">
                {Object.entries(results.validation).filter(([key]) => key !== 'overall').map(([key, result]) => (
                  <div key={key} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {result.message}
                        </div>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-blue-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                              {formatDetails(result.details)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {results.timestamp && (
              <div className="text-sm text-gray-500 pt-3 border-t">
                Last validated: {new Date(results.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemValidator;