import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-MONITOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook monitoring check started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Phase 3: Webhook Redundancy System
    // Check for recent incomplete signups that should have been processed by webhooks
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: unprocessedSignups, error: signupError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('status', 'completed')
      .gte('updated_at', oneHourAgo)
      .not('stripe_customer_id', 'is', null);

    if (signupError) {
      logStep("Error checking incomplete signups", { error: signupError.message });
      throw new Error(`Database error: ${signupError.message}`);
    }

    logStep("Found signups to check", { count: unprocessedSignups?.length || 0 });

    let processedCount = 0;
    let errorCount = 0;

    // Check each signup to see if it has corresponding auth user and subscriber
    for (const signup of unprocessedSignups || []) {
      try {
        logStep("Checking signup", { email: signup.email, signupId: signup.id });

        // Check if user exists in auth
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
        const authUser = authUsers.users.find(u => u.email === signup.email);

        if (!authUser) {
          logStep("Missing auth user, triggering processing", { email: signup.email });
          
          // Call immediate customer sync to process this signup
          const syncResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/immediate-customer-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              sessionId: signup.stripe_session_id,
              email: signup.email
            })
          });

          if (syncResponse.ok) {
            processedCount++;
            logStep("Successfully triggered processing", { email: signup.email });
          } else {
            errorCount++;
            logStep("Failed to trigger processing", { 
              email: signup.email, 
              status: syncResponse.status 
            });
          }
          continue;
        }

        // Check if subscriber exists with customer ID
        const { data: subscriber } = await supabaseClient
          .from('subscribers')
          .select('*')
          .eq('email', signup.email)
          .single();

        if (!subscriber || !subscriber.stripe_customer_id) {
          logStep("Missing subscriber or customer ID, fixing", { 
            email: signup.email,
            hasSubscriber: !!subscriber,
            hasCustomerId: !!subscriber?.stripe_customer_id
          });

          // Use the safe save function to ensure customer ID is saved
          const { data: saveResult } = await supabaseClient.rpc('safe_save_stripe_customer_id', {
            p_user_id: authUser.id,
            p_email: signup.email,
            p_stripe_customer_id: signup.stripe_customer_id,
            p_subscription_tier: signup.package_type,
            p_subscription_status: 'active'
          });

          if (saveResult?.success) {
            processedCount++;
            logStep("Successfully fixed customer ID", { email: signup.email });
          } else {
            errorCount++;
            logStep("Failed to fix customer ID", { 
              email: signup.email,
              error: saveResult?.error_message 
            });
          }
        }

      } catch (processError: any) {
        errorCount++;
        logStep("Error processing signup", { 
          email: signup.email,
          error: processError.message 
        });
      }
    }

    // Phase 4: Run auto-healing for any remaining issues
    logStep("Running auto-healing system");
    const { data: healResult } = await supabaseClient.rpc('auto_heal_missing_customer_ids');
    
    logStep("Webhook monitoring completed", {
      totalChecked: unprocessedSignups?.length || 0,
      processed: processedCount,
      errors: errorCount,
      healed: healResult?.healed_count || 0
    });

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalChecked: unprocessedSignups?.length || 0,
        processed: processedCount,
        errors: errorCount,
        healed: healResult?.healed_count || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep("Error in webhook monitoring", { error: error.message });
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});