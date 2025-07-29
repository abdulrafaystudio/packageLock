
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-RECOVERY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🔄 STARTING UPGRADE RECOVERY PROCESS");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      throw new Error(`Authentication error: ${userError?.message || 'No user email'}`);
    }

    const user = userData.user;
    logStep("✅ User authenticated for recovery", { userId: user.id, email: user.email });

    // Get Stripe configuration
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      logStep("❌ No Stripe customer found for recovery");
      return new Response(JSON.stringify({
        success: false,
        error: 'no_stripe_customer',
        message: 'No Stripe customer found for this email'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customerId = customers.data[0].id;
    logStep("✅ Found Stripe customer", { customerId });

    // Get current subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 5
    });

    if (subscriptions.data.length === 0) {
      logStep("❌ No active subscriptions found");
      return new Response(JSON.stringify({
        success: false,
        error: 'no_active_subscription',
        message: 'No active subscription found for recovery'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Process each active subscription
    const recoveryResults = [];
    
    for (const subscription of subscriptions.data) {
      logStep("🔄 Processing subscription for recovery", { subscriptionId: subscription.id });

      // Determine package type from subscription
      let packageType = subscription.metadata?.package_type;
      if (!packageType && subscription.items?.data?.length > 0) {
        const priceId = subscription.items.data[0].price.id;
        
        // Try database lookup
        try {
          const { data: packageFromPrice } = await supabaseService.rpc('get_package_type_from_price_id', {
            p_price_id: priceId
          });
          packageType = packageFromPrice;
        } catch (priceError) {
          // Fallback based on price amount
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;
          if (amount >= 9900) packageType = 'premium';
          else if (amount >= 4900) packageType = 'standard';
          else packageType = 'free';
        }
      }

      if (!packageType) {
        packageType = 'standard'; // Ultimate fallback
      }

      const subscriptionEnd = subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null;

      // Update database records
      const { error: subscriberError } = await supabaseService
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscribed: subscription.status === 'active',
          subscription_tier: packageType,
          subscription_status: subscription.status,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

      if (subscriberError) {
        logStep("❌ Failed to update subscriber", { error: subscriberError.message });
      } else {
        logStep("✅ Updated subscriber record");
      }

      // Update profile record
      const { error: profileError } = await supabaseService
        .from('profiles')
        .update({
          package_type: packageType,
          subscription_status: subscription.status,
          subscription_end_date: subscriptionEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        logStep("⚠️ Profile update failed", { error: profileError.message });
      }

      recoveryResults.push({
        subscription_id: subscription.id,
        package_type: packageType,
        status: subscription.status,
        subscription_end: subscriptionEnd,
        recovered: !subscriberError
      });
    }

    logStep("✅ UPGRADE RECOVERY COMPLETED", { results: recoveryResults });

    return new Response(JSON.stringify({
      success: true,
      message: 'Upgrade recovery completed successfully',
      recovered_subscriptions: recoveryResults,
      immediate_access: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 CRITICAL ERROR in upgrade-recovery", { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false,
      message: 'Upgrade recovery failed'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
