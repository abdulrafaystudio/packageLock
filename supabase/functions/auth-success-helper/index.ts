import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTH-SUCCESS-HELPER] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[AUTH-SUCCESS-HELPER-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Auth success helper started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const requestBody = await req.text();
    if (!requestBody) {
      throw new Error('Request body is empty');
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }

    const { session_id } = parsedBody;
    
    logStep("Request parsed", { session_id });

    if (!session_id) {
      throw new Error('session_id is required');
    }

    // Get Stripe session to find email
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20'
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email = session.customer_details?.email || session.metadata?.signup_email;
    
    if (!email) {
      throw new Error('No email found in Stripe session');
    }

    logStep("Found email from Stripe session", { email, session_id });

    // Check if user exists in auth system
    const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`);
    }

    const user = users.users?.find(u => u.email === email);
    
    if (!user) {
      logStep("User not found in auth system", { email });
      return new Response(JSON.stringify({
        user_exists: false,
        message: 'User account not found in authentication system'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    logStep("User found in auth system", { userId: user.id, email: user.email });

    // Check profile and subscription status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { data: subscriber, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      user_exists: true,
      user_id: user.id,
      email: user.email,
      email_confirmed: user.email_confirmed_at !== null,
      profile_exists: !profileError && profile !== null,
      subscriber_exists: !subscriberError && subscriber !== null,
      profile_data: profile,
      subscriber_data: subscriber,
      account_complete: (!profileError && profile !== null) && (!subscriberError && subscriber !== null)
    }), {
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
      details: 'Auth success helper failed',
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});