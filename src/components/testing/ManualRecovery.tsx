
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ManualRecovery = () => {
  const [email, setEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runManualRecovery = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsRecovering(true);
    setResults(null);
    
    try {
      console.log('🔧 Running manual recovery for:', email);
      
      const { data, error } = await supabase.functions.invoke('manual-signup-recovery', {
        body: { email: email.trim() }
      });
      
      if (error) {
        throw error;
      }
      
      setResults(data);
      toast({
        title: data.success ? "Recovery Successful" : "Recovery Failed",
        description: data.message || "Manual recovery completed",
        variant: data.success ? "default" : "destructive",
      });
      
    } catch (error: any) {
      console.error('❌ Manual recovery error:', error);
      toast({
        title: "Recovery Error",
        description: error.message || "Failed to run manual recovery",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Manual Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manually recover a specific user account by email address.
        </p>

        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email Address</Label>
          <Input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>

        <Button 
          onClick={runManualRecovery}
          disabled={isRecovering || !email.trim()}
          className="w-full"
        >
          {isRecovering ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recovering...
            </>
          ) : (
            'Run Manual Recovery'
          )}
        </Button>

        {results && (
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <div className="text-sm font-medium">
                {results.success ? 'Success' : 'Failed'}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {results.message}
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

export default ManualRecovery;
