import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYSTEM-VALIDATOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting system validation");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    const issues: any[] = [];
    
    // PHASE 3 FIX: Check for orphaned incomplete signups with payments
    const { data: paidOrphans } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('status', 'pending')
      .not('stripe_customer_id', 'is', null)
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Older than 30 minutes
    
    if (paidOrphans?.length > 0) {
      issues.push({
        type: 'paid_orphan_signups',
        count: paidOrphans.length,
        details: paidOrphans.map(s => ({ 
          email: s.email, 
          created_at: s.created_at,
          stripe_customer_id: s.stripe_customer_id 
        })),
        severity: 'high',
        recommended_action: 'trigger_manual_recovery'
      });
    }
    
    // Check for webhook events that failed processing
    const { data: failedWebhooks } = await supabaseClient
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .gt('retry_count', 0)
      .eq('event_type', 'checkout.session.completed');
    
    if (failedWebhooks?.length > 0) {
      issues.push({
        type: 'failed_webhook_processing',
        count: failedWebhooks.length,
        details: failedWebhooks.map(w => ({
          stripe_event_id: w.stripe_event_id,
          retry_count: w.retry_count,
          error_message: w.error_message
        })),
        severity: 'high',
        recommended_action: 'manual_webhook_processing'
      });
    }
    
    // Check for subscription data inconsistencies
    const { data: inconsistentData } = await supabaseClient.rpc('validate_subscription_sync');
    
    if (inconsistentData?.length > 0) {
      issues.push({
        type: 'subscription_data_inconsistency',
        count: inconsistentData.length,
        details: inconsistentData,
        severity: 'medium',
        recommended_action: 'data_reconciliation'
      });
    }
    
    logStep("System validation completed", {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'high').length
    });
    
    // Calculate overall system status and completion percentage
    const criticalIssues = issues.filter(i => i.severity === 'high').length;
    const totalChecks = 4; // database functions, webhooks, user accounts, subscription sync
    const healthyChecks = totalChecks - issues.length;
    const completionPercentage = Math.round((healthyChecks / totalChecks) * 100);
    
    let overallStatus = 'healthy';
    let overallMessage = 'All systems operational';
    
    if (criticalIssues > 0) {
      overallStatus = 'unhealthy';
      overallMessage = `${criticalIssues} critical issues detected`;
    } else if (issues.length > 0) {
      overallStatus = 'degraded';
      overallMessage = `${issues.length} non-critical issues detected`;
    }
    
    // Build component-specific validation results
    const validation = {
      databaseFunctions: {
        status: inconsistentData?.length > 0 ? 'warning' : 'healthy',
        message: inconsistentData?.length > 0 ? `${inconsistentData.length} data inconsistencies found` : 'Database functions operating normally',
        details: inconsistentData
      },
      webhookEvents: {
        status: failedWebhooks?.length > 0 ? 'error' : 'healthy',
        message: failedWebhooks?.length > 0 ? `${failedWebhooks.length} failed webhook events` : 'All webhook events processed successfully',
        details: failedWebhooks
      },
      userAccounts: {
        status: paidOrphans?.length > 0 ? 'error' : 'healthy',
        message: paidOrphans?.length > 0 ? `${paidOrphans.length} orphaned paid accounts` : 'All user accounts properly configured',
        details: paidOrphans
      },
      subscriptionSync: {
        status: issues.length > 0 ? 'warning' : 'healthy',
        message: issues.length > 0 ? 'Some subscription data requires synchronization' : 'All subscription data synchronized',
        details: issues
      },
      overall: {
        status: overallStatus,
        message: overallMessage,
        completionPercentage: completionPercentage
      }
    };

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      validation: validation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error: any) {
    logStep("CRITICAL ERROR in system validation", { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      validation: {
        databaseFunctions: { status: 'error', message: 'Check failed' },
        webhookEvents: { status: 'error', message: 'Check failed' },
        userAccounts: { status: 'error', message: 'Check failed' },
        subscriptionSync: { status: 'error', message: 'Check failed' },
        overall: { status: 'unhealthy', message: error.message, completionPercentage: 0 }
      },
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});