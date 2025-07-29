import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[IMMEDIATE-CUSTOMER-SYNC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Immediate customer sync started");

    const { sessionId, email } = await req.json();
    
    if (!sessionId || !email) {
      throw new Error('Missing required fields: sessionId and email');
    }

    logStep("Processing immediate sync", { sessionId, email });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Phase 2: Immediate Customer ID Transfer System
    // Step 1: Get incomplete signup with customer ID
    const { data: incompleteSignup, error: signupError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('stripe_session_id', sessionId)
      .single();

    if (signupError || !incompleteSignup) {
      logStep("No incomplete signup found", { error: signupError, email, sessionId });
      throw new Error('No incomplete signup found for this session');
    }

    if (!incompleteSignup.stripe_customer_id) {
      logStep("No customer ID in incomplete signup", { incompleteSignupId: incompleteSignup.id });
      throw new Error('No customer ID found in incomplete signup');
    }

    logStep("Found incomplete signup with customer ID", {
      customerId: incompleteSignup.stripe_customer_id,
      packageType: incompleteSignup.package_type
    });

    // Step 2: Transfer customer ID to subscribers table immediately
    const { data: existingSubscriber } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingSubscriber) {
      // Update existing subscriber with customer ID
      const { error: updateError } = await supabaseClient
        .from('subscribers')
        .update({
          stripe_customer_id: incompleteSignup.stripe_customer_id,
          subscription_tier: incompleteSignup.package_type,
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim());

      if (updateError) {
        logStep("Failed to update existing subscriber", { error: updateError.message });
        throw new Error(`Failed to update subscriber: ${updateError.message}`);
      }

      logStep("Updated existing subscriber with customer ID", {
        customerId: incompleteSignup.stripe_customer_id
      });
    } else {
      // Create new subscriber record
      const subscriberData = {
        email: email.toLowerCase().trim(),
        stripe_customer_id: incompleteSignup.stripe_customer_id,
        subscribed: true,
        subscription_tier: incompleteSignup.package_type,
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabaseClient
        .from('subscribers')
        .insert(subscriberData);

      if (insertError) {
        logStep("Failed to create subscriber", { error: insertError.message });
        throw new Error(`Failed to create subscriber: ${insertError.message}`);
      }

      logStep("Created new subscriber with customer ID", {
        customerId: incompleteSignup.stripe_customer_id
      });
    }

    // Step 3: Verify the customer ID was saved
    const { data: verification } = await supabaseClient
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!verification?.stripe_customer_id) {
      throw new Error('Customer ID verification failed after sync');
    }

    logStep("Customer ID sync completed successfully", {
      email: email,
      customerId: verification.stripe_customer_id,
      sessionId: sessionId
    });

    return new Response(JSON.stringify({
      success: true,
      customerId: verification.stripe_customer_id,
      message: 'Customer ID synced successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep("Error in immediate customer sync", { error: error.message });
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});