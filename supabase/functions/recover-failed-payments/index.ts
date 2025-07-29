import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECOVER-PAYMENTS] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[RECOVER-PAYMENTS-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Recovery function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    // Get all incomplete signups that need recovery
    const { data: incompleteSignups, error: fetchError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .in('status', ['pending', 'completed'])
      .not('stripe_customer_id', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch incomplete signups: ${fetchError.message}`);
    }

    logStep("Found incomplete signups for recovery", { count: incompleteSignups?.length || 0 });

    const recoveryResults = [];

    for (const signup of incompleteSignups || []) {
      logStep("Processing signup recovery", { email: signup.email, status: signup.status });

      try {
        // Check if user already exists in auth.users
        const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
        const existingUser = existingUsers.users?.find(u => u.email === signup.email);

        if (existingUser) {
          logStep("User already exists in auth", { userId: existingUser.id, email: signup.email });
          
          // Just create missing profile/subscriber records
          await createMissingRecords(supabaseClient, existingUser, signup);
          recoveryResults.push({ email: signup.email, status: 'recovered_existing_user' });
          continue;
        }

        // Verify payment with Stripe
        const customer = await stripe.customers.retrieve(signup.stripe_customer_id);
        if (!customer || customer.deleted) {
          logError("Customer not found in Stripe", { customerId: signup.stripe_customer_id });
          continue;
        }

        // Check for active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: signup.stripe_customer_id,
          limit: 1
        });

        if (subscriptions.data.length === 0) {
          logError("No subscriptions found for customer", { customerId: signup.stripe_customer_id });
          continue;
        }

        const subscription = subscriptions.data[0];
        if (subscription.status !== 'active') {
          logError("Subscription not active", { 
            subscriptionId: subscription.id, 
            status: subscription.status 
          });
          continue;
        }

        // Verify password exists
        if (!signup.password) {
          logError("No password found for signup", { email: signup.email });
          recoveryResults.push({ 
            email: signup.email, 
            status: 'failed', 
            error: 'No password available - contact support' 
          });
          continue;
        }

        // Create auth user with original password
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: signup.email,
          password: signup.password,
          email_confirm: true,
          user_metadata: {
            full_name: signup.full_name || '',
            company_name: signup.company_name || '',
            package_type: signup.package_type,
            signup_source: 'recovery',
            stripe_customer_id: signup.stripe_customer_id
          }
        });

        if (authError || !authUser.user) {
          logError("Failed to create auth user", { error: authError?.message, email: signup.email });
          continue;
        }

        logStep("Auth user created successfully", { 
          userId: authUser.user.id, 
          email: authUser.user.email 
        });

        // Create profile record
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: signup.email,
            full_name: signup.full_name || '',
            company_name: signup.company_name || '',
            package_type: signup.package_type,
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            is_active: true,
            email_verified: true,
            signup_source: 'recovery'
          });

        if (profileError) {
          logError("Profile creation failed", profileError);
        } else {
          logStep("Profile created successfully", { userId: authUser.user.id });
        }

        // Create subscriber record
        const { error: subscriberError } = await supabaseClient
          .from('subscribers')
          .insert({
            user_id: authUser.user.id,
            email: signup.email,
            stripe_customer_id: signup.stripe_customer_id,
            subscribed: true,
            subscription_tier: signup.package_type,
            subscription_status: 'active',
            stripe_subscription_id: subscription.id
          });

        if (subscriberError) {
          logError("Subscriber creation failed", subscriberError);
        } else {
          logStep("Subscriber record created successfully", { userId: authUser.user.id });
        }

        // Mark signup as recovered
        await supabaseClient
          .from('incomplete_signups')
          .update({ 
            status: 'recovered',
            updated_at: new Date().toISOString()
          })
          .eq('id', signup.id);

        recoveryResults.push({ 
          email: signup.email, 
          status: 'recovered', 
          userId: authUser.user.id,
          message: 'Account recovered - you can now log in with your original password'
        });

        logStep("Recovery completed successfully", { 
          email: signup.email, 
          userId: authUser.user.id 
        });

      } catch (error: any) {
        logError("Recovery failed for signup", { 
          email: signup.email, 
          error: error.message 
        });
        recoveryResults.push({ 
          email: signup.email, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Recovery process completed',
      results: recoveryResults,
      recovered: recoveryResults.filter(r => r.status === 'recovered' || r.status === 'recovered_existing_user').length,
      failed: recoveryResults.filter(r => r.status === 'failed').length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logError("Recovery function error", { message: error.message });
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createMissingRecords(supabaseClient: any, authUser: any, signup: any) {
  // Check and create profile if missing
  const { data: existingProfile } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', authUser.id)
    .single();

  if (!existingProfile) {
    await supabaseClient
      .from('profiles')
      .insert({
        id: authUser.id,
        email: signup.email,
        full_name: signup.full_name || '',
        company_name: signup.company_name || '',
        package_type: signup.package_type,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        is_active: true,
        email_verified: true,
        signup_source: 'recovery'
      });
  }

  // Check and create subscriber if missing
  const { data: existingSubscriber } = await supabaseClient
    .from('subscribers')
    .select('id')
    .eq('user_id', authUser.id)
    .single();

  if (!existingSubscriber) {
    await supabaseClient
      .from('subscribers')
      .insert({
        user_id: authUser.id,
        email: signup.email,
        stripe_customer_id: signup.stripe_customer_id,
        subscribed: true,
        subscription_tier: signup.package_type,
        subscription_status: 'active'
      });
  }
}
