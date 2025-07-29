
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Logging utilities
const logStep = (message: string, data?: any) => {
  console.log(`[WEBHOOK-RETRY] ${message}`, data ? JSON.stringify(data) : '');
};

const logError = (message: string, error?: any) => {
  console.error(`[WEBHOOK-RETRY] ERROR: ${message}`, error ? JSON.stringify(error) : '');
};

// Process checkout session completed events
const processCheckoutSessionCompleted = async (event: any, supabaseClient: any): Promise<{ success: boolean; error?: string }> => {
  const session = event.data.object;
  
  logStep("Processing checkout session completed", { 
    sessionId: session.id, 
    customerEmail: session.customer_details?.email 
  });

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new Error('Missing Stripe secret key');
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  
  try {
    // Get subscription details from Stripe
    let subscription = null;
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(session.subscription);
    }

    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      throw new Error('No customer email found in session');
    }

    // Get subscription tier from price ID
    const priceId = subscription?.items?.data[0]?.price?.id;
    const { data: planData } = await supabaseClient
      .from('subscription_plans')
      .select('package_type')
      .eq('stripe_price_id', priceId)
      .single();

    const subscriptionTier = planData?.package_type || 'standard';
    const subscriptionEnd = subscription?.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .single();

    if (profile) {
      // Call the enhanced safe save function
      const { data: saveResult, error: saveError } = await supabaseClient
        .rpc('enhancedsafesavestripecustomerid', {
          p_user_id: profile.id,
          p_email: customerEmail,
          p_stripe_customer_id: session.customer,
          p_package_type: subscriptionTier,
          p_subscription_status: 'active',
          p_subscription_end: subscriptionEnd,
          p_stripe_subscription_id: subscription?.id || null
        });

      if (saveError) {
        throw new Error(`Failed to save subscription data: ${saveError.message}`);
      }

      logStep("Checkout processing completed successfully", {
        email: customerEmail,
        subscriptionTier,
        subscriptionId: subscription?.id
      });

      return { success: true };
    } else {
      throw new Error('User profile not found');
    }

  } catch (error: any) {
    logError("Checkout processing failed", { error: error.message });
    return { success: false, error: error.message };
  }
};

// Process subscription events
const processSubscriptionEvent = async (event: any, supabaseClient: any): Promise<{ success: boolean; error?: string }> => {
  const subscription = event.data.object;
  
  logStep("Processing subscription event", { 
    subscriptionId: subscription.id, 
    eventType: event.type,
    status: subscription.status
  });

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new Error('Missing Stripe secret key');
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    if (!('email' in customer) || !customer.email) {
      throw new Error('Customer email not found');
    }

    const subscriptionEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;

    const { error: subscriberError } = await supabaseClient
      .from('subscribers')
      .update({
        subscription_status: subscription.status,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);

    if (subscriberError) {
      throw new Error(`Failed to update subscriber: ${subscriberError.message}`);
    }

    logStep("Subscription event processed successfully", {
      email: customer.email,
      status: subscription.status
    });

    return { success: true };

  } catch (error: any) {
    logError("Subscription processing failed", { error: error.message });
    return { success: false, error: error.message };
  }
};

// Process invoice events
const processInvoiceEvent = async (event: any, supabaseClient: any): Promise<{ success: boolean; error?: string }> => {
  const invoice = event.data.object;
  
  logStep("Processing invoice event", { 
    invoiceId: invoice.id, 
    eventType: event.type,
    status: invoice.status,
    subscriptionId: invoice.subscription
  });

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
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    if (!('email' in customer) || !customer.email) {
      throw new Error('Customer email not found');
    }

    const newSubscriptionEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;

    const { error: subscriberError } = await supabaseClient
      .from('subscribers')
      .update({
        subscription_end: newSubscriptionEnd,
        current_period_end: newSubscriptionEnd,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);

    if (subscriberError) {
      throw new Error(`Failed to update subscriber renewal: ${subscriberError.message}`);
    }

    logStep("Invoice renewal processed successfully", {
      email: customer.email,
      newEndDate: newSubscriptionEnd
    });

    return { success: true };

  } catch (error: any) {
    logError("Invoice processing failed", { error: error.message });
    return { success: false, error: error.message };
  }
};

