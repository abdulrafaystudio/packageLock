
export const enhancedSafeSaveStripeCustomerId = async (
  supabaseClient: any,
  userId: string,
  email: string,
  customerId: string,
  subscriptionTier: string,
  subscriptionStatus: string,
  subscriptionEnd: string,
  subscriptionId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Call the enhanced database function with subscription ID using correct function name
    const { data, error } = await supabaseClient.rpc('enhancedsafesavestripecustomerid', {
      p_user_id: userId,
      p_email: email.toLowerCase(),
      p_stripe_customer_id: customerId,
      p_package_type: subscriptionTier,
      p_subscription_status: subscriptionStatus,
      p_subscription_end: subscriptionEnd,
      p_stripe_subscription_id: subscriptionId || null
    });

    if (error) {
      console.error('[enhanced-safe-save] Database function error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('[enhanced-safe-save] Function returned failure:', data);
      return { success: false, error: data?.error_message || 'Unknown database error' };
    }

    console.log('[enhanced-safe-save] Successfully saved subscription data:', {
      userId,
      email,
      customerId,
      subscriptionId,
      subscriptionTier
    });

    return { success: true };

  } catch (error: any) {
    console.error('[enhanced-safe-save] Exception:', error);
    return { success: false, error: error.message };
  }
};
