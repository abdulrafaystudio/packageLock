
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BACKFILL-DATES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting subscription dates backfill");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Get all subscribers with NULL subscription_end dates
    const { data: subscribersToFix, error: fetchError } = await supabaseService
      .from('subscribers')
      .select('email, stripe_customer_id, subscription_tier')
      .is('subscription_end', null)
      .not('subscription_tier', 'in', '("free","freepro")')
      .eq('subscribed', true);

    if (fetchError) {
      throw new Error(`Failed to fetch subscribers: ${fetchError.message}`);
    }

    logStep("Found subscribers to backfill", { count: subscribersToFix?.length || 0 });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const subscriber of subscribersToFix || []) {
      try {
        logStep("Processing subscriber", { email: subscriber.email });

        if (!subscriber.stripe_customer_id) {
          logStep("Skipping subscriber without customer ID", { email: subscriber.email });
          continue;
        }

        // Get active subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: subscriber.stripe_customer_id,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          logStep("No active subscription found", { email: subscriber.email });
          // Update to show cancelled status
          await supabaseService
            .from('subscribers')
            .update({
              subscribed: false,
              subscription_status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('email', subscriber.email);
          continue;
        }

        const subscription = subscriptions.data[0];
        const subscriptionEnd = subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : null;

        logStep("Found subscription data", { 
          email: subscriber.email,
          subscriptionId: subscription.id,
          endDate: subscriptionEnd
        });

        // Update subscriber with correct end dates
        const { error: updateError } = await supabaseService
          .from('subscribers')
          .update({
            subscription_end: subscriptionEnd,
            current_period_end: subscriptionEnd,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('email', subscriber.email);

        if (updateError) {
          throw new Error(`Failed to update subscriber: ${updateError.message}`);
        }

        // Update profile as well
        await supabaseService
          .from('profiles')
          .update({
            subscription_end_date: subscriptionEnd,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('email', subscriber.email);

        successCount++;
        logStep("Successfully updated subscriber", { email: subscriber.email });

      } catch (error: any) {
        errorCount++;
        const errorMsg = `${subscriber.email}: ${error.message}`;
        errors.push(errorMsg);
        logStep("Failed to update subscriber", { email: subscriber.email, error: error.message });
      }
    }

    logStep("Backfill completed", { successCount, errorCount });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Backfill completed",
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Limit error details
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    logStep("ERROR in backfill", { error: error.message });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
