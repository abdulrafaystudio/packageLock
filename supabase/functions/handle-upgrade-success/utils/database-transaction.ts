
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const atomicUpgradeTransaction = async (
  supabaseClient: any,
  upgradeData: {
    userId: string;
    email: string;
    stripeCustomerId: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    subscriptionEnd: string | null;
    stripeSubscriptionId: string;
  }
) => {
  const { userId, email, stripeCustomerId, subscriptionTier, subscriptionStatus, subscriptionEnd, stripeSubscriptionId } = upgradeData;
  
  // Start transaction-like operations
  try {
    console.log('[ATOMIC] Starting atomic upgrade transaction for:', email);
    
    // 1. Update subscriber record with full data
    const { error: subscriberError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: userId,
        email: email.toLowerCase().trim(),
        stripe_customer_id: stripeCustomerId,
        subscribed: subscriptionStatus === 'active',
        subscription_tier: subscriptionTier,
        subscription_status: subscriptionStatus,
        subscription_end: subscriptionEnd,
        current_period_end: subscriptionEnd,
        stripe_subscription_id: stripeSubscriptionId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (subscriberError) {
      throw new Error(`Subscriber upsert failed: ${subscriberError.message}`);
    }

    // 2. Update profile record to match exactly
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        package_type: subscriptionTier,
        subscription_status: subscriptionStatus,
        subscription_end_date: subscriptionEnd,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[ATOMIC] Profile update failed:', profileError);
      // Don't fail the transaction for profile updates
    }

    // 3. Log the successful upgrade
    await supabaseClient
      .from('subscription_audit')
      .insert({
        user_id: userId,
        action_type: 'immediate_upgrade',
        new_values: {
          subscription_tier: subscriptionTier,
          subscription_status: subscriptionStatus,
          stripe_subscription_id: stripeSubscriptionId,
          upgraded_at: new Date().toISOString()
        },
        source: 'handle-upgrade-success'
      });

    console.log('[ATOMIC] Atomic upgrade transaction completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('[ATOMIC] Transaction failed:', error);
    throw error;
  }
};
