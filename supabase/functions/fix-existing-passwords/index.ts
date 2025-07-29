
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FIX-PASSWORDS] ${step}${detailsStr}`);
};

const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[FIX-PASSWORDS-ERROR] ${error}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Password fix utility started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find auth users who have corresponding incomplete_signups with stored passwords
    const { data: incompleteSignups, error: signupsError } = await supabaseClient
      .from('incomplete_signups')
      .select('*')
      .eq('status', 'completed')
      .not('password', 'is', null)
      .not('password', 'eq', '');

    if (signupsError) {
      throw new Error(`Failed to fetch incomplete signups: ${signupsError.message}`);
    }

    logStep(`Found ${incompleteSignups?.length || 0} completed signups with stored passwords`);

    const results = [];
    let fixedCount = 0;
    let errorCount = 0;

    for (const signup of incompleteSignups || []) {
      try {
        logStep(`Processing password fix for ${signup.email}`);

        // Check if user exists in auth system
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const existingUser = users.users?.find(u => u.email === signup.email);

        if (!existingUser) {
          logStep(`No auth user found for ${signup.email}, skipping`);
          continue;
        }

        // Update the user's password to match their stored password
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          existingUser.id,
          { password: signup.password }
        );

        if (updateError) {
          throw new Error(`Failed to update password: ${updateError.message}`);
        }

        results.push({
          email: signup.email,
          user_id: existingUser.id,
          action: 'password_fixed',
          success: true
        });

        fixedCount++;
        logStep(`Successfully fixed password for ${signup.email}`);

      } catch (error: any) {
        logError(`Failed to fix password for ${signup.email}`, { error: error.message });
        results.push({
          email: signup.email,
          action: 'password_fix_failed',
          success: false,
          error: error.message
        });
        errorCount++;
      }
    }

    logStep("Password fix utility completed", { fixedCount, errorCount });

    return new Response(JSON.stringify({
      success: true,
      message: 'Password fix utility completed',
      summary: {
        total_found: incompleteSignups?.length || 0,
        fixed: fixedCount,
        errors: errorCount
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logError("Password fix utility failed", { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Password fix utility failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
