import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RecoveryResult {
  email: string;
  status: 'recovered' | 'already_exists' | 'error';
  userId?: string;
  tempPassword?: string;
  error?: string;
}

interface RecoveryResponse {
  success: boolean;
  recoveredAccounts: number;
  totalProcessed: number;
  results: RecoveryResult[];
  processedWebhooks: number;
  error?: string;
}

const RecoveryProcessor = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RecoveryResponse | null>(null);
  const { toast } = useToast();

  const runRecovery = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🔄 Starting recovery processor...');
      
      const { data, error } = await supabase.functions.invoke('recovery-processor');
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ Recovery completed:', data);
      setResults(data);
      
      if (data.success) {
        toast({
          title: "Recovery Completed",
          description: `Successfully recovered ${data.recoveredAccounts} accounts and processed ${data.processedWebhooks} webhooks.`,
        });
      } else {
        throw new Error(data.error || 'Recovery failed');
      }
      
    } catch (error: any) {
      console.error('💥 Recovery error:', error);
      setResults({
        success: false,
        error: error.message,
        recoveredAccounts: 0,
        totalProcessed: 0,
        results: [],
        processedWebhooks: 0
      });
      
      toast({
        title: "Recovery Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recovered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'already_exists':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recovered':
        return 'bg-green-100 text-green-800';
      case 'already_exists':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Account Recovery Processor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runRecovery}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Run Recovery
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
                  Recovery failed: {results.error}
                </AlertDescription>
              </Alert>
            )}

            {results.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Recovery completed successfully! Recovered {results.recoveredAccounts} accounts 
                  and processed {results.processedWebhooks} webhook events.
                </AlertDescription>
              </Alert>
            )}

            {results.results && results.results.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recovery Results:</h4>
                <div className="space-y-2">
                  {results.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.email}</div>
                          {result.userId && (
                            <div className="text-sm text-gray-500">User ID: {result.userId}</div>
                          )}
                          {result.error && (
                            <div className="text-sm text-red-600">{result.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(result.status)}>
                          {result.status.replace('_', ' ')}
                        </Badge>
                        {result.tempPassword && (
                          <Badge variant="outline" className="font-mono text-xs">
                            Temp Password Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecoveryProcessor;