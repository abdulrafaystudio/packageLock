import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthSuccessStreamlined = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        console.log('🔄 Processing payment success for session:', sessionId);
        
        // PHASE 1 FIX: Intelligent polling instead of hardcoded wait
        let attempts = 0;
        const maxAttempts = 20; // 2 minutes total
        const checkInterval = 6000; // 6 seconds between checks
        
        const pollForAccount = async (): Promise<boolean> => {
          attempts++;
          console.log(`🔍 Checking account creation - attempt ${attempts}/${maxAttempts}`);
          
          try {
            const { data: authData, error } = await supabase.functions.invoke('auth-success-helper', {
              body: { session_id: sessionId }
            });
            
            if (error) {
              console.error('❌ auth-success-helper error:', error);
              return false;
            }
            
            // Check if account exists and is complete
            if (authData?.user_exists && authData?.account_complete) {
              console.log('✅ Account creation confirmed!');
              return true;
            }
            
            // PHASE 1 FIX: If helper returns false but we've tried many times, trigger recovery
            if (attempts >= 10 && !authData?.user_exists) {
              console.log('🔧 Triggering manual recovery after 10 attempts...');
              const { data: recoveryData } = await supabase.functions.invoke('manual-recovery', {
                body: { session_id: sessionId }
              });
              
              if (recoveryData?.success) {
                console.log('✅ Manual recovery succeeded!');
                return true;
              }
            }
            
            return false;
          } catch (err) {
            console.error('❌ Error during account check:', err);
            return false;
          }
        };
        
        // Initial immediate check
        if (await pollForAccount()) {
          setStatus('success');
          toast({
            title: "Payment Successful!",
            description: "Your account has been created. Please check your email for login instructions.",
          });
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Start polling
        const pollInterval = setInterval(async () => {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setStatus('error');
            toast({
              title: "Account Setup In Progress",
              description: "Your payment was successful! Account creation is taking longer than expected. Please check your email or contact support.",
              variant: "destructive",
            });
            return;
          }
          
          if (await pollForAccount()) {
            clearInterval(pollInterval);
            setStatus('success');
            toast({
              title: "Payment Successful!",
              description: "Your account has been created. Please check your email for login instructions.",
            });
            setTimeout(() => navigate('/login'), 3000);
          }
        }, checkInterval);
        
        // Cleanup on unmount
        return () => clearInterval(pollInterval);
        
      } catch (error) {
        console.error('💥 Critical payment processing error:', error);
        setStatus('error');
        toast({
          title: "Processing Issue", 
          description: "Your payment was successful, but account setup encountered an error. Please contact support with your session ID.",
          variant: "destructive",
        });
      }
    };

    processPayment();
  }, [sessionId, navigate, toast]);

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your subscription has been activated and account created.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Continue to Login
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting automatically in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600 mb-4">
              Please wait while we activate your subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing in Progress</h2>
          <p className="text-gray-600 mb-6">
            Your payment was successful! Account setup is still processing.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Continue to Dashboard
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            Please check your email for login instructions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSuccessStreamlined;