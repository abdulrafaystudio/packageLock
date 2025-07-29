import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECOVERY-PROCESSOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting recovery processor");

    // Step 1: Get all failed webhooks
    const { data: failedWebhooks, error: webhookError } = await supabaseClient
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: false });

    if (webhookError) {
      throw new Error(`Failed to get webhooks: ${webhookError.message}`);
    }

    logStep("Found failed webhooks", { count: failedWebhooks?.length });

    // Step 2: Get incomplete signups that need recovery
    const { data: completedSignups, error: signupError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('status', 'completed')
      .not('stripe_customer_id', 'is', null);

    if (signupError) {
      throw new Error(`Failed to get signups: ${signupError.message}`);
    }

    logStep("Found completed signups needing auth creation", { count: completedSignups?.length });

    let recoveredCount = 0;
    const recoveryResults = [];

    // Step 3: Process each completed signup
    for (const signup of completedSignups || []) {
      try {
        logStep("Processing signup", { email: signup.email });

        // Check if auth user already exists
        const { data: existingUsers, error: userQueryError } = await supabaseClient.auth.admin.listUsers();
        const userExists = existingUsers?.users?.find(u => u.email === signup.email);

        if (userExists) {
          logStep("User already exists", { email: signup.email, userId: userExists.id });
          recoveryResults.push({
            email: signup.email,
            status: 'already_exists',
            userId: userExists.id
          });
          continue;
        }

        // Generate secure password (not returned to user)
        const securePassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Create auth user
        const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
          email: signup.email,
          password: securePassword,
          email_confirm: false, // User will set password via reset
          user_metadata: {
            full_name: signup.full_name || '',
            company_name: signup.company_name || '',
            package_type: signup.package_type,
            signup_source: 'recovery_processor'
          }
        });

        if (createUserError) {
          throw new Error(`Failed to create user: ${createUserError.message}`);
        }

        logStep("Created auth user", { email: signup.email, userId: newUser.user?.id });

        // Update profile with subscription info
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .upsert({
            id: newUser.user!.id,
            email: signup.email,
            full_name: signup.full_name || '',
            company_name: signup.company_name || '',
            package_type: signup.package_type,
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            is_active: true,
            email_verified: true,
            signup_source: 'recovery_processor'
          });

        if (profileError) {
          logStep("Profile update error (non-critical)", { error: profileError.message });
        }

        // Create subscriber record
        const { error: subscriberError } = await supabaseClient
          .from('subscribers')
          .upsert({
            user_id: newUser.user!.id,
            email: signup.email,
            stripe_customer_id: signup.stripe_customer_id,
            subscribed: true,
            subscription_tier: signup.package_type,
            subscription_status: 'active'
          });

        if (subscriberError) {
          logStep("Subscriber update error (non-critical)", { error: subscriberError.message });
        }

        // Trigger password reset email
        await supabaseClient.auth.resetPasswordForEmail(signup.email, {
          redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/login`
        });

        recoveredCount++;
        recoveryResults.push({
          email: signup.email,
          status: 'recovered',
          userId: newUser.user!.id,
          requiresPasswordReset: true,
          message: 'Account created. Check email for password setup instructions.'
        });

        logStep("Successfully recovered account", { email: signup.email });

      } catch (error: any) {
        logStep("Error processing signup", { email: signup.email, error: error.message });
        recoveryResults.push({
          email: signup.email,
          status: 'error',
          error: error.message
        });
      }
    }

    // Step 4: Mark failed webhooks as processed since we've manually recovered the accounts
    if (failedWebhooks && failedWebhooks.length > 0) {
      const { error: markError } = await supabaseClient
        .from('webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: `Manually recovered by recovery processor - ${recoveredCount} accounts created`
        })
        .eq('processed', false);

      if (markError) {
        logStep("Warning: Could not mark webhooks as processed", { error: markError.message });
      } else {
        logStep("Marked failed webhooks as processed");
      }
    }

    logStep("Recovery complete", { recoveredCount, totalResults: recoveryResults.length });

    return new Response(JSON.stringify({
      success: true,
      message: 'Recovery processing completed',
      recoveredAccounts: recoveredCount,
      totalProcessed: recoveryResults.length,
      results: recoveryResults,
      processedWebhooks: failedWebhooks?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    logStep("CRITICAL ERROR", { message: error.message });
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});