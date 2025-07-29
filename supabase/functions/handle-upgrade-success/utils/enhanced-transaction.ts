interface UpgradeTransactionData {
  userId: string;
  email: string;
  stripeCustomerId: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  stripeSubscriptionId: string;
}

interface TransactionResult {
  success: boolean;
  subscriberData?: any;
  profileUpdated: boolean;
  auditLogged: boolean;
  error?: string;
}

export async function enhancedAtomicUpgradeTransaction(
  supabaseClient: any,
  data: UpgradeTransactionData
): Promise<TransactionResult> {
  console.log('💾 Starting enhanced atomic upgrade transaction:', data);
  
  try {
    // Enhanced atomic transaction using the existing RPC function
    const { data: result, error } = await supabaseClient.rpc('enhancedsafesavestripecustomerid', {
      p_user_id: data.userId,
      p_email: data.email,
      p_stripe_customer_id: data.stripeCustomerId,
      p_package_type: data.subscriptionTier,
      p_subscription_status: data.subscriptionStatus,
      p_subscription_end: data.subscriptionEnd,
      p_stripe_subscription_id: data.stripeSubscriptionId
    });

    if (error) {
      console.error('❌ Enhanced transaction RPC failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }

    if (!result?.success) {
      console.error('❌ Enhanced transaction unsuccessful:', result);
      throw new Error(`Transaction unsuccessful: ${result?.error_message || 'Unknown error'}`);
    }

    console.log('✅ Enhanced atomic transaction completed successfully:', result);
    console.log('📊 Profiles updated flag:', result.profiles_updated);
    console.log('👤 Final user ID:', result.user_id);

    // Verify profiles table was actually updated
    try {
      const { data: profileCheck, error: profileError } = await supabaseClient
        .from('profiles')
        .select('package_type, subscription_status, subscription_end_date, updated_at')
        .eq('id', result.user_id)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not verify profile update:', profileError);
      } else {
        console.log('✅ Profile verification successful:', {
          package_type: profileCheck.package_type,
          subscription_status: profileCheck.subscription_status,
          subscription_end_date: profileCheck.subscription_end_date,
          updated_at: profileCheck.updated_at
        });
      }
    } catch (verifyError) {
      console.warn('⚠️ Profile verification failed:', verifyError);
    }

    // Send manual notification for immediate real-time updates
    try {
      console.log('📢 Sending manual upgrade notification with data:', {
        userId: data.userId,
        packageType: data.subscriptionTier,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionEnd: data.subscriptionEnd
      });
      
      const { data: notifyResult, error: notifyError } = await supabaseClient.rpc('send_upgrade_notification', {
        p_user_id: data.userId,
        p_package_type: data.subscriptionTier,
        p_subscription_status: data.subscriptionStatus,
        p_subscription_end: data.subscriptionEnd
      });
      
      if (notifyError) {
        console.error('❌ Notification RPC error:', notifyError);
        throw notifyError;
      }
      
      console.log('✅ Manual upgrade notification sent successfully:', notifyResult);
      
      // Also try to broadcast via Supabase realtime
      try {
        const broadcastPayload = {
          user_id: data.userId,
          package_type: data.subscriptionTier,
          subscription_status: data.subscriptionStatus,
          subscription_end: data.subscriptionEnd,
          updated_at: new Date().toISOString(),
          trigger_source: 'edge_function_broadcast',
          timestamp: Date.now()
        };
        
        console.log('📡 Broadcasting realtime event:', broadcastPayload);
        
        const broadcastChannel = supabaseClient.channel('profile_upgrade_complete');
        const broadcastResult = await broadcastChannel.send({
          type: 'broadcast',
          event: 'profile_upgrade_complete',
          payload: broadcastPayload
        });
        
        console.log('📡 Broadcast result:', broadcastResult);
      } catch (broadcastError) {
        console.warn('⚠️ Failed to send realtime broadcast:', broadcastError);
      }
      
    } catch (notifyError) {
      console.error('❌ Failed to send manual notification:', notifyError);
      // Don't fail the transaction for notification issues but log extensively
      console.log('🔄 Transaction will continue despite notification failure');
    }

    return {
      success: true,
      subscriberData: result,
      profileUpdated: true,
      auditLogged: true
    };

  } catch (error: any) {
    console.error('💥 Enhanced atomic transaction failed:', error);
    return {
      success: false,
      profileUpdated: false,
      auditLogged: false,
      error: error.message
    };
  }
}