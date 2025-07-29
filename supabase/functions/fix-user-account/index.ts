import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FIX-USER-ACCOUNT] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[FIX-USER-ACCOUNT-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Fix user account function started");

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

    const { email, session_id } = parsedBody;
    
    if (!email) {
      throw new Error('Email is required');
    }

    logStep("Processing account fix", { email, session_id });

    // Get incomplete signup
    const { data: incompleteSignup, error: signupError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (signupError) {
      throw new Error(`Failed to fetch incomplete signup: ${signupError.message}`);
    }

    if (!incompleteSignup) {
      throw new Error('No pending signup found for this email');
    }

    // Get Stripe session to retrieve subscription ID
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20'
    });

    const stripeSessionId = session_id || incompleteSignup.stripe_session_id;
    if (!stripeSessionId) {
      throw new Error('No Stripe session ID available');
    }

    logStep("Retrieving Stripe session", { sessionId: stripeSessionId });

    const stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
    
    if (stripeSession.payment_status !== 'paid' || stripeSession.status !== 'complete') {
      throw new Error(`Session not completed. Status: ${stripeSession.status}, Payment: ${stripeSession.payment_status}`);
    }

    logStep("Found completed Stripe session", {
      sessionId: stripeSession.id,
      customerId: stripeSession.customer,
      subscriptionId: stripeSession.subscription
    });

    // Check if auth user exists
    const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`);
    }

    const existingUser = users.users?.find(u => u.email === email);
    
    if (existingUser) {
      logStep("Found existing auth user", { userId: existingUser.id });
      
      // Update subscriber with Stripe IDs
      const { error: subscriberUpdateError } = await supabaseClient
        .from('subscribers')
        .update({
          stripe_customer_id: stripeSession.customer,
          stripe_subscription_id: stripeSession.subscription,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (subscriberUpdateError) {
        logError("Failed to update subscriber", subscriberUpdateError);
      } else {
        logStep("Updated subscriber with Stripe IDs");
      }

      // Mark incomplete signup as completed
      const { error: signupUpdateError } = await supabaseClient
        .from('incomplete_signups')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', incompleteSignup.id);

      if (signupUpdateError) {
        logError("Failed to update signup status", signupUpdateError);
      } else {
        logStep("Marked signup as completed");
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Account fixed successfully',
        user_id: existingUser.id,
        email: email,
        action: 'updated_existing_account'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      // Create auth user with secure random password (not returned)
      const securePassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      logStep("Creating new auth user", { email });

      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: securePassword,
        email_confirm: false, // User will set password via reset
        user_metadata: {
          full_name: incompleteSignup.full_name || '',
          company_name: incompleteSignup.company_name || '',
          package_type: incompleteSignup.package_type,
          signup_source: 'manual_fix',
          stripe_customer_id: stripeSession.customer
        }
      });

      if (authError || !authUser.user) {
        throw new Error(`Auth user creation failed: ${authError?.message}`);
      }

      logStep("Auth user created", { userId: authUser.user.id });

      // Create/update profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: email,
          full_name: incompleteSignup.full_name || '',
          company_name: incompleteSignup.company_name || '',
          package_type: incompleteSignup.package_type,
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          is_active: true,
          email_verified: true,
          signup_source: 'manual_fix'
        })
        .on('conflict', 'id')
        .ignore();

      if (profileError) {
        logError("Profile creation failed", profileError);
      }

      // Update subscriber
      const { error: subscriberError } = await supabaseClient
        .from('subscribers')
        .update({
          user_id: authUser.user.id,
          stripe_customer_id: stripeSession.customer,
          stripe_subscription_id: stripeSession.subscription,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (subscriberError) {
        logError("Subscriber update failed", subscriberError);
      }

      // Mark signup as completed
      const { error: signupUpdateError } = await supabaseClient
        .from('incomplete_signups')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', incompleteSignup.id);

      if (signupUpdateError) {
        logError("Failed to update signup status", signupUpdateError);
      }

      // Trigger password reset email
      await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/login`
      });

      logStep("Account creation completed", {
        authUserId: authUser.user.id,
        email: email,
        requiresPasswordReset: true
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Account created successfully. Check your email for password setup instructions.',
        user_id: authUser.user.id,
        email: email,
        requires_password_reset: true,
        action: 'created_new_account'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error: any) {
    logError("Account fix failed", { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Account fix failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});