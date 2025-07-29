
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      logStep("Missing signature or webhook secret");
      throw new Error('Missing webhook signature or secret');
    }

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified successfully", { eventId: event.id });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Store webhook event for debugging
    await supabaseAdmin.from('webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event.data,
      processed: false
    });

    // Handle customer.subscription.updated events (upgrades)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      
      logStep("Processing subscription update", { 
        subscriptionId: subscription.id,
        status: subscription.status,
        previousAttributes: event.data.previous_attributes
      });

      // Get customer
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (!customer || customer.deleted) {
        logStep("Customer not found or deleted", { customerId: subscription.customer });
        return new Response(JSON.stringify({ success: false, error: 'Customer not found' }), { status: 400 });
      }
      
      const customerEmail = (customer as Stripe.Customer).email;
      if (!customerEmail) {
        logStep("Customer email not found");
        return new Response(JSON.stringify({ success: false, error: 'Customer email not found' }), { status: 400 });
      }

      // Get package type from price
      const priceId = subscription.items.data[0].price.id;
      const { data: packageData } = await supabaseAdmin
        .from('subscription_plans')
        .select('package_type')
        .eq('stripe_price_id', priceId)
        .single();
      
      if (!packageData) {
        logStep("Package type not found for price", { priceId });
        return new Response(JSON.stringify({ success: false, error: 'Package type not found' }), { status: 400 });
      }

      // Update subscriber using enhancedsafesavestripecustomerid
      const { error: updateError } = await supabaseAdmin.rpc('enhancedsafesavestripecustomerid', {
        p_user_id: null,
        p_email: customerEmail,
        p_stripe_customer_id: customer.id,
        p_package_type: packageData.package_type,
        p_subscription_status: 'active',
        p_subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
        p_stripe_subscription_id: subscription.id
      });
      
      if (updateError) {
        logStep("Failed to update subscriber via customer.subscription.updated", { error: updateError });
        throw new Error(`Failed to update subscriber: ${updateError.message}`);
      }
      
      logStep("Subscription updated successfully via customer.subscription.updated", { 
        email: customerEmail, 
        packageType: packageData.package_type 
      });
      
      // Mark webhook as processed
      await supabaseAdmin.from('webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('stripe_event_id', event.id);
      
      return new Response(JSON.stringify({ success: true, message: 'Subscription updated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle invoice.payment_succeeded events (including upgrades)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      
      logStep("Processing invoice payment succeeded", { 
        invoiceId: invoice.id,
        billingReason: invoice.billing_reason,
        subscriptionId: invoice.subscription
      });

      if (invoice.subscription) {
        // Get the subscription details
        const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string, {
          expand: ['items.data.price']
        });
        
        // Get customer
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        if (!customer || customer.deleted) {
          logStep("Customer not found or deleted", { customerId: invoice.customer });
          return new Response(JSON.stringify({ success: false, error: 'Customer not found' }), { status: 400 });
        }
        
        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          logStep("Customer email not found");
          return new Response(JSON.stringify({ success: false, error: 'Customer email not found' }), { status: 400 });
        }
        
        // Get package type from price
        const priceId = stripeSubscription.items.data[0].price.id;
        const { data: packageData } = await supabaseAdmin
          .from('subscription_plans')
          .select('package_type')
          .eq('stripe_price_id', priceId)
          .single();
        
        if (!packageData) {
          logStep("Package type not found for price", { priceId });
          return new Response(JSON.stringify({ success: false, error: 'Package type not found' }), { status: 400 });
        }
        
        // Update subscriber using enhancedsafesavestripecustomerid for all billing reasons
        const { error: updateError } = await supabaseAdmin.rpc('enhancedsafesavestripecustomerid', {
          p_user_id: null,
          p_email: customerEmail,
          p_stripe_customer_id: customer.id,
          p_package_type: packageData.package_type,
          p_subscription_status: 'active',
          p_subscription_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          p_stripe_subscription_id: stripeSubscription.id
        });
        
        if (updateError) {
          logStep("Failed to update subscriber via invoice.payment_succeeded", { error: updateError });
          throw new Error(`Failed to update subscriber: ${updateError.message}`);
        }
        
        logStep("Subscription updated successfully via invoice.payment_succeeded", { 
          email: customerEmail, 
          packageType: packageData.package_type,
          billingReason: invoice.billing_reason
        });
        
        // Mark webhook as processed
        await supabaseAdmin.from('webhook_events')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('stripe_event_id', event.id);
        
        return new Response(JSON.stringify({ success: true, message: 'Subscription updated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout session completed", { sessionId: session.id });

      const customerEmail = session.customer_details?.email || session.metadata?.signup_email;
      const packageType = session.metadata?.package_type;
      const billingFrequency = session.metadata?.billing_frequency;
      const fullName = session.metadata?.full_name;
      const companyName = session.metadata?.company_name;

      if (!customerEmail || !packageType) {
        logStep("Missing required metadata", { customerEmail, packageType });
        throw new Error('Missing required session metadata');
      }

      logStep("Session metadata extracted", { 
        email: customerEmail, 
        packageType, 
        billingFrequency,
        customerId: session.customer 
      });

      // Get subscription details if it's a subscription
      let subscriptionId = null;
      let subscriptionTier = packageType;

      if (session.mode === 'subscription' && session.subscription) {
        subscriptionId = session.subscription as string;
        logStep("Subscription created", { subscriptionId });
      }

      // Call complete_paid_signup to prepare account data (explicitly with password parameter)
      const { data: signupResult, error: signupError } = await supabaseAdmin.rpc('complete_paid_signup', {
        p_email: customerEmail,
        p_stripe_customer_id: session.customer as string,
        p_stripe_subscription_id: subscriptionId || '',
        p_subscription_tier: subscriptionTier,
        p_full_name: fullName || '',
        p_company_name: companyName || '',
        p_password: null // Explicitly pass password parameter to use correct function signature
      });

      if (signupError || !signupResult?.success) {
        logStep("Failed to complete signup data", { error: signupError, result: signupResult });
        throw new Error(`Failed to complete signup: ${signupError?.message || 'Unknown error'}`);
      }

      logStep("Signup data prepared", { 
        email: signupResult.email,
        packageType: signupResult.package_type,
        hasPassword: !!signupResult.stored_password 
      });

      // Create Supabase auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: signupResult.email,
        password: signupResult.stored_password,
        email_confirm: true,
        user_metadata: {
          full_name: signupResult.full_name,
          company_name: signupResult.company_name,
          package_type: signupResult.package_type,
          billing_frequency: signupResult.billing_frequency,
          stripe_customer_id: session.customer,
          signup_source: 'stripe_webhook'
        }
      });

      if (authError || !authUser.user) {
        logStep("Failed to create auth user", { error: authError });
        throw new Error(`Failed to create auth user: ${authError?.message}`);
      }

      logStep("Auth user created successfully", { 
        userId: authUser.user.id, 
        email: authUser.user.email 
      });

      // Create/update profile record
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authUser.user.id,
        email: signupResult.email,
        full_name: signupResult.full_name,
        company_name: signupResult.company_name,
        package_type: signupResult.package_type,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        is_active: true,
        email_verified: true,
        signup_source: 'stripe_payment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (profileError) {
        logStep("Failed to create profile", { error: profileError });
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // Create/update subscriber record
      const { error: subscriberError } = await supabaseAdmin.from('subscribers').upsert({
        user_id: authUser.user.id,
        email: signupResult.email,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscriptionId,
        subscribed: true,
        subscription_tier: subscriptionTier,
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      if (subscriberError) {
        logStep("Failed to create subscriber record", { error: subscriberError });
        throw new Error(`Failed to create subscriber: ${subscriberError.message}`);
      }

      // Mark webhook as processed
      await supabaseAdmin.from('webhook_events')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('stripe_event_id', event.id);

      logStep("Account creation completed successfully", {
        userId: authUser.user.id,
        email: signupResult.email,
        packageType: signupResult.package_type,
        subscriptionId
      });

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Account created successfully',
        user_id: authUser.user.id,
        email: signupResult.email
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle other webhook events
    logStep("Unhandled event type", { type: event.type });
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Unhandled event type: ${event.type}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep("Webhook processing error", { error: error.message });
    
    // Update webhook event with error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabaseAdmin.from('webhook_events')
        .update({ 
          processed: false, 
          error_message: error.message,
          retry_count: 1
        })
        .eq('stripe_event_id', (await req.clone().json())?.id || 'unknown');
    } catch (e) {
      logStep("Failed to update webhook event with error", { error: e.message });
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
