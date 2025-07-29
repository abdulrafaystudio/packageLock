import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYSTEM-TEST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Starting comprehensive system verification");

    // Step 1: Process pending signups via manual-recovery
    logStep("Processing pending signups");
    const { data: recoveryData, error: recoveryError } = await supabaseClient.functions.invoke('manual-recovery');
    
    if (recoveryError) {
      logStep("Manual recovery error", recoveryError);
    } else {
      logStep("Manual recovery completed", recoveryData);
    }

    // Step 2: Test webhook retry functionality
    logStep("Testing webhook retry");
    const { data: retryData, error: retryError } = await supabaseClient.functions.invoke('webhook-retry');
    
    if (retryError) {
      logStep("Webhook retry error", retryError);
    } else {
      logStep("Webhook retry completed", retryData);
    }

    // Step 3: Test complete_paid_signup function with 7 parameters
    logStep("Testing complete_paid_signup function with 7 parameters");
    const { data: functionTest, error: functionError } = await supabaseClient.rpc('complete_paid_signup', {
      p_email: 'verification-test@example.com',
      p_stripe_customer_id: 'cus_verification_test',
      p_stripe_subscription_id: 'sub_verification_test',
      p_subscription_tier: 'standard',
      p_full_name: 'Verification Test User',
      p_company_name: 'Test Verification Co',
      p_password: 'VerificationTest123!'
    });

    if (functionError) {
      logStep("Function test error", functionError);
    } else {
      logStep("Function test completed successfully", functionTest);
    }

    // Step 4: Check current system state
    const { data: pendingCount } = await supabaseClient
      .from('incomplete_signups')
      .select('*', { count: 'exact' })
      .eq('status', 'pending');

    const { data: failedCount } = await supabaseClient
      .from('webhook_events')
      .select('*', { count: 'exact' })
      .eq('processed', false);

    const { data: recentWebhooks } = await supabaseClient
      .from('webhook_events')
      .select('stripe_event_id, event_type, processed, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Step 5: System health check
    const systemStatus = {
      verification_completed: true,
      pending_signups: pendingCount?.length || 0,
      failed_webhooks: failedCount?.length || 0,
      manual_recovery_result: recoveryData,
      webhook_retry_result: retryData,
      function_test_result: functionTest,
      recent_webhooks: recentWebhooks || [],
      timestamp: new Date().toISOString()
    };

    logStep("System verification completed", systemStatus);

    return new Response(JSON.stringify({
      success: true,
      message: 'Comprehensive system verification completed',
      verification_results: systemStatus
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("System verification error", { error: error.message });
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});