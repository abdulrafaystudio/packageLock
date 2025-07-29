import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[GET-CHECKOUT-SESSION-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started", { method: req.method, url: req.url });

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    let parsedBody;
    try {
      const requestBody = await req.text();
      logStep("Raw request body", { body: requestBody });
      
      if (!requestBody) {
        throw new Error('Request body is empty');
      }

      parsedBody = JSON.parse(requestBody);
      logStep("Parsed request body", parsedBody);
    } catch (parseError) {
      logError("JSON parsing error", { error: parseError.message });
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }

    const { session_id } = parsedBody;
    
    logStep("Request parsed", { session_id });

    if (!session_id) {
      throw new Error('session_id is required');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    logStep("Stripe client initialized");

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    logStep("Checkout session retrieved", { 
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status 
    });

    // Extract relevant information
    const sessionInfo = {
      session_id: session.id,
      customer_email: session.customer_details?.email || session.metadata?.signup_email,
      customer_id: session.customer,
      subscription_id: session.subscription,
      status: session.status,
      payment_status: session.payment_status,
      package_type: session.metadata?.package_type,
      full_name: session.metadata?.full_name,
      company_name: session.metadata?.company_name,
      amount_total: session.amount_total,
      currency: session.currency,
      created: session.created
    };

    logStep("Session info extracted", sessionInfo);

    return new Response(JSON.stringify(sessionInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logError("Function execution failed", { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to retrieve checkout session',
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
