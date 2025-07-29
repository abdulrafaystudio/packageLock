
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-USER-PROFILE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Profile sync function started");

    // Create Supabase client using the service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the user
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Get customer from Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { email: user.email });
      
      // Update database to reflect no subscription
      await updateSubscriptionData(supabaseService, user, {
        subscribed: false,
        subscription_tier: 'free',
        subscription_status: 'cancelled',
        subscription_end: null,
        stripe_subscription_id: null,
        stripe_customer_id: null
      });

      return new Response(JSON.stringify({ 
        success: true, 
        profile: {
          package_type: 'free',
          subscription_status: 'cancelled',
          subscribed: false
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get ALL subscriptions (not just active ones) and find the latest one
    const allSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
      expand: ['data.items.data.price']
    });

    // Sort by created date to get the most recent subscription
    const sortedSubscriptions = allSubscriptions.data.sort((a, b) => b.created - a.created);
    const latestSubscription = sortedSubscriptions[0];

    let subscriptionData = {
      subscribed: false,
      subscription_tier: 'free',
      subscription_status: 'cancelled',
      subscription_end: null,
      stripe_subscription_id: null,
      stripe_customer_id: customerId
    };

    if (latestSubscription) {
      const priceId = latestSubscription.items.data[0]?.price?.id;
      const isActive = latestSubscription.status === 'active';
      
      logStep("Latest subscription found", { 
        subscriptionId: latestSubscription.id, 
        status: latestSubscription.status,
        priceId,
        metadata: latestSubscription.metadata 
      });

      // Determine package type from metadata first, then from price lookup
      let packageType = latestSubscription.metadata?.package_type;
      
      if (!packageType && priceId) {
        try {
          const { data: packageFromPrice } = await supabaseService.rpc('get_package_type_from_price_id', {
            p_price_id: priceId
          });
          packageType = packageFromPrice;
          logStep("Package type from price lookup", { priceId, packageType });
        } catch (priceError) {
          logStep("Price lookup failed, using fallback", { error: priceError.message });
          // Fallback based on price amount
          const amount = latestSubscription.items.data[0]?.price?.unit_amount || 0;
          if (amount >= 9900) packageType = 'premium';
          else if (amount >= 4900) packageType = 'standard';
          else packageType = 'free';
        }
      }

      subscriptionData = {
        subscribed: isActive,
        subscription_tier: packageType || 'standard',
        subscription_status: latestSubscription.status,
        subscription_end: latestSubscription.current_period_end ? 
          new Date(latestSubscription.current_period_end * 1000).toISOString() : null,
        stripe_subscription_id: latestSubscription.id,
        stripe_customer_id: customerId
      };

      logStep("Subscription data prepared", subscriptionData);
    } else {
      logStep("No subscriptions found for customer");
    }

    // Update database with the latest subscription information
    await updateSubscriptionData(supabaseService, user, subscriptionData);

    logStep("Profile and subscriber records synced successfully", {
      userId: user.id,
      email: user.email,
      packageType: subscriptionData.subscription_tier,
      subscribed: subscriptionData.subscribed
    });

    return new Response(JSON.stringify({ 
      success: true,
      profile: {
        package_type: subscriptionData.subscription_tier,
        subscription_status: subscriptionData.subscription_status,
        subscribed: subscriptionData.subscribed,
        subscription_end: subscriptionData.subscription_end
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-user-profile", { error: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to update subscription data with better error handling
async function updateSubscriptionData(supabaseService: any, user: any, subscriptionData: any) {
  try {
    // Update subscriber record first (primary source of truth)
    const { error: subscriberError } = await supabaseService
      .from('subscribers')
      .upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        subscribed: subscriptionData.subscribed,
        subscription_tier: subscriptionData.subscription_tier,
        subscription_status: subscriptionData.subscription_status,
        subscription_end: subscriptionData.subscription_end,
        current_period_end: subscriptionData.subscription_end,
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (subscriberError) {
      logStep("Subscriber update failed, trying email conflict", { error: subscriberError.message });
      
      // Try with email conflict resolution
      const { error: subscriberError2 } = await supabaseService
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: subscriptionData.stripe_customer_id,
          subscribed: subscriptionData.subscribed,
          subscription_tier: subscriptionData.subscription_tier,
          subscription_status: subscriptionData.subscription_status,
          subscription_end: subscriptionData.subscription_end,
          current_period_end: subscriptionData.subscription_end,
          stripe_subscription_id: subscriptionData.stripe_subscription_id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
        
      if (subscriberError2) {
        throw new Error(`Failed to update subscriber: ${subscriberError2.message}`);
      }
    }

    // Update profile record to match subscribers data
    const profileUpdateData = {
      package_type: subscriptionData.subscription_tier,
      subscription_status: subscriptionData.subscription_status,
      subscription_end_date: subscriptionData.subscription_end,
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabaseService
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', user.id);

    if (profileError) {
      logStep("Profile update failed", { error: profileError.message });
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    logStep("Database updates completed successfully");
    
  } catch (error) {
    logStep("Database update failed", { error: error.message });
    throw error;
  }
}
