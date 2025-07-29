import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-ACCOUNTS] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[CLEANUP-ACCOUNTS-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Account cleanup function started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let totalFixed = 0;
    let totalErrors = 0;
    const results: any[] = [];

    // Step 1: Remove duplicate incomplete signups using JavaScript logic
    logStep("Finding duplicate incomplete signups");
    const { data: allSignups, error: fetchError } = await supabaseClient
      .from('incomplete_signups')
      .select('id, email, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      logError("Failed to fetch signups", fetchError);
    } else if (allSignups) {
      // Group by email using JavaScript
      const emailGroups: Record<string, any[]> = {};
      allSignups.forEach(signup => {
        if (!emailGroups[signup.email]) {
          emailGroups[signup.email] = [];
        }
        emailGroups[signup.email].push(signup);
      });

      // Find duplicates and remove older ones
      let duplicatesRemoved = 0;
      for (const [email, signups] of Object.entries(emailGroups)) {
        if (signups.length > 1) {
          // Keep the most recent, delete the rest
          const toDelete = signups.slice(0, -1); // All but the last (most recent)
          const deleteIds = toDelete.map(item => item.id);
          
          const { error: deleteError } = await supabaseClient
            .from('incomplete_signups')
            .delete()
            .in('id', deleteIds);
          
          if (!deleteError) {
            logStep(`Removed ${toDelete.length} duplicate signups for ${email}`);
            duplicatesRemoved += toDelete.length;
          } else {
            logError(`Failed to delete duplicates for ${email}`, deleteError);
            totalErrors++;
          }
        }
      }
      logStep(`Total duplicates removed: ${duplicatesRemoved}`);
    }

    // Step 2: Fix subscribers missing stripe_customer_id
    logStep("Fixing subscribers missing Stripe data");
    const { data: brokenSubscribers } = await supabaseClient
      .from('subscribers')
      .select('email, user_id')
      .is('stripe_customer_id', null)
      .eq('subscribed', true);

    if (brokenSubscribers) {
      for (const subscriber of brokenSubscribers) {
        // Try to find corresponding incomplete signup with Stripe data
        const { data: signup } = await supabaseClient
          .from('incomplete_signups')
          .select('stripe_customer_id, stripe_session_id')
          .eq('email', subscriber.email)
          .not('stripe_customer_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (signup?.stripe_customer_id) {
          const { error: updateError } = await supabaseClient
            .from('subscribers')
            .update({
              stripe_customer_id: signup.stripe_customer_id,
              updated_at: new Date().toISOString()
            })
            .eq('email', subscriber.email);

          if (!updateError) {
            logStep(`Fixed subscriber ${subscriber.email} with customer ID ${signup.stripe_customer_id}`);
            totalFixed++;
          } else {
            logError(`Failed to update subscriber ${subscriber.email}`, updateError);
            totalErrors++;
          }
        }
      }
    }

    // Step 3: Mark paid signups as completed
    logStep("Marking paid signups as completed");
    const { data: paidSignups } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('status', 'pending')
      .not('stripe_customer_id', 'is', null);

    if (paidSignups) {
      for (const signup of paidSignups) {
        const { error: markError } = await supabaseClient
          .from('incomplete_signups')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', signup.id);

        if (!markError) {
          logStep(`Marked signup ${signup.email} as completed`);
          totalFixed++;
        } else {
          logError(`Failed to mark signup ${signup.email} as completed`, markError);
          totalErrors++;
        }
      }
    }

    logStep("Account cleanup completed", {
      totalFixed,
      totalErrors
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Account cleanup completed successfully',
      summary: {
        accounts_fixed: totalFixed,
        errors: totalErrors,
        signups_processed: allSignups?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logError("Account cleanup failed", { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Account cleanup failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
