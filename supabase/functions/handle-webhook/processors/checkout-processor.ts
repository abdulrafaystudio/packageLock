
import { logStep } from '../utils/logging.ts';
import { enhancedSafeSaveStripeCustomerId } from '../utils/enhanced-safe-save.ts';

export const processCheckoutCompleted = async (
  event: any,
  supabaseClient: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const session = event.data.object;
    logStep('CHECKOUT_COMPLETED', `Processing session: ${session.id}`);

    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerId = session.customer;
    
    // CRITICAL FIX: Extract subscription ID from session
    const subscriptionId = session.subscription; // This was missing before!
    
    if (!customerEmail) {
      logStep('CHECKOUT_ERROR', 'No customer email found in session');
      return { success: false, error: 'No customer email found' };
    }

    if (!customerId) {
      logStep('CHECKOUT_ERROR', 'No customer ID found in session');
      return { success: false, error: 'No customer ID found' };
    }

    logStep('CHECKOUT_DATA', {
      email: customerEmail,
      customerId,
      subscriptionId, // Now logging subscription ID
      sessionId: session.id
    });

    // Get user from profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, package_type')
      .eq('email', customerEmail.toLowerCase())
      .single();

    if (profileError || !profile) {
      logStep('CHECKOUT_ERROR', `No profile found for email: ${customerEmail}`);
      return { success: false, error: 'Profile not found' };
    }

    // Determine subscription tier from session metadata or line items
    let subscriptionTier = 'standard'; // default
    let subscriptionEnd = null;

    // Try to get tier from session metadata first
    if (session.metadata?.package_type) {
      subscriptionTier = session.metadata.package_type;
    } else if (session.line_items?.data?.length > 0) {
      // Fallback: determine from price
      const lineItem = session.line_items.data[0];
      const price = lineItem.price;
      
      if (price?.unit_amount) {
        const amount = price.unit_amount;
        if (amount <= 999) subscriptionTier = 'standard';
        else if (amount <= 1999) subscriptionTier = 'premium';
        else if (amount <= 4999) subscriptionTier = 'premiumpro';
        else subscriptionTier = 'enterprise';
      }
    }

    // Calculate subscription end date (30 days from now for monthly, 365 for yearly)
    const billingFrequency = session.metadata?.billing_frequency || 'monthly';
    const daysToAdd = billingFrequency === 'yearly' ? 365 : 30;
    subscriptionEnd = new Date(Date.now() + (daysToAdd * 24 * 60 * 60 * 1000)).toISOString();

    logStep('CHECKOUT_PROCESSING', {
      subscriptionTier,
      subscriptionEnd,
      subscriptionId,
      billingFrequency
    });

    // ENHANCED: Save with subscription ID using the updated function
    const saveResult = await enhancedSafeSaveStripeCustomerId(
      supabaseClient,
      profile.id,
      customerEmail.toLowerCase(),
      customerId,
      subscriptionTier,
      'active',
      subscriptionEnd,
      subscriptionId // Now passing the subscription ID!
    );

    if (!saveResult.success) {
      logStep('CHECKOUT_ERROR', `Failed to save subscription data: ${saveResult.error}`);
      return { success: false, error: saveResult.error };
    }

    // IMMEDIATE CACHE INVALIDATION: Force profile refresh
    await supabaseClient
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    logStep('CHECKOUT_SUCCESS', {
      email: customerEmail,
      tier: subscriptionTier,
      subscriptionId,
      message: 'Checkout completed successfully with subscription ID'
    });

    return { success: true };

  } catch (error: any) {
    logStep('CHECKOUT_EXCEPTION', `Error processing checkout: ${error.message}`);
    return { success: false, error: error.message };
  }
};
