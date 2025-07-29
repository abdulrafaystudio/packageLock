
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-HEALTH-CHECK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🏥 STARTING UPGRADE SYSTEM HEALTH CHECK");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const healthResults = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      checks: {} as any,
      warnings: [] as string[],
      errors: [] as string[]
    };

    // Check 1: Stripe Configuration
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY not configured");
      }
      
      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
      await stripe.prices.list({ limit: 1 });
      
      healthResults.checks.stripe = {
        status: 'healthy',
        message: 'Stripe API connection successful'
      };
    } catch (error: any) {
      healthResults.checks.stripe = {
        status: 'error',
        message: error.message
      };
      healthResults.errors.push(`Stripe: ${error.message}`);
    }

    // Check 2: Database Connectivity
    try {
      const { data, error } = await supabaseService.from('subscription_plans').select('count').limit(1);
      if (error) throw error;
      
      healthResults.checks.database = {
        status: 'healthy',
        message: 'Database connection successful'
      };
    } catch (error: any) {
      healthResults.checks.database = {
        status: 'error',
        message: error.message
      };
      healthResults.errors.push(`Database: ${error.message}`);
    }

    // Check 3: Critical Tables
    const criticalTables = ['subscribers', 'profiles', 'subscription_plans', 'incomplete_signups'];
    for (const table of criticalTables) {
      try {
        const { error } = await supabaseService.from(table).select('*').limit(1);
        if (error) throw error;
        
        healthResults.checks[`table_${table}`] = {
          status: 'healthy',
          message: `Table ${table} accessible`
        };
      } catch (error: any) {
        healthResults.checks[`table_${table}`] = {
          status: 'error',
          message: error.message
        };
        healthResults.errors.push(`Table ${table}: ${error.message}`);
      }
    }

    // Check 4: Recent Failed Upgrades
    try {
      const { data: recentErrors } = await supabaseService
        .from('error_recovery_log')
        .select('*')
        .eq('service_name', 'upgrade-subscription')
        .eq('resolved', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      if (recentErrors && recentErrors.length > 0) {
        healthResults.checks.recent_upgrade_errors = {
          status: 'warning',
          message: `${recentErrors.length} unresolved upgrade errors in last 24h`,
          count: recentErrors.length
        };
        healthResults.warnings.push(`${recentErrors.length} unresolved upgrade errors detected`);
      } else {
        healthResults.checks.recent_upgrade_errors = {
          status: 'healthy',
          message: 'No recent upgrade errors'
        };
      }
    } catch (error: any) {
      healthResults.checks.recent_upgrade_errors = {
        status: 'error',
        message: error.message
      };
    }

    // Check 5: Subscription Data Consistency
    try {
      const { data: inconsistentData } = await supabaseService.rpc('validate_subscription_sync');
      
      if (inconsistentData && inconsistentData.length > 0) {
        healthResults.checks.data_consistency = {
          status: 'warning',
          message: `${inconsistentData.length} subscription inconsistencies found`,
          count: inconsistentData.length
        };
        healthResults.warnings.push(`${inconsistentData.length} subscription data inconsistencies`);
      } else {
        healthResults.checks.data_consistency = {
          status: 'healthy',
          message: 'Subscription data is consistent'
        };
      }
    } catch (error: any) {
      healthResults.checks.data_consistency = {
        status: 'error',
        message: error.message
      };
    }

    // Determine overall status
    if (healthResults.errors.length > 0) {
      healthResults.overall_status = 'error';
    } else if (healthResults.warnings.length > 0) {
      healthResults.overall_status = 'warning';
    }

    logStep("✅ HEALTH CHECK COMPLETED", {
      status: healthResults.overall_status,
      errors: healthResults.errors.length,
      warnings: healthResults.warnings.length
    });

    return new Response(JSON.stringify(healthResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: healthResults.overall_status === 'error' ? 500 : 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 HEALTH CHECK FAILED", { error: errorMessage });
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      overall_status: 'error',
      error: errorMessage,
      message: 'Health check system failure'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
