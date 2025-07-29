
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enhancedAtomicUpgradeTransaction } from './utils/enhanced-transaction.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-UPGRADE-SUCCESS-ENHANCED] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🚀 ENHANCED IMMEDIATE UPGRADE PROCESSOR STARTED");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Enhanced authentication with better error messages
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided - user must be authenticated");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      logStep("❌ Authentication failed", { error: userError?.message });
      throw new Error(`Authentication error: ${userError?.message || 'No user email found'}`);
    }

    const user = userData.user;
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("No session_id provided in request body");
    }

    logStep("✅ Processing upgrade for authenticated user", { 
      userId: user.id, 
      email: user.email, 
      sessionId: session_id 
    });

    // Get Stripe secret key with validation
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey || stripeKey.length < 10) {
      logStep("❌ Invalid Stripe configuration");
      throw new Error("STRIPE_SECRET_KEY is not properly configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Enhanced session retrieval with comprehensive expansion
    logStep("📄 Retrieving checkout session with full details");
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'subscription.items.data.price', 'customer', 'line_items.data.price']
    });

    logStep("✅ Retrieved checkout session", { 
      sessionId: session.id, 
      mode: session.mode,
      status: session.payment_status,
      subscriptionId: session.subscription,
      customerId: session.customer 
    });

    // Enhanced validation
    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}. Cannot process upgrade.`);
    }

    if (session.mode !== 'subscription' || !session.subscription) {
      throw new Error("Invalid session - not a subscription checkout session");
    }

    // Get comprehensive subscription details
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id;

    logStep("🔍 Retrieving comprehensive subscription details");
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price', 'customer', 'latest_invoice']
    });

    logStep("✅ Retrieved subscription details", {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
      priceId: subscription.items.data[0]?.price?.id,
      currentPeriodEnd: subscription.current_period_end
    });

    // Enhanced subscription validation
    if (subscription.status !== 'active') {
      logStep("⚠️ Subscription not active", { status: subscription.status });
      // Continue processing but log the status issue
    }

    const subscriptionEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Enhanced package type determination with multiple fallbacks
    let packageType = subscription.metadata?.package_type;
    
    if (!packageType && subscription.items?.data?.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      logStep("🔍 Determining package type from price ID", { priceId });
      
      // Try database lookup first
      try {
        const { data: packageFromPrice, error: priceError } = await supabaseService.rpc('get_package_type_from_price_id', {
          p_price_id: priceId
        });
        
        if (!priceError && packageFromPrice) {
          packageType = packageFromPrice;
          logStep("📦 Package type from database", { packageType });
        } else {
          logStep("⚠️ Database price lookup failed", { error: priceError?.message });
        }
      } catch (priceError) {
        logStep("⚠️ Price lookup exception", { error: priceError.message });
      }
      
      // Enhanced fallback logic based on price amount
      if (!packageType) {
        const amount = subscription.items.data[0]?.price?.unit_amount || 0;
        const interval = subscription.items.data[0]?.price?.recurring?.interval || 'month';
        
        logStep("💰 Determining package from price amount", { amount, interval });
        
        // More precise price-to-package mapping
        if (interval === 'year') {
          if (amount >= 19900) packageType = 'enterprise';
          else if (amount >= 14900) packageType = 'premiumpro';
          else if (amount >= 9900) packageType = 'premium';
          else if (amount >= 4900) packageType = 'standard';
          else packageType = 'free';
        } else {
          if (amount >= 2500) packageType = 'enterprise';
          else if (amount >= 1900) packageType = 'premiumpro';
          else if (amount >= 1500) packageType = 'premium';
          else if (amount >= 900) packageType = 'standard';
          else packageType = 'free';
        }
        
        logStep("📦 Package type from price fallback", { packageType, amount, interval });
      }
    }

    // Ultimate fallback
    if (!packageType) {
      packageType = 'standard';
      logStep("⚠️ Using ultimate fallback package type", { packageType });
    }

    // Get and validate customer ID
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id;

    if (!customerId) {
      throw new Error("No customer ID found in subscription - cannot complete upgrade");
    }

    logStep("🎯 Final upgrade data prepared", {
      packageType,
      customerId,
      subscriptionStatus: subscription.status,
      subscriptionEnd
    });

    // Execute enhanced atomic database transaction
    logStep("💾 Executing enhanced atomic database transaction");
    const transactionResult = await enhancedAtomicUpgradeTransaction(supabaseService, {
      userId: user.id,
      email: user.email,
      stripeCustomerId: customerId,
      subscriptionTier: packageType,
      subscriptionStatus: subscription.status,
      subscriptionEnd: subscriptionEnd,
      stripeSubscriptionId: subscription.id
    });

    if (!transactionResult.success) {
      throw new Error("Enhanced atomic transaction failed");
    }

    logStep("🎉 ENHANCED IMMEDIATE UPGRADE COMPLETED SUCCESSFULLY", {
      email: user.email,
      packageType,
      subscriptionStatus: subscription.status,
      subscriptionEnd,
      transactionDetails: transactionResult
    });

    // Return comprehensive success response with enhanced data
    return new Response(JSON.stringify({ 
      success: true,
      upgrade_completed: true,
      immediate_access: true,
      enhanced_processing: true,
      profile: {
        package_type: packageType,
        subscription_status: subscription.status,
        subscribed: subscription.status === 'active',
        subscription_end: subscriptionEnd,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id
      },
      transaction_details: {
        subscriber_updated: transactionResult.subscriberData ? true : false,
        profile_updated: transactionResult.profileUpdated,
        audit_logged: transactionResult.auditLogged
      },
      processing_metadata: {
        session_id: session_id,
        processed_at: new Date().toISOString(),
        processor_version: 'enhanced-v2'
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logStep("💥 CRITICAL ERROR in enhanced upgrade processor", { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined 
    });
    
    // Enhanced error categorization
    const errorCode = errorMessage.includes('Authentication') ? 'AUTH_ERROR' :
                     errorMessage.includes('payment') ? 'PAYMENT_ERROR' :
                     errorMessage.includes('subscription') ? 'SUBSCRIPTION_ERROR' :
                     errorMessage.includes('database') || errorMessage.includes('transaction') ? 'DATABASE_ERROR' :
                     'GENERAL_ERROR';
    
    const statusCode = errorCode === 'AUTH_ERROR' ? 401 :
                      errorCode === 'PAYMENT_ERROR' ? 402 :
                      errorCode === 'SUBSCRIPTION_ERROR' ? 422 :
                      errorCode === 'DATABASE_ERROR' ? 503 :
                      500;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      error_code: errorCode,
      success: false,
      enhanced_processing: true,
      details: 'Enhanced upgrade processor failed',
      timestamp: new Date().toISOString(),
      support_message: 'If this error persists, please contact support with the timestamp above.',
      processor_version: 'enhanced-v2'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
