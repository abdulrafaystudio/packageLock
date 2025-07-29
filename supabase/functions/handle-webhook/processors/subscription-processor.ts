import { logStep } from '../utils/logging.ts';
import { enhancedSafeSaveStripeCustomerId } from '../utils/enhanced-safe-save.ts';

export const processSubscriptionEvent = async (
  event: any,
  supabaseClient: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const subscription = event.data.object;
    const eventType = event.type;
    
    logStep('SUBSCRIPTION_EVENT', `Processing ${eventType} for subscription: ${subscription.id}`);

    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const currentPeriodEnd = subscription.current_period_end;

    if (!customerId) {
      logStep('SUBSCRIPTION_ERROR', 'No customer ID found in subscription');
      return { success: false, error: 'No customer ID found' };
    }

    // Get customer email from Stripe data or our database
    let customerEmail = subscription.metadata?.email;
    if (!customerEmail) {
      // Fallback: get from subscribers table
      const { data: subscriber } = await supabaseClient
        .from('subscribers')
        .select('email')
        .eq('stripe_customer_id', customerId)
        .single();
      
      customerEmail = subscriber?.email;
    }

    if (!customerEmail) {
      logStep('SUBSCRIPTION_ERROR', 'No customer email found');
      return { success: false, error: 'No customer email found' };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, package_type')
      .eq('email', customerEmail.toLowerCase())
      .single();

    if (profileError || !profile) {
      logStep('SUBSCRIPTION_ERROR', `No profile found for email: ${customerEmail}`);
      return { success: false, error: 'Profile not found' };
    }

    // ENHANCED: Determine subscription tier from price ID using database function
    let subscriptionTier = 'standard';
    if (subscription.items?.data?.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      logStep('SUBSCRIPTION_TIER_LOOKUP', `Looking up tier for price ID: ${priceId}`);
      
      // Use database function to get package type from price ID
      const { data: tierFromPrice, error: tierError } = await supabaseClient.rpc(
        'get_package_type_from_price_id', 
        { p_price_id: priceId }
      );
      
      if (tierError) {
        logStep('SUBSCRIPTION_TIER_ERROR', `Failed to get tier from price ID ${priceId}: ${tierError.message}`);
        // Fallback to amount-based determination
        const amount = subscription.items.data[0].price.unit_amount || 0;
        if (amount <= 999) subscriptionTier = 'standard';
        else if (amount <= 1999) subscriptionTier = 'premium';
        else if (amount <= 4999) subscriptionTier = 'premiumpro';
        else subscriptionTier = 'enterprise';
        logStep('SUBSCRIPTION_TIER_FALLBACK', `Using fallback tier: ${subscriptionTier} for amount: ${amount}`);
      } else if (tierFromPrice) {
        subscriptionTier = tierFromPrice;
        logStep('SUBSCRIPTION_TIER_SUCCESS', `Found tier from price ID: ${subscriptionTier}`);
      } else {
        logStep('SUBSCRIPTION_TIER_WARNING', `No tier mapping found for price ID: ${priceId}`);
        // Keep default 'standard' tier
      }
    } else {
      logStep('SUBSCRIPTION_TIER_WARNING', 'No subscription items found, using default tier');
    }

    // Convert subscription status
    const subscriptionStatus = mapStripeStatus(status);
    const subscriptionEnd = new Date(currentPeriodEnd * 1000).toISOString();

    logStep('SUBSCRIPTION_DATA', {
      subscriptionId,
      tier: subscriptionTier,
      status: subscriptionStatus,
      end: subscriptionEnd,
      eventType,
      priceId: subscription.items?.data?.[0]?.price?.id
    });

    // Save with subscription ID using enhanced safe save
    const saveResult = await enhancedSafeSaveStripeCustomerId(
      supabaseClient,
      profile.id,
      customerEmail.toLowerCase(),
      customerId,
      subscriptionTier,
      subscriptionStatus,
      subscriptionEnd,
      subscriptionId
    );

    if (!saveResult.success) {
      logStep('SUBSCRIPTION_ERROR', `Failed to save subscription: ${saveResult.error}`);
      return { success: false, error: saveResult.error };
    }

    // IMMEDIATE CACHE INVALIDATION
    await supabaseClient
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    logStep('SUBSCRIPTION_SUCCESS', {
      email: customerEmail,
      subscriptionId,
      eventType,
      tier: subscriptionTier,
      message: 'Subscription processed successfully with price ID lookup'
    });

    return { success: true };

  } catch (error: any) {
    logStep('SUBSCRIPTION_EXCEPTION', `Error processing subscription: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const mapStripeStatus = (stripeStatus: string): string => {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    case 'trialing':
      return 'trialing';
    case 'unpaid':
      return 'past_due';
    default:
      return 'active';
  }
};