// Main webhook event processing function
const processWebhookEvent = async (event: any, supabaseClient: any): Promise<{ success: boolean; error?: string }> => {
  try {
    logStep("Starting webhook event processing", { eventType: event.type, eventId: event.id });

    let processingResult = { success: false, error: '' };

    if (event.type === 'checkout.session.completed') {
      processingResult = await processCheckoutSessionCompleted(event, supabaseClient);
    }
    else if (event.type === 'customer.subscription.updated' || 
             event.type === 'customer.subscription.deleted' ||
             event.type === 'customer.subscription.created') {
      processingResult = await processSubscriptionEvent(event, supabaseClient);
    }
    else if (event.type === 'invoice.payment_succeeded' || 
             event.type === 'invoice.payment_failed') {
      processingResult = await processInvoiceEvent(event, supabaseClient);
    }
    else {
      logStep("Unhandled event type", { type: event.type });
      return { success: true };
    }

    if (!processingResult.success) {
      logStep("Adding failed webhook to retry queue", { 
        eventId: event.id, 
        error: processingResult.error 
      });
      
      await supabaseClient.from('webhook_retry_queue').insert({
        webhook_event_id: event.id,
        event_type: event.type,
        event_data: event,
        last_error: processingResult.error,
        status: 'pending'
      });
    }

    return processingResult;

  } catch (error: any) {
    logStep("Webhook event processing failed", { 
      error: error.message,
      eventType: event.type,
      eventId: event.id
    });

    try {
      await supabaseClient.from('webhook_retry_queue').insert({
        webhook_event_id: event.id,
        event_type: event.type,
        event_data: event,
        last_error: error.message,
        status: 'pending'
      });
    } catch (retryQueueError) {
      logStep("Failed to add to retry queue", { error: retryQueueError.message });
    }

    return { success: false, error: error.message };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Starting retry processing');

    const { data: retryItems, error: retryError } = await supabaseClient
      .from('webhook_retry_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('next_retry_at', new Date().toISOString())
      .lt('retry_count', 3)
      .limit(10);

    if (retryError) {
      throw new Error(`Failed to fetch retry items: ${retryError.message}`);
    }

    let processedCount = 0;
    let successCount = 0;

    for (const item of retryItems || []) {
      logStep(`Processing retry for event: ${item.webhook_event_id}`);

      await supabaseClient
        .from('webhook_retry_queue')
        .update({ 
          status: 'processing',
          retry_count: item.retry_count + 1
        })
        .eq('id', item.id);

      try {
        const result = await processWebhookEvent(item.event_data, supabaseClient);
        
        if (result.success) {
          await supabaseClient
            .from('webhook_retry_queue')
            .update({ status: 'completed' })
            .eq('id', item.id);
          
          successCount++;
          logStep(`Successfully processed retry for: ${item.webhook_event_id}`);
        } else {
          const nextRetryCount = item.retry_count + 1;
          if (nextRetryCount >= 3) {
            await supabaseClient
              .from('webhook_retry_queue')
              .update({ 
                status: 'failed',
                last_error: result.error 
              })
              .eq('id', item.id);
          } else {
            const nextRetryAt = new Date(Date.now() + Math.pow(2, nextRetryCount) * 60000);
            await supabaseClient
              .from('webhook_retry_queue')
              .update({ 
                status: 'pending',
                next_retry_at: nextRetryAt.toISOString(),
                last_error: result.error
              })
              .eq('id', item.id);
          }
        }
      } catch (retryError: any) {
        logError(`Error processing retry: ${retryError.message}`);
        
        const nextRetryCount = item.retry_count + 1;
        if (nextRetryCount >= 3) {
          await supabaseClient
            .from('webhook_retry_queue')
            .update({ 
              status: 'failed',
              last_error: retryError.message 
            })
            .eq('id', item.id);
        } else {
          const nextRetryAt = new Date(Date.now() + Math.pow(2, nextRetryCount) * 60000);
          await supabaseClient
            .from('webhook_retry_queue')
            .update({ 
              status: 'pending',
              next_retry_at: nextRetryAt.toISOString(),
              last_error: retryError.message
            })
            .eq('id', item.id);
        }
      }

      processedCount++;
    }

    logStep(`Completed processing: ${processedCount} total, ${successCount} successful`);

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      successful: successCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logError('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
