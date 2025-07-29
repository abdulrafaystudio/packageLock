
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, CreditCard, Calendar, RefreshCw, AlertTriangle, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/profile/ProfileProviderV3';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { clearAllProfileCache, forceProfileRefresh } from '@/utils/cache-manager';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const UpgradeSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();
  const { refreshProfile, packageType, loading } = useProfile();
  const { toast } = useToast();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<'processing' | 'success' | 'failed' | 'retrying' | 'recovering'>('processing');
  const [retryCount, setRetryCount] = useState(0);
  const [upgradeDetails, setUpgradeDetails] = useState<any>(null);

  const MAX_RETRIES = 3;

  useEffect(() => {
    const handleUpgradeSuccess = async () => {
      const session = searchParams.get('session_id');
      if (!session || !user) {
        toast({
          title: "Invalid Session",
          description: "No session information found. Please try again.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setSessionId(session);
      await processUpgrade(session);
    };

    const processUpgrade = async (sessionId: string) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setUpgradeStatus('processing');
      
      try {
        console.log('🚀 PROCESSING UPGRADE:', sessionId);
        
        // Phase 1: Clear all cache before processing (Critical Fix)
        console.log('🗑️ Clearing all caches...');
        clearAllProfileCache();
        
        // Phase 2: Call enhanced upgrade processor with better error handling
        console.log('📞 Calling upgrade processor...');
        const { data: upgradeResult, error: upgradeError } = await supabase.functions.invoke('handle-upgrade-success', {
          body: { session_id: sessionId }
        });

        if (upgradeError) {
          console.error('❌ Upgrade processing failed:', upgradeError);
          throw new Error(`Upgrade processing failed: ${upgradeError.message}`);
        }

        if (upgradeResult?.success && upgradeResult?.upgrade_completed) {
          console.log('✅ UPGRADE SUCCESSFUL:', upgradeResult);
          
          setUpgradeDetails(upgradeResult.profile);
          
          // Phase 3: Force immediate cache invalidation and refresh (High Priority Fix)
          console.log('🔄 Force refreshing all data...');
          clearAllProfileCache();
          
          // Force multiple refresh cycles to ensure data consistency
          await refreshProfile();
          if (checkSubscription) {
            await checkSubscription();
          }
          
           // Wait a moment and refresh again to ensure data is synced
           setTimeout(async () => {
             console.log('🔄 Second refresh cycle...');
             await refreshProfile();
             if (checkSubscription) {
               await checkSubscription();
             }
             
             // Trigger upgrade complete event for other components
             window.dispatchEvent(new CustomEvent('upgrade-complete', { 
               detail: { 
                 user_id: user?.id, 
                 package_type: upgradeResult.profile?.package_type 
               }
             }));
           }, 1000);
          
          setUpgradeStatus('success');
          
          toast({
            title: "🎉 Upgrade Successful!",
            description: "Your subscription has been upgraded and is now active. You have immediate access to all premium features!",
            duration: 8000,
          });
          
          // Force hard refresh to show upgraded package immediately
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          
        } else {
          throw new Error('Upgrade processing incomplete - no success confirmation');
        }
        
      } catch (error) {
        console.error('💥 UPGRADE FAILED:', error);
        
        if (retryCount < MAX_RETRIES) {
          setUpgradeStatus('retrying');
          setRetryCount(prev => prev + 1);
          
          console.log(`🔄 RETRYING UPGRADE (${retryCount + 1}/${MAX_RETRIES})`);
          
          // Exponential backoff retry
          const delay = Math.pow(2, retryCount) * 2000;
          setTimeout(async () => {
            await performUpgradeRetry();
          }, delay);
        } else {
          setUpgradeStatus('failed');
          toast({
            title: "Upgrade Processing Issue",
            description: "Your payment was successful, but there was an issue activating your new plan. Please try the recovery options below.",
            variant: "destructive",
          });
        }
      } finally {
        setIsProcessing(false);
      }
    };

    const performUpgradeRetry = async () => {
      try {
        setIsProcessing(true);
        console.log('🔄 Performing upgrade retry...');
        
        // Clear cache and force refresh
        clearAllProfileCache();
        await refreshProfile();
        
        // Try sync function as fallback
        const { data: syncResult } = await supabase.functions.invoke('sync-user-profile');
        
        if (syncResult?.success) {
          console.log('✅ RETRY SUCCESSFUL via sync');
          
          await refreshProfile();
          if (checkSubscription) {
            await checkSubscription();
          }
          
        setUpgradeStatus('success');
        
        toast({
          title: "🎉 Upgrade Activated!",
          description: "Your subscription has been successfully activated!",
        });
        
        // Force hard refresh to show upgraded package immediately
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        } else {
          throw new Error('Sync retry failed');
        }
      } catch (error) {
        console.error('❌ RETRY FAILED:', error);
        if (retryCount >= MAX_RETRIES) {
          setUpgradeStatus('failed');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    handleUpgradeSuccess();
  }, [searchParams, user, refreshProfile, toast, checkSubscription, retryCount, isProcessing]);

  const handleManualSync = async () => {
    setIsProcessing(true);
    
    try {
      console.log('🔄 MANUAL SYNC TRIGGERED');
      
      // Clear all cache
      clearAllProfileCache();
      
      // Force refresh everything
      await refreshProfile();
      
      // Force sync
      const { data: syncResult } = await supabase.functions.invoke('sync-user-profile');
      
      if (syncResult?.success) {
        await refreshProfile();
        if (checkSubscription) {
          await checkSubscription();
        }
        
        setUpgradeStatus('success');
        
        toast({
          title: "✅ Sync Successful",
          description: "Your subscription data has been updated successfully.",
        });
        
        // Force hard refresh to show upgraded package immediately
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error('Manual sync failed');
      }
    } catch (error) {
      console.error('❌ MANUAL SYNC FAILED:', error);
      toast({
        title: "Sync Failed",
        description: "Manual sync failed. Please try the recovery option.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeRecovery = async () => {
    setIsProcessing(true);
    setUpgradeStatus('recovering');
    
    try {
      console.log('🔧 RUNNING UPGRADE RECOVERY');
      
      // Clear all cache
      clearAllProfileCache();
      
      // Call the recovery function
      const { data: recoveryResult, error: recoveryError } = await supabase.functions.invoke('upgrade-recovery');
      
      if (recoveryError) {
        throw new Error(`Recovery failed: ${recoveryError.message}`);
      }
      
      if (recoveryResult?.success) {
        console.log('✅ RECOVERY SUCCESSFUL:', recoveryResult);
        
        // Update local state with recovery results
        if (recoveryResult.recovered_subscriptions?.length > 0) {
          const latestSubscription = recoveryResult.recovered_subscriptions[0];
          setUpgradeDetails({
            package_type: latestSubscription.package_type,
            subscription_status: latestSubscription.status,
            subscription_end: latestSubscription.subscription_end
          });
        }
        
        setUpgradeStatus('success');
        
        // Force complete refresh
        await refreshProfile();
        if (checkSubscription) {
          await checkSubscription();
        }
        
        toast({
          title: "🎉 Recovery Successful!",
          description: "Your subscription has been recovered and activated successfully!",
          duration: 8000,
        });
        
        // Force hard refresh to show upgraded package immediately
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error('Recovery did not return success');
      }
    } catch (error) {
      console.error('❌ RECOVERY FAILED:', error);
      toast({
        title: "Recovery Failed",
        description: error instanceof Error ? error.message : "Recovery process failed. Please contact support.",
        variant: "destructive",
      });
      setUpgradeStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceRefresh = () => {
    console.log('🔄 FORCING COMPLETE REFRESH');
    forceProfileRefresh();
  };

  const handleContinue = () => {
    navigate('/');
  };

  const handleManageSubscription = () => {
    navigate('/subscription');
  };

  const getStatusIcon = () => {
    switch (upgradeStatus) {
      case 'success':
        return <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />;
      case 'failed':
        return <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />;
      case 'recovering':
        return <Wrench className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />;
      default:
        return <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (upgradeStatus) {
      case 'success':
        return 'Upgrade Complete!';
      case 'failed':
        return 'Upgrade Processing Issue';
      case 'recovering':
        return 'Recovering Subscription...';
      case 'retrying':
        return `Retrying Upgrade... (${retryCount}/${MAX_RETRIES})`;
      default:
        return 'Processing Upgrade...';
    }
  };

  const getStatusDescription = () => {
    switch (upgradeStatus) {
      case 'success':
        return "Your subscription has been upgraded successfully and you now have immediate access to all premium features.";
      case 'failed':
        return "Your payment was successful, but there was an issue activating your new plan. Please try the recovery options below.";
      case 'recovering':
        return "We're running a comprehensive recovery process to activate your subscription. This may take a moment.";
      case 'retrying':
        return "We're working to activate your upgrade. Please wait while we retry the process.";
      default:
        return "Please wait while we activate your new subscription and grant access to premium features.";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
              {getStatusIcon()}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {getStatusTitle()}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {getStatusDescription()}
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Upgrade Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Status</span>
                <span className={`font-semibold ${
                  upgradeStatus === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : upgradeStatus === 'failed'
                    ? 'text-red-600 dark:text-red-400'
                    : upgradeStatus === 'recovering'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {upgradeStatus === 'success' ? 'Active' : 
                   upgradeStatus === 'failed' ? 'Failed' : 
                   upgradeStatus === 'recovering' ? 'Recovering' : 'Processing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Current Plan</span>
                <span className="text-gray-900 dark:text-white font-semibold capitalize">
                  {loading ? 'Updating...' : upgradeDetails?.package_type || packageType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Payment Status</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">Paid</span>
              </div>
              {sessionId && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Session ID</span>
                  <span className="text-gray-900 dark:text-white font-mono text-sm">
                    {sessionId.slice(0, 20)}...
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced recovery options for failed upgrades */}
          {upgradeStatus === 'failed' && (
            <Card className="mb-8 border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    Recovery Options Available
                  </h3>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Your payment was successful. Try these recovery options to activate your upgrade:
                  </p>
                  <div className="grid gap-3">
                    <Button 
                      onClick={handleUpgradeRecovery}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Wrench className="w-4 h-4 animate-pulse mr-2" />
                      ) : (
                        <Wrench className="w-4 h-4 mr-2" />
                      )}
                      Full Recovery Process
                    </Button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Button 
                        onClick={handleManualSync}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Manual Sync
                      </Button>
                      <Button 
                        onClick={handleForceRefresh}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex-1"
                      >
                        Force Refresh
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {upgradeStatus === 'success' && (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Access Features</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Start using your new plan</p>
                    </div>
                  </div>
                  <Button onClick={handleContinue} className="w-full">
                    Continue to Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Manage Subscription</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Update billing & preferences</p>
                    </div>
                  </div>
                  <Button onClick={handleManageSubscription} variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If you continue to experience issues, please{' '}
              <button 
                onClick={() => navigate('/support')}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                contact support
              </button>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UpgradeSuccess;
