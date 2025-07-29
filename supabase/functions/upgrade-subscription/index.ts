
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [UPGRADE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("UPGRADE_START", "Processing subscription upgrade request");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      logStep("AUTH_ERROR", userError?.message || "No user email");
      throw new Error("Authentication failed or email not available");
    }

    const user = userData.user;
    logStep("USER_AUTHENTICATED", { userId: user.id, email: user.email });

    const { packageType, billingFrequency } = await req.json();
    
    if (!packageType || !billingFrequency) {
      throw new Error("Missing packageType or billingFrequency");
    }

    logStep("UPGRADE_REQUEST", { packageType, billingFrequency });

    // Get current subscriber data
    const { data: subscriber, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subscriberError) {
      logStep("SUBSCRIBER_ERROR", subscriberError.message);
      throw new Error("Subscriber record not found");
    }

    logStep("CURRENT_SUBSCRIBER", {
      currentTier: subscriber.subscription_tier,
      hasCustomerId: !!subscriber.stripe_customer_id,
      hasSubscriptionId: !!subscriber.stripe_subscription_id
    });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get the new price ID
    const { data: planData } = await supabaseClient
      .from('subscription_plans')
      .select('stripe_price_id')
      .eq('package_type', packageType)
      .eq('billing_frequency', billingFrequency)
      .eq('is_active', true)
      .single();

    if (!planData?.stripe_price_id) {
      throw new Error(`No price found for ${packageType} ${billingFrequency}`);
    }

    logStep("PRICE_FOUND", { priceId: planData.stripe_price_id });

    // Get or create Stripe customer
    let stripeCustomerId = subscriber.stripe_customer_id;
    
    if (!stripeCustomerId) {
      logStep("CREATING_STRIPE_CUSTOMER", user.email);
      
      const customer = await stripe.customers.create({
        email: user.email,
        name: subscriber.full_name || '',
        metadata: {
          user_id: user.id,
          package_type: packageType
        }
      });
      
      stripeCustomerId = customer.id;
      logStep("CUSTOMER_CREATED", stripeCustomerId);

      // Save the customer ID immediately
      await supabaseClient.rpc('safe_save_stripe_customer_id', {
        p_user_id: user.id,
        p_email: user.email,
        p_stripe_customer_id: stripeCustomerId
      });
    }

    // ALWAYS CREATE CHECKOUT SESSION FOR UPGRADES
    logStep("CREATING_CHECKOUT_SESSION", "Creating Stripe checkout for upgrade payment");

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: planData.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/upgrade-plan?cancelled=true&plan=${packageType.toLowerCase()}&billing=${billingFrequency}`,
      metadata: {
        user_id: user.id,
        package_type: packageType,
        billing_frequency: billingFrequency,
        upgrade_flow: 'true',
        current_tier: subscriber.subscription_tier || 'free'
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          email: user.email,
          package_type: packageType,
          billing_frequency: billingFrequency,
          upgrade_flow: 'true'
        }
      }
    });

    logStep("CHECKOUT_SESSION_CREATED", {
      sessionId: session.id,
      url: session.url,
      customerId: stripeCustomerId
    });

    return new Response(JSON.stringify({
      success: true,
      url: session.url,
      session_id: session.id,
      customer_id: stripeCustomerId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    logStep("UPGRADE_ERROR", error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
