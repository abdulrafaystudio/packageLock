import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UNIFIED-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Unified checkout started");

    const { packageType, billingFrequency, signupData } = await req.json();
    
    // Validate required fields
    if (!packageType || !billingFrequency || !signupData?.email) {
      throw new Error('Missing required fields');
    }

    // Handle free packages - no Stripe needed
    if (packageType === 'free' || packageType === 'freepro') {
      logStep("Free package detected, no checkout needed");
      return new Response(JSON.stringify({ 
        success: true, 
        isFree: true,
        message: 'Free package, no checkout required'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Initialize clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    });

    // Get Stripe price ID
    const { data: priceId, error: priceError } = await supabaseClient.rpc('get_stripe_price_id', {
      p_package_type: packageType,
      p_billing_frequency: billingFrequency
    });

    if (priceError || !priceId) {
      throw new Error(`Price not found for ${packageType} ${billingFrequency}`);
    }

    logStep("Price found", { packageType, billingFrequency, priceId });

    // Create or get Stripe customer with immediate storage
    const customers = await stripe.customers.list({ 
      email: signupData.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: signupData.email,
        name: signupData.fullName || '',
        metadata: {
          company_name: signupData.companyName || '',
          package_type: packageType,
          billing_frequency: billingFrequency
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create incomplete signup record with immediate customer ID storage
    const { data: signupId, error: signupError } = await supabaseClient.rpc('create_incomplete_signup', {
      p_email: signupData.email,
      p_full_name: signupData.fullName || '',
      p_package_type: packageType,
      p_billing_frequency: billingFrequency,
      p_company_name: signupData.companyName || null,
      p_password: signupData.password || null,
      p_stripe_session_id: null // Will be updated after checkout session creation
    });

    if (signupError) {
      throw new Error(`Failed to save signup data: ${signupError.message}`);
    }

    logStep("Incomplete signup created", { signupId });

    // Immediately store the stripe_customer_id in incomplete_signups to prevent loss
    const { error: updateCustomerError } = await supabaseClient
      .from('incomplete_signups')
      .update({ 
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', signupId);

    if (updateCustomerError) {
      logStep("WARNING: Failed to store customer ID in incomplete_signups", { 
        error: updateCustomerError.message,
        customerId: customerId
      });
      // Continue anyway - this is not a blocking error
    } else {
      logStep("Successfully stored customer ID in incomplete_signups", { customerId });
    }

    // Create Stripe checkout session
    const origin = req.headers.get('origin') || 'https://ohiqolnendkhyuomdbnx.supabase.co';
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/auth-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        package_type: packageType,
        billing_frequency: billingFrequency,
        signup_email: signupData.email,
        incomplete_signup_id: signupId || '',
        full_name: signupData.fullName || '',
        company_name: signupData.companyName || ''
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: { address: 'auto', name: 'auto' }
    });

    // Update incomplete signup with session details (customer ID should already be stored)
    const { error: updateError } = await supabaseClient
      .from('incomplete_signups')
      .update({ 
        stripe_session_id: checkoutSession.id,
        stripe_customer_id: customerId, // Re-confirm customer ID
        updated_at: new Date().toISOString()
      })
      .eq('id', signupId);

    if (updateError) {
      logStep("Failed to update incomplete signup with session details", { error: updateError.message });
      // Note: This is not a blocking error for checkout creation, but log it for monitoring
    } else {
      logStep("Successfully updated incomplete signup with session details", { 
        sessionId: checkoutSession.id,
        customerId: customerId 
      });
    }

    logStep("Checkout session created", { sessionId: checkoutSession.id });

    return new Response(JSON.stringify({ 
      url: checkoutSession.url,
      session_id: checkoutSession.id,
      customer_id: customerId,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep("Error occurred", { error: error.message });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});