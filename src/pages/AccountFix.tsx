import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const AccountFix = () => {
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFixAccount = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      console.log('🔧 Fixing account for:', email);
      
      const { data, error } = await supabase.functions.invoke('fix-user-account', {
        body: { 
          email: email.trim(),
          session_id: sessionId.trim() || undefined
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Account fix failed');
      }

      console.log('✅ Account fix successful:', data);
      setResult(data);
      
      toast({
        title: "Account Fixed!",
        description: data.message,
      });

    } catch (error: any) {
      console.error('❌ Account fix failed:', error);
      toast({
        title: "Fix Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Account Fix Tool</h1>
          <p className="text-muted-foreground mt-2">
            Fix accounts that got stuck during payment processing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fix User Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <Label htmlFor="sessionId">Stripe Session ID (Optional)</Label>
              <Input
                id="sessionId"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="cs_test_... (optional)"
              />
            </div>

            <Button 
              onClick={handleFixAccount}
              disabled={isProcessing || !email}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing Account...
                </>
              ) : (
                'Fix Account'
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Account Fixed Successfully
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {result.email}</p>
                <p><strong>User ID:</strong> {result.user_id}</p>
                <p><strong>Action:</strong> {result.action}</p>
                {result.temp_password && (
                  <p><strong>Temporary Password:</strong> {result.temp_password}</p>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  The account has been fixed and is now ready for login.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Enter the email address of the stuck account</li>
              <li>• Optionally provide the Stripe session ID for more accurate processing</li>
              <li>• This tool will fix database inconsistencies and create missing auth accounts</li>
              <li>• For the specific case: r.salh@gmail.com with session cs_test_b14NuU8FQXzIkUjsuT1ltV2Zqc3IPHoVmLm7NDNyj0A8P85aQ1jgJW5yrY</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountFix;