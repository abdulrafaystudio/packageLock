import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BATCH-RECOVERY] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[BATCH-RECOVERY-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting batch recovery for stuck accounts");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all incomplete signups that need recovery
    const { data: incompleteSignups, error: fetchError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .in('status', ['pending', 'completed'])
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch incomplete signups: ${fetchError.message}`);
    }

    logStep("Found incomplete signups", { count: incompleteSignups?.length || 0 });

    const results = [];
    
    // Process each unique email (get most recent signup for each)
    const uniqueEmails = new Set();
    const signupsToProcess = [];
    
    for (const signup of incompleteSignups || []) {
      if (!uniqueEmails.has(signup.email)) {
        uniqueEmails.add(signup.email);
        signupsToProcess.push(signup);
      }
    }

    logStep("Processing unique emails", { count: signupsToProcess.length });

    for (const signup of signupsToProcess) {
      try {
        logStep("Processing signup", { email: signup.email });

        // Check if user already exists
        const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
        const existingUser = existingUsers.users?.find(u => u.email === signup.email);

        if (existingUser) {
          logStep("User already exists", { email: signup.email, userId: existingUser.id });
          results.push({ email: signup.email, status: 'already_exists', userId: existingUser.id });
          continue;
        }

        // Use stored password if available, otherwise force password reset
        const useStoredPassword = signup.password && signup.password.length > 0;
        const password = useStoredPassword ? signup.password : Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        logStep("Creating auth user", { 
          email: signup.email, 
          usingStoredPassword: useStoredPassword 
        });

        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: signup.email,
          password: password,
          email_confirm: true, // Confirm email if using stored password
          user_metadata: {
            full_name: signup.full_name || '',
            company_name: signup.company_name || '',
            package_type: signup.package_type,
            signup_source: 'batch_recovery',
            stripe_customer_id: signup.stripe_customer_id
          }
        });

        if (authError || !authUser.user) {
          logError("Failed to create auth user", { email: signup.email, error: authError?.message });
          results.push({ email: signup.email, status: 'auth_failed', error: authError?.message });
          continue;
        }

        logStep("Auth user created", { email: signup.email, userId: authUser.user.id });

        // Create profile
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
            signup_source: 'batch_recovery'
          });

        if (profileError) {
          logError("Profile creation failed", { email: signup.email, error: profileError.message });
        } else {
          logStep("Profile created", { email: signup.email });
        }

        // Create subscriber
        const { error: subscriberError } = await supabaseClient
          .from('subscribers')
          .insert({
            user_id: authUser.user.id,
            email: signup.email,
            stripe_customer_id: signup.stripe_customer_id,
            subscribed: true,
            subscription_tier: signup.package_type,
            subscription_status: 'active'
          });

        if (subscriberError) {
          logError("Subscriber creation failed", { email: signup.email, error: subscriberError.message });
        } else {
          logStep("Subscriber created", { email: signup.email });
        }

        // Update signup status
        await supabaseClient
          .from('incomplete_signups')
          .update({ 
            status: 'recovered',
            updated_at: new Date().toISOString()
          })
          .eq('email', signup.email);

        // Only trigger password reset if we didn't use stored password
        if (!useStoredPassword) {
          await supabaseClient.auth.resetPasswordForEmail(signup.email, {
            redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/login`
          });
        }

        results.push({ 
          email: signup.email, 
          status: 'recovered', 
          userId: authUser.user.id,
          requiresPasswordReset: !useStoredPassword,
          message: useStoredPassword 
            ? 'Account recovered - you can now log in with your original password'
            : 'Account created. Check email for password setup instructions.'
        });

        logStep("Recovery completed", { email: signup.email, userId: authUser.user.id });

      } catch (error: any) {
        logError("Recovery failed", { email: signup.email, error: error.message });
        results.push({ email: signup.email, status: 'failed', error: error.message });
      }
    }

    const summary = {
      total: results.length,
      recovered: results.filter(r => r.status === 'recovered').length,
      already_exists: results.filter(r => r.status === 'already_exists').length,
      failed: results.filter(r => r.status === 'failed').length
    };

    logStep("Batch recovery completed", summary);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Batch recovery completed',
      summary: summary,
      results: results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logError("Batch recovery function error", { error: error.message });
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});