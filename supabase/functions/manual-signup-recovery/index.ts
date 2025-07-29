
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANUAL-SIGNUP-RECOVERY] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[MANUAL-SIGNUP-RECOVERY-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Manual signup recovery started");

    // Initialize Stripe FIRST before any other operations
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20'
    });

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
    
    let userEmail = email;
    
    // If no email provided but session_id is available, extract email from Stripe session
    if (!userEmail && session_id) {
      logStep("No email provided, extracting from session_id", { session_id });
      
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        userEmail = session.customer_details?.email || session.customer_email;
        logStep("Extracted email from Stripe session", { email: userEmail });
      } catch (stripeError) {
        logError("Failed to retrieve session from Stripe", stripeError);
        throw new Error(`Failed to extract email from session: ${stripeError.message}`);
      }
    }
    
    if (!userEmail) {
      throw new Error('Email is required (either directly or via session_id)');
    }

    logStep("Processing manual recovery", { email: userEmail });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find the incomplete signup
    const { data: signup, error: signupError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('email', userEmail)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (signupError) {
      throw new Error(`Failed to fetch signup: ${signupError.message}`);
    }

    if (!signup) {
      throw new Error('No incomplete signup found with payment for this email');
    }

    logStep("Found incomplete signup", { signupId: signup.id, packageType: signup.package_type });

    // Check if customer has active subscriptions in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: signup.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      throw new Error('No active subscription found in Stripe for this customer');
    }

    const subscription = subscriptions.data[0];
    logStep("Found active subscription", { subscriptionId: subscription.id, status: subscription.status });

    // Check if user already exists in auth system
    const { data: users } = await supabaseClient.auth.admin.listUsers();
    const existingUser = users.users?.find(u => u.email === userEmail);

    let userId;

    if (existingUser) {
      logStep("User already exists in auth system", { userId: existingUser.id });
      userId = existingUser.id;
    } else {
      // Use stored password from signup, with fallback to secure random password
      let userPassword = signup.password;
      if (!userPassword || userPassword.trim() === '') {
        userPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        logStep(`No stored password found for ${userEmail}, using generated password`);
      } else {
        logStep(`Using stored password for ${userEmail}`);
      }
      
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true, // User paid, so confirm email
        user_metadata: {
          full_name: signup.full_name || '',
          company_name: signup.company_name || '',
          package_type: signup.package_type,
          signup_source: 'manual_recovery',
          stripe_customer_id: signup.stripe_customer_id
        }
      });

      if (authError || !authUser.user) {
        throw new Error(`Auth user creation failed: ${authError?.message}`);
      }

      userId = authUser.user.id;
      logStep("Created new auth user", { userId });
    }

    // Ensure profile exists with ALL required fields
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        full_name: signup.full_name || '',
        company_name: signup.company_name || '',
        package_type: signup.package_type,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null,
        is_active: true,
        email_verified: true,
        signup_source: 'manual_recovery',
        phone: null,
        last_login: null,
        grace_period_end: null,
        pending_downgrade_to: null,
        pending_downgrade_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      logError("Profile upsert failed", profileError);
    } else {
      logStep("Profile created/updated successfully");
    }

    // Ensure subscriber record exists
    const { error: subscriberError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: userId,
        email: userEmail,
        stripe_customer_id: signup.stripe_customer_id,
        subscribed: true,
        subscription_tier: signup.package_type,
        subscription_status: 'active',
        stripe_subscription_id: subscription.id,
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        proration_credits: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (subscriberError) {
      logError("Subscriber upsert failed", subscriberError);
    } else {
      logStep("Subscriber record created/updated successfully");
    }

    // Mark signup as completed
    await supabaseClient
      .from('incomplete_signups')
      .update({ 
        status: 'recovered',
        updated_at: new Date().toISOString()
      })
      .eq('id', signup.id);

    logStep("Manual recovery completed successfully", { email: userEmail, userId });

    return new Response(JSON.stringify({
      success: true,
      message: existingUser ? 'Existing user account recovered successfully' : 'Account created successfully with stored password.',
      data: {
        email: userEmail,
        user_id: userId,
        package_type: signup.package_type,
        stripe_customer_id: signup.stripe_customer_id,
        stripe_subscription_id: subscription.id,
        used_stored_password: !!signup.password,
        recovery_note: existingUser ? 'Existing user account recovered' : 'New account created with stored password'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logError("Manual signup recovery failed", { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Manual signup recovery failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
