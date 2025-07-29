
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStage, setProcessingStage] = useState('Verifying payment...');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const sessionId = searchParams.get('session_id');

const processPaymentSuccess = async () => {
    if (!sessionId) {
      console.error('❌ No session_id found in URL parameters');
      toast({
        title: "Invalid Session",
        description: "No session ID found. Redirecting to home.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    console.log('🔄 Starting payment processing with session_id:', sessionId);

    try {
      console.log('🎉 Processing payment success for session:', sessionId);
      setProcessingStage('Verifying payment status...');
      
      // Step 1: Wait for webhook processing (5 seconds - webhooks are now faster)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Step 2: Check if webhook created the account (with retry)
      setProcessingStage('Checking account creation...');
      
      let accountCreated = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 Attempt ${attempt} to check account creation`);
        
        const { data: authData, error: authError } = await supabase.functions.invoke('auth-success-helper', {
          body: { session_id: sessionId }
        });

        if (!authError && authData?.user_exists && authData?.account_complete) {
          console.log('✅ Account fully created by webhook');
          accountCreated = true;
          break;
        }
        
        if (attempt < 3) {
          console.log(`⏳ Account not ready, waiting ${attempt * 2}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }

      if (accountCreated) {
        setSuccess(true);
        setIsProcessing(false);
        
        toast({
          title: "Payment Successful!",
          description: "Your account has been created and subscription activated. Please check your email for login instructions.",
        });
        
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Step 3: If webhook failed, try payment scanner
      console.log('⚠️ Webhook failed, trying payment scanner...');
      setProcessingStage('Recovering account...');
      
      const { data: scannerResult, error: scannerError } = await supabase.functions.invoke('payment-scanner', {
        body: { sessionId }
      });

      if (!scannerError && scannerResult?.recovered > 0) {
        console.log('✅ Account recovered by payment scanner');
        setSuccess(true);
        setIsProcessing(false);
        
        toast({
          title: "Account Created Successfully!",
          description: "Your payment was processed and account created. Please check your email for login instructions.",
        });
        
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Step 4: Final fallback - manual recovery with session_id
      console.log('⚠️ Payment scanner failed, trying manual recovery with session_id...');
      setProcessingStage('Manual account recovery...');
      
      const { data: recoveryResult, error: recoveryError } = await supabase.functions.invoke('manual-signup-recovery', {
        body: { session_id: sessionId }
      });

      if (!recoveryError && recoveryResult?.success) {
        console.log('✅ Account recovered manually');
        
        setSuccess(true);
        setIsProcessing(false);
        
        toast({
          title: "Account Created Successfully!",
          description: "Your payment was processed and account created. Please check your email for login instructions.",
        });
        
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // If manual recovery failed, show error with helpful message
      throw new Error('Account creation failed. Your payment was successful, but we need to manually set up your account. Please contact support with your session ID.');
      
    } catch (error: any) {
      console.error('💥 Payment processing error:', error);
      setError(error.message);
      setIsProcessing(false);
      
      toast({
        title: "Account Setup Issue",
        description: "Your payment was successful, but we're having trouble creating your account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handleManualRetry = async () => {
    setIsRetrying(true);
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setProcessingStage('Retrying account creation...');
    
    await processPaymentSuccess();
    setIsRetrying(false);
  };

  useEffect(() => {
    processPaymentSuccess();
  }, []);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your subscription has been activated. You now have access to all premium features.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Continue to Dashboard
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              You'll be redirected automatically in a few seconds.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Your Payment
            </h2>
            <p className="text-gray-600 mb-4">
              {processingStage}
            </p>
            <div className="text-sm text-gray-500">
              Please wait while we activate your subscription...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Setup in Progress
          </h2>
          <p className="text-gray-600 mb-6">
            Your payment was successful! We're still setting up your account. This usually resolves automatically.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            If this continues, please contact support with session ID: {sessionId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSuccess;
