
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create client with anon key for user authentication
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Create client with service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Get current subscription from database
    const { data: currentSub } = await supabaseService
      .from("subscribers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get customer from Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      await supabaseService.from("subscribers").upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: 'free',
        subscription_status: 'active',
        subscription_end: null,
      }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'free',
        subscription_status: 'active'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions - order by created date descending to get the most recent
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10, // Get more to ensure we see all active subscriptions
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'free';
    let subscriptionEnd = null;
    let subscriptionStatus = 'active';

    if (hasActiveSub) {
      // Sort by created date descending to get the most recent subscription
      const sortedSubscriptions = subscriptions.data.sort((a, b) => b.created - a.created);
      const subscription = sortedSubscriptions[0];
      
      logStep("Found active subscriptions", { 
        totalCount: subscriptions.data.length,
        selectedSubscriptionId: subscription.id,
        allSubscriptionIds: subscriptions.data.map(s => s.id)
      });
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Get the price ID from the subscription
      const priceId = subscription.items.data[0]?.price?.id;
      logStep("Processing subscription with price ID", { 
        subscriptionId: subscription.id, 
        priceId,
        metadata: subscription.metadata 
      });

      // First try to get tier from subscription metadata
      if (subscription.metadata?.package_type) {
        subscriptionTier = subscription.metadata.package_type;
        logStep("Tier determined from subscription metadata", { tier: subscriptionTier });
      } else if (priceId) {
        // Use database function to get package type from price ID
        const { data: tierFromPrice, error: tierError } = await supabaseService.rpc(
          'get_package_type_from_price_id', 
          { p_price_id: priceId }
        );
        
        if (tierError) {
          logStep("Warning: Failed to get tier from price ID", { 
            priceId, 
            error: tierError.message 
          });
        } else if (tierFromPrice) {
          subscriptionTier = tierFromPrice;
          logStep("Tier determined from database lookup", { 
            priceId, 
            tier: subscriptionTier 
          });
        } else {
          logStep("Warning: No tier mapping found for price ID", { priceId });
          
          // Fallback: Get price details from Stripe for logging
          try {
            const price = await stripe.prices.retrieve(priceId);
            const amount = price.unit_amount || 0;
            logStep("Price details for unmapped price ID", { 
              priceId, 
              amount, 
              currency: price.currency,
              interval: price.recurring?.interval 
            });
            
            // Conservative fallback - set to standard instead of making assumptions
            subscriptionTier = 'standard';
            logStep("Using fallback tier for unmapped price", { 
              priceId, 
              fallbackTier: subscriptionTier 
            });
          } catch (priceError) {
            logStep("Error retrieving price details", { 
              priceId, 
              error: priceError.message 
            });
            subscriptionTier = 'standard'; // Safe fallback
          }
        }
      } else {
        logStep("Warning: No price ID found in subscription", { subscriptionId: subscription.id });
        subscriptionTier = 'standard'; // Safe fallback
      }
      
      logStep("Active subscription processed", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        tier: subscriptionTier,
        priceId,
        determinationMethod: subscription.metadata?.package_type ? 'metadata' : 'database_lookup'
      });
    } else {
      // Check for past_due subscriptions
      const pastDueSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "past_due",
        limit: 1,
      });

      if (pastDueSubscriptions.data.length > 0) {
        const subscription = pastDueSubscriptions.data[0];
        const priceId = subscription.items.data[0]?.price?.id;
        
        // Use same logic for past due subscriptions
        if (subscription.metadata?.package_type) {
          subscriptionTier = subscription.metadata.package_type;
        } else if (priceId) {
          const { data: tierFromPrice } = await supabaseService.rpc(
            'get_package_type_from_price_id', 
            { p_price_id: priceId }
          );
          subscriptionTier = tierFromPrice || 'standard';
        } else {
          subscriptionTier = 'standard';
        }
        
        subscriptionStatus = 'past_due';
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Past due subscription processed", { 
          subscriptionId: subscription.id, 
          tier: subscriptionTier,
          priceId 
        });
      }
    }

    // Update database
    await supabaseService.from("subscribers").upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
      subscription_end: subscriptionEnd,
    }, { onConflict: 'user_id' });

    // Also update profile table with proper enum casting
    await supabaseService.from("profiles").update({
      package_type: subscriptionTier,
      subscription_status: subscriptionStatus,
      subscription_end_date: subscriptionEnd,
    }).eq('id', user.id);

    logStep("Database updated with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier,
      subscriptionStatus,
      finalTierMapping: subscriptionTier
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
