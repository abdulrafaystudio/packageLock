
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PaymentScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runPaymentScanner = async () => {
    setIsScanning(true);
    setResults(null);
    
    try {
      console.log('🔍 Running payment scanner...');
      
      const { data, error } = await supabase.functions.invoke('payment-scanner');
      
      if (error) {
        throw error;
      }
      
      setResults(data);
      toast({
        title: "Payment Scanner Complete",
        description: `Processed ${data.processedCount || 0} payments`,
      });
      
    } catch (error: any) {
      console.error('❌ Payment scanner error:', error);
      toast({
        title: "Scanner Error",
        description: error.message || "Failed to run payment scanner",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Payment Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Scan for incomplete signups with successful payments and create missing accounts.
        </p>

        <Button 
          onClick={runPaymentScanner}
          disabled={isScanning}
          className="w-full"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            'Run Payment Scanner'
          )}
        </Button>

        {results && (
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium">Scan Results:</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              • Processed: {results.processedCount || 0}
              • Errors: {results.errorCount || 0}
            </div>
            {results.details && (
              <pre className="text-xs overflow-auto max-h-32">
                {JSON.stringify(results.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentScanner;
