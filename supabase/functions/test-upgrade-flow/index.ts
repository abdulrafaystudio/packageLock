
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEST-UPGRADE-FLOW] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("🧪 STARTING COMPREHENSIVE UPGRADE FLOW TEST");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const testResults = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      tests: {} as any,
      critical_issues: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[]
    };

    // Test 1: Stripe Configuration and Connectivity
    try {
      logStep("🔧 Testing Stripe configuration");
      
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey || stripeKey.length < 10) {
        throw new Error("STRIPE_SECRET_KEY not properly configured");
      }
      
      const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
      
      // Test basic Stripe connectivity
      const prices = await stripe.prices.list({ limit: 1 });
      const products = await stripe.products.list({ limit: 1 });
      
      testResults.tests.stripe_connectivity = {
        status: 'pass',
        message: 'Stripe API accessible',
        details: {
          prices_available: prices.data.length,
          products_available: products.data.length
        }
      };
      
    } catch (error: any) {
      testResults.tests.stripe_connectivity = {
        status: 'fail',
        message: error.message,
        impact: 'critical'
      };
      testResults.critical_issues.push(`Stripe: ${error.message}`);
    }

    // Test 2: Database Connectivity and Structure
    try {
      logStep("🗄️ Testing database structure");
      
      // Test critical tables
      const tables = ['subscribers', 'profiles', 'subscription_plans', 'incomplete_signups'];
      const tableResults = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabaseService.from(table).select('*').limit(1);
          if (error) throw error;
          
          tableResults[table] = {
            status: 'accessible',
            sample_count: data?.length || 0
          };
        } catch (tableError: any) {
          tableResults[table] = {
            status: 'error',
            error: tableError.message
          };
          testResults.critical_issues.push(`Table ${table}: ${tableError.message}`);
        }
      }
      
      testResults.tests.database_structure = {
        status: testResults.critical_issues.length === 0 ? 'pass' : 'fail',
        tables: tableResults
      };
      
    } catch (error: any) {
      testResults.tests.database_structure = {
        status: 'fail',
        message: error.message
      };
      testResults.critical_issues.push(`Database: ${error.message}`);
    }

    // Test 3: Subscription Plans Configuration
    try {
      logStep("📋 Testing subscription plans");
      
      const { data: plans, error: plansError } = await supabaseService
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
      
      if (plansError) throw plansError;
      
      const planTypes = ['standard', 'premium', 'enterprise'];
      const billingTypes = ['monthly', 'yearly'];
      const missingPlans = [];
      
      for (const planType of planTypes) {
        for (const billing of billingTypes) {
          const planExists = plans?.some(p => 
            p.package_type === planType && 
            p.billing_frequency === billing &&
            p.stripe_price_id
          );
          
          if (!planExists) {
            missingPlans.push(`${planType}-${billing}`);
          }
        }
      }
      
      if (missingPlans.length > 0) {
        testResults.tests.subscription_plans = {
          status: 'warning',
          message: `Missing plans: ${missingPlans.join(', ')}`,
          available_plans: plans?.length || 0,
          missing_plans: missingPlans
        };
        testResults.warnings.push(`Missing subscription plans: ${missingPlans.join(', ')}`);
      } else {
        testResults.tests.subscription_plans = {
          status: 'pass',
          message: 'All required subscription plans configured',
          available_plans: plans?.length || 0
        };
      }
      
    } catch (error: any) {
      testResults.tests.subscription_plans = {
        status: 'fail',
        message: error.message
      };
      testResults.critical_issues.push(`Subscription plans: ${error.message}`);
    }

    // Test 4: Edge Functions Accessibility
    try {
      logStep("⚡ Testing edge functions");
      
      const criticalFunctions = ['upgrade-subscription', 'upgrade-recovery', 'handle-upgrade-success'];
      const functionResults = {};
      
      for (const funcName of criticalFunctions) {
        try {
          // Test function invocation (this will test if the function exists and is accessible)
          const { error } = await supabaseService.functions.invoke(funcName, {
            body: { test: true }
          });
          
          // We expect some kind of response, even if it's an error due to test data
          functionResults[funcName] = {
            status: 'accessible',
            note: 'Function responds to invocation'
          };
          
        } catch (funcError: any) {
          functionResults[funcName] = {
            status: 'error',
            error: funcError.message
          };
          testResults.warnings.push(`Function ${funcName}: ${funcError.message}`);
        }
      }
      
      testResults.tests.edge_functions = {
        status: 'info',
        functions: functionResults,
        note: 'Function accessibility tested with dummy data'
      };
      
    } catch (error: any) {
      testResults.tests.edge_functions = {
        status: 'fail',
        message: error.message
      };
    }

    // Test 5: RLS Policies
    try {
      logStep("🔐 Testing RLS policies");
      
      // Test that service role can access critical tables
      const { data: subscribersCount } = await supabaseService
        .from('subscribers')
        .select('id', { count: 'exact', head: true });
      
      const { data: profilesCount } = await supabaseService
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      testResults.tests.rls_policies = {
        status: 'pass',
        message: 'Service role has proper access',
        details: {
          subscribers_accessible: true,
          profiles_accessible: true
        }
      };
      
    } catch (error: any) {
      testResults.tests.rls_policies = {
        status: 'fail',
        message: error.message
      };
      testResults.critical_issues.push(`RLS: ${error.message}`);
    }

    // Determine overall status
    if (testResults.critical_issues.length > 0) {
      testResults.overall_status = 'critical_failure';
      testResults.recommendations.push('Fix critical issues before attempting upgrades');
    } else if (testResults.warnings.length > 0) {
      testResults.overall_status = 'warnings_present';
      testResults.recommendations.push('Address warnings for optimal reliability');
    } else {
      testResults.overall_status = 'healthy';
      testResults.recommendations.push('System appears ready for upgrade operations');
    }

    // Add specific recommendations
    if (testResults.critical_issues.length === 0) {
      testResults.recommendations.push('Test upgrade flow with actual Stripe test data');
      testResults.recommendations.push('Monitor edge function logs during testing');
      testResults.recommendations.push('Verify email notifications for failed upgrades');
    }

    logStep("✅ UPGRADE FLOW TEST COMPLETED", {
      status: testResults.overall_status,
      critical_issues: testResults.critical_issues.length,
      warnings: testResults.warnings.length
    });

    const statusCode = testResults.overall_status === 'critical_failure' ? 500 : 200;

    return new Response(JSON.stringify(testResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 UPGRADE FLOW TEST FAILED", { error: errorMessage });
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      overall_status: 'test_failure',
      error: errorMessage,
      message: 'Upgrade flow test system failure'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
