
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const BackfillInterface = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runBackfill = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('backfill-subscription-dates');

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Backfill Completed",
        description: `Successfully updated ${data.successCount} subscriptions`,
      });

    } catch (error: any) {
      console.error('Backfill error:', error);
      toast({
        title: "Backfill Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setResult({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Subscription Dates Backfill
        </CardTitle>
        <CardDescription>
          Fix missing subscription end dates by syncing with Stripe data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            This process will:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Find subscribers with missing subscription end dates</li>
            <li>Query Stripe for current subscription data</li>
            <li>Update database with correct end dates</li>
            <li>Mark cancelled subscriptions appropriately</li>
          </ul>
        </div>

        <Button 
          onClick={runBackfill} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Backfill...
            </>
          ) : (
            'Run Backfill Process'
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-semibold">
                {result.success ? 'Success' : 'Error'}
              </span>
            </div>
            
            {result.success ? (
              <div className="space-y-1 text-sm">
                <p>Successfully updated: {result.successCount} subscriptions</p>
                {result.errorCount > 0 && (
                  <p>Errors encountered: {result.errorCount}</p>
                )}
                {result.errors?.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">View Errors</summary>
                    <ul className="mt-1 list-disc list-inside">
                      {result.errors.map((error: string, idx: number) => (
                        <li key={idx} className="text-xs">{error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ) : (
              <p className="text-sm">{result.error || 'Unknown error occurred'}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
