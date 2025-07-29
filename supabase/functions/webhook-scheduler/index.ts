import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    console.log('[WEBHOOK-SCHEDULER] Starting scheduled webhook retry processing');

    // Call the webhook retry processor
    const retryResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-retry-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const retryResult = await retryResponse.json();
    console.log('[WEBHOOK-SCHEDULER] Retry processing result:', retryResult);

    // Also run the database cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabaseClient
      .rpc('process_webhook_retries');

    if (cleanupError) {
      console.error('[WEBHOOK-SCHEDULER] Cleanup error:', cleanupError);
    } else {
      console.log('[WEBHOOK-SCHEDULER] Cleanup result:', cleanupResult);
    }

    return new Response(JSON.stringify({
      success: true,
      retry_result: retryResult,
      cleanup_result: cleanupResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[WEBHOOK-SCHEDULER] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});