
import Stripe from "https://esm.sh/stripe@14.21.0";
import { logStep, logError } from '../utils/logging.ts';

export const processInvoiceEvent = async (event: any, supabaseClient: any): Promise<{ success: boolean; error?: string }> => {
  const invoice = event.data.object;
  
  logStep("Processing invoice event", { 
    invoiceId: invoice.id, 
    eventType: event.type,
    status: invoice.status,
    subscriptionId: invoice.subscription
  });

  // Only process successful payment events for subscription renewals
  if (event.type !== 'invoice.payment_succeeded' || !invoice.subscription) {
    logStep("Skipping non-renewal invoice event");
    return { success: true };
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new Error('Missing Stripe secret key');
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  
  try {
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    if (!('email' in customer) || !customer.email) {
      throw new Error('Customer email not found');
    }

    // Calculate new subscription end date
    const newSubscriptionEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;

    logStep("Processing autorenewal", {
      email: customer.email,
      subscriptionId: subscription.id,
      newEndDate: newSubscriptionEnd,
      invoiceId: invoice.id
    });

    // Update subscriber record with new end date
    const { error: subscriberError } = await supabaseClient
      .from('subscribers')
      .update({
        subscription_end: newSubscriptionEnd,
        current_period_end: newSubscriptionEnd,
        subscription_status: 'active', // Ensure status is active after successful payment
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);

    if (subscriberError) {
      throw new Error(`Failed to update subscriber renewal: ${subscriberError.message}`);
    }

    // Update profile table
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_end_date: newSubscriptionEnd,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);

    if (profileError) {
      logStep("WARNING: Failed to update profile renewal", { 
        email: customer.email, 
        error: profileError.message 
      });
    }

    // Log the renewal event
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (profile) {
      await supabaseClient.from('subscription_events').insert({
        user_id: profile.id,
        event_type: 'subscription_renewed',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: subscription.id,
          amount_paid: invoice.amount_paid,
          new_end_date: newSubscriptionEnd,
          renewal_date: new Date().toISOString()
        }
      });
    }

    logStep("Autorenewal processed successfully", {
      email: customer.email,
      newEndDate: newSubscriptionEnd
    });

    return { success: true };

  } catch (error) {
    logStep("ERROR in invoice processing", { 
      error: error.message,
      invoiceId: invoice.id,
      eventType: event.type
    });
    throw error;
  }
};
