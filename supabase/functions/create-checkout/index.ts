
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { packageType, billingFrequency, signupData } = await req.json();
    logStep("Request data received", { packageType, billingFrequency, hasSignupData: !!signupData });

    // Handle free packages - no Stripe needed
    if (packageType === 'free' || packageType === 'freepro') {
      logStep("Free package detected, skipping Stripe", { packageType });
      
      if (signupData && signupData.email) {
        // Create incomplete signup record for tracking
        const { error: signupError } = await supabaseClient.rpc('create_incomplete_signup', {
          p_email: signupData.email,
          p_full_name: signupData.fullName || '',
          p_package_type: packageType,
          p_billing_frequency: 'none',
          p_company_name: signupData.companyName || null
        });

        if (signupError) {
          logStep("ERROR creating incomplete signup for free package", { error: signupError });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Free package selected',
        packageType: packageType
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For paid packages, continue with Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Get price ID from database
    const { data: priceData, error: priceError } = await supabaseClient.rpc('get_stripe_price_id', {
      p_package_type: packageType,
      p_billing_frequency: billingFrequency
    });

    if (priceError || !priceData) {
      logStep("ERROR: Price not found", { packageType, billingFrequency, error: priceError });
      throw new Error(`Price not found for ${packageType} ${billingFrequency}: ${priceError?.message}`);
    }

    logStep("Price ID retrieved", { priceId: priceData });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create incomplete signup record for paid packages
    if (signupData && signupData.email) {
      const { error: signupError } = await supabaseClient.rpc('create_incomplete_signup', {
        p_email: signupData.email,
        p_full_name: signupData.fullName || '',
        p_package_type: packageType,
        p_billing_frequency: billingFrequency,
        p_company_name: signupData.companyName || null
      });

      if (signupError) {
        logStep("ERROR creating incomplete signup for paid package", { error: signupError });
        throw new Error(`Failed to create signup record: ${signupError.message}`);
      }
      
      logStep("Created incomplete signup record", { email: signupData.email, packageType });
    }

    // Check if customer already exists
    let customerId = null;
    const email = signupData?.email;
    
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    // Create checkout session with package type in metadata
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: priceData,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/auth-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${packageType === 'free' || packageType === 'freepro' ? '' : `auth-${packageType}`}`,
      metadata: {
        package_type: packageType,
        billing_frequency: billingFrequency,
        signup_email: email || '',
        full_name: signupData?.fullName || '',
        company_name: signupData?.companyName || '',
      },
      subscription_data: {
        metadata: {
          package_type: packageType,
          billing_frequency: billingFrequency,
        }
      }
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update incomplete signup with session ID
    if (signupData && email) {
      const { error: updateError } = await supabaseClient
        .from("incomplete_signups")
        .update({ 
          stripe_session_id: session.id,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('package_type', packageType)
        .eq('status', 'pending');

      if (updateError) {
        logStep("Warning: Could not update incomplete signup", { error: updateError });
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
