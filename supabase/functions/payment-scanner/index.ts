
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT-SCANNER] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[PAYMENT-SCANNER-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment scanner started");

    // Initialize Stripe FIRST before any other operations
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20'
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find incomplete signups with Stripe customer IDs (paid but not completed)
    const { data: incompleteSignups, error: signupsError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('status', 'pending')
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (signupsError) {
      throw new Error(`Failed to fetch incomplete signups: ${signupsError.message}`);
    }

    logStep(`Found ${incompleteSignups?.length || 0} incomplete signups with payments`);

    const results = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const signup of incompleteSignups || []) {
      try {
        logStep(`Processing signup for ${signup.email}`, { signupId: signup.id });

        // Check if customer has active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: signup.stripe_customer_id,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length === 0) {
          logStep(`No active subscription found for ${signup.email}`);
          continue;
        }

        const subscription = subscriptions.data[0];
        logStep(`Found active subscription for ${signup.email}`, { subscriptionId: subscription.id });

        // Check if user already exists in auth system
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const existingUser = users.users?.find(u => u.email === signup.email);

        if (existingUser) {
          logStep(`User already exists in auth system: ${signup.email}`);
          
          // Update the signup status and subscriber record
          await supabaseClient
            .from('incomplete_signups')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', signup.id);

          // Ensure subscriber record exists with complete data
          await supabaseClient
            .from('subscribers')
            .upsert({
              user_id: existingUser.id,
              email: signup.email,
              stripe_customer_id: signup.stripe_customer_id,
              subscribed: true,
              subscription_tier: signup.package_type,
              subscription_status: 'active',
              stripe_subscription_id: subscription.id,
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              proration_credits: 0,
              updated_at: new Date().toISOString()
            }, { onConflict: 'email' });

          results.push({ email: signup.email, action: 'linked_existing_user', success: true });
          processedCount++;
          continue;
        }

        // Use stored password from signup, with fallback to secure random password
        let userPassword = signup.password;
        if (!userPassword || userPassword.trim() === '') {
          userPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          logStep(`No stored password found for ${signup.email}, using generated password`);
        } else {
          logStep(`Using stored password for ${signup.email}`);
        }
        
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: signup.email,
          password: userPassword,
          email_confirm: true, // Confirm email since payment was successful
          user_metadata: {
            full_name: signup.full_name || '',
            company_name: signup.company_name || '',
            package_type: signup.package_type,
            signup_source: 'payment_scanner_recovery',
            stripe_customer_id: signup.stripe_customer_id
          }
        });

        if (authError || !authUser.user) {
          throw new Error(`Auth user creation failed: ${authError?.message}`);
        }

        logStep(`Created auth user for ${signup.email}`, { userId: authUser.user.id });

        // Create profile with ALL required fields
        await supabaseClient
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: signup.email,
            full_name: signup.full_name || '',
            company_name: signup.company_name || '',
            package_type: signup.package_type,
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            is_active: true,
            email_verified: true,
            signup_source: 'payment_scanner_recovery',
            phone: null,
            last_login: null,
            grace_period_end: null,
            pending_downgrade_to: null,
            pending_downgrade_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        // Create subscriber with complete data
        await supabaseClient
          .from('subscribers')
          .insert({
            user_id: authUser.user.id,
            email: signup.email,
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
          });

        // Mark signup as completed
        await supabaseClient
          .from('incomplete_signups')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', signup.id);

        results.push({ 
          email: signup.email, 
          action: 'created_complete_account', 
          success: true,
          used_stored_password: !!signup.password,
          message: signup.password ? 'Account created with stored password' : 'Account created with generated password'
        });
        processedCount++;

        logStep(`Successfully processed ${signup.email}`);

      } catch (error: any) {
        logError(`Failed to process ${signup.email}`, { error: error.message });
        results.push({ email: signup.email, action: 'failed', success: false, error: error.message });
        errorCount++;
      }
    }

    logStep("Payment scanner completed", { processedCount, errorCount });

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment scanner completed',
      summary: {
        total_found: incompleteSignups?.length || 0,
        processed: processedCount,
        errors: errorCount
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logError("Payment scanner failed", { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Payment scanner failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
