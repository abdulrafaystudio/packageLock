import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-FAILED-SIGNUPS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting cleanup of failed signups");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // PHASE 2 FIX: Clean up expired signups
    const { data: expiredSignups, error: selectError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'pending');
    
    if (selectError) {
      throw new Error(`Failed to select expired signups: ${selectError.message}`);
    }
    
    logStep("Found expired signups", { count: expiredSignups?.length || 0 });
    
    // Delete expired signups to clear stored passwords
    const { error: deleteError } = await supabaseClient
      .from('incomplete_signups')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'pending');
    
    if (deleteError) {
      throw new Error(`Failed to delete expired signups: ${deleteError.message}`);
    }
    
    // PHASE 2 FIX: Clean up very old incomplete signups without payment
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const { data: oldSignups, error: oldSelectError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .lt('created_at', threeDaysAgo.toISOString())
      .eq('status', 'pending')
      .is('stripe_customer_id', null);
    
    if (!oldSelectError && oldSignups?.length > 0) {
      logStep("Found old signups without payment", { count: oldSignups.length });
      
      const { error: oldDeleteError } = await supabaseClient
        .from('incomplete_signups')
        .delete()
        .lt('created_at', threeDaysAgo.toISOString())
        .eq('status', 'pending')
        .is('stripe_customer_id', null);
      
      if (oldDeleteError) {
        logStep("Failed to delete old signups", { error: oldDeleteError.message });
      } else {
        logStep("Deleted old signups without payment", { count: oldSignups.length });
      }
    }
    
    logStep("Cleanup completed successfully", {
      expiredDeleted: expiredSignups?.length || 0,
      oldDeleted: oldSignups?.length || 0
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Cleanup completed successfully',
      expired_deleted: expiredSignups?.length || 0,
      old_deleted: oldSignups?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error: any) {
    logStep("CRITICAL ERROR in cleanup", { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Cleanup failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});