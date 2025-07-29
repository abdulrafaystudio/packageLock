
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PasswordFixResult {
  email: string;
  user_id?: string;
  action: 'password_fixed' | 'password_fix_failed';
  success: boolean;
  error?: string;
}

interface PasswordFixResponse {
  success: boolean;
  summary: {
    total_found: number;
    fixed: number;
    errors: number;
  };
  results: PasswordFixResult[];
  error?: string;
}

const PasswordFixRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PasswordFixResponse | null>(null);
  const { toast } = useToast();

  const runPasswordFix = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🔐 Starting password fix utility...');
      
      const { data, error } = await supabase.functions.invoke('fix-existing-passwords');
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ Password fix completed:', data);
      setResults(data);
      
      if (data.success) {
        toast({
          title: "Password Fix Completed",
          description: `Successfully fixed ${data.summary.fixed} passwords out of ${data.summary.total_found} found.`,
        });
      } else {
        throw new Error(data.error || 'Password fix failed');
      }
      
    } catch (error: any) {
      console.error('💥 Password fix error:', error);
      setResults({
        success: false,
        error: error.message,
        summary: { total_found: 0, fixed: 0, errors: 0 },
        results: []
      });
      
      toast({
        title: "Password Fix Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (result: PasswordFixResult) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <X className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (result: PasswordFixResult) => {
    if (result.success) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password Fix Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runPasswordFix}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fixing Passwords...
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Fix Existing Passwords
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This utility fixes existing auth users who were created with random passwords instead of their stored signup passwords.
          </AlertDescription>
        </Alert>

        {results && (
          <div className="space-y-4">
            {!results.success && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Password fix failed: {results.error}
                </AlertDescription>
              </Alert>
            )}

            {results.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Password fix completed successfully! Fixed {results.summary.fixed} passwords 
                  out of {results.summary.total_found} eligible accounts.
                </AlertDescription>
              </Alert>
            )}

            {results.results && results.results.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Password Fix Results:</h4>
                <div className="space-y-2">
                  {results.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result)}
                        <div>
                          <div className="font-medium">{result.email}</div>
                          {result.user_id && (
                            <div className="text-sm text-gray-500">User ID: {result.user_id}</div>
                          )}
                          {result.error && (
                            <div className="text-sm text-red-600">{result.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(result)}>
                          {result.action.replace('_', ' ')}
                        </Badge>
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

export default PasswordFixRunner;
