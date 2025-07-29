import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANUAL-RECOVERY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Manual recovery initiated");
    
    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error('session_id is required');
    }
    
    logStep("Processing recovery for session", { session_id });
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // PHASE 1 FIX: Find incomplete signup by session ID
    const { data: incompleteSignup, error: lookupError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('stripe_session_id', session_id)
      .eq('status', 'pending')
      .single();
    
    if (lookupError || !incompleteSignup) {
      logStep("No incomplete signup found for session", { session_id, error: lookupError });
      return new Response(JSON.stringify({
        success: false,
        error: 'no_incomplete_signup',
        message: 'No pending signup found for this session'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }
    
    logStep("Found incomplete signup", { 
      email: incompleteSignup.email,
      package_type: incompleteSignup.package_type,
      stripe_customer_id: incompleteSignup.stripe_customer_id
    });
    
    // PHASE 2 FIX: Complete the signup using the stored data
    const { data: completionResult, error: completionError } = await supabaseClient.rpc('complete_paid_signup', {
      p_email: incompleteSignup.email,
      p_stripe_customer_id: incompleteSignup.stripe_customer_id,
      p_stripe_subscription_id: '', // We'll get this from webhook data if needed
      p_subscription_tier: incompleteSignup.package_type,
      p_full_name: incompleteSignup.full_name || '',
      p_company_name: incompleteSignup.company_name || '',
      p_password: incompleteSignup.password
    });
    
    if (completionError || !completionResult?.success) {
      logStep("Signup completion failed", { error: completionError, result: completionResult });
      throw new Error(`Signup completion failed: ${completionError?.message || 'Unknown error'}`);
    }
    
    logStep("Signup completion successful", completionResult);
    
    // Create auth user with stored password
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: incompleteSignup.email,
      password: incompleteSignup.password,
      email_confirm: true,
      user_metadata: {
        full_name: incompleteSignup.full_name,
        company_name: incompleteSignup.company_name,
        package_type: incompleteSignup.package_type,
        signup_source: 'manual_recovery',
        stripe_customer_id: incompleteSignup.stripe_customer_id,
        recovery_session_id: session_id
      }
    });
    
    if (authError || !authUser.user) {
      logStep("Auth user creation failed", { error: authError });
      throw new Error(`Auth user creation failed: ${authError?.message}`);
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
        email: incompleteSignup.email,
        full_name: incompleteSignup.full_name,
        company_name: incompleteSignup.company_name,
        package_type: incompleteSignup.package_type,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        is_active: true,
        email_verified: true,
        signup_source: 'manual_recovery'
      });
    
    if (profileError) {
      logStep("Profile creation failed", { error: profileError });
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    
    // Create subscriber record
    const { error: subscriberError } = await supabaseClient
      .from('subscribers')
      .insert({
        user_id: authUser.user.id,
        email: incompleteSignup.email,
        stripe_customer_id: incompleteSignup.stripe_customer_id,
        subscribed: true,
        subscription_tier: incompleteSignup.package_type,
        subscription_status: 'active'
      });
    
    if (subscriberError) {
      logStep("Subscriber creation failed", { error: subscriberError });
      // Don't fail the whole process for this
      logStep("WARNING: Subscriber record creation failed but continuing");
    }
    
    // Mark signup as completed
    await supabaseClient
      .from('incomplete_signups')
      .update({ 
        status: 'completed', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', incompleteSignup.id);
    
    logStep("Manual recovery completed successfully", {
      userId: authUser.user.id,
      email: incompleteSignup.email,
      package_type: incompleteSignup.package_type
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Account recovery completed successfully',
      user_id: authUser.user.id,
      email: incompleteSignup.email,
      package_type: incompleteSignup.package_type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error: any) {
    logStep("CRITICAL ERROR in manual recovery", { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Manual recovery failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});