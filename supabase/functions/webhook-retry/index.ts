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

  console.log('[WEBHOOK-RETRY] Processing failed webhooks...');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get failed webhook events
    const { data: failedWebhooks, error: fetchError } = await supabaseClient
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .lt('retry_count', 3)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch webhooks: ${fetchError.message}`);
    }

    if (!failedWebhooks || failedWebhooks.length === 0) {
      console.log('[WEBHOOK-RETRY] No failed webhooks to retry');
      return new Response(JSON.stringify({
        success: true,
        message: 'No failed webhooks found',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each failed webhook
    for (const webhook of failedWebhooks) {
      try {
        console.log(`[WEBHOOK-RETRY] Processing webhook ${webhook.stripe_event_id}`);

        // Call the main webhook handler
        const webhookResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-webhook`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'stripe-signature': 'retry-internal' // Special marker for retry
            },
            body: JSON.stringify(webhook.event_data)
          }
        );

        if (webhookResponse.ok) {
          // Mark as processed
          await supabaseClient
            .from('webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              error_message: null
            })
            .eq('stripe_event_id', webhook.stripe_event_id);

          successCount++;
          console.log(`[WEBHOOK-RETRY] Successfully processed ${webhook.stripe_event_id}`);
        } else {
          // Update retry count
          await supabaseClient
            .from('webhook_events')
            .update({
              retry_count: (webhook.retry_count || 0) + 1,
              error_message: `Retry failed: ${webhookResponse.status}`,
              processed_at: new Date().toISOString()
            })
            .eq('stripe_event_id', webhook.stripe_event_id);

          errorCount++;
          console.error(`[WEBHOOK-RETRY] Failed to process ${webhook.stripe_event_id}: ${webhookResponse.status}`);
        }
      } catch (error: any) {
        // Update retry count with error
        await supabaseClient
          .from('webhook_events')
          .update({
            retry_count: (webhook.retry_count || 0) + 1,
            error_message: `Retry exception: ${error.message}`,
            processed_at: new Date().toISOString()
          })
          .eq('stripe_event_id', webhook.stripe_event_id);

        errorCount++;
        console.error(`[WEBHOOK-RETRY] Exception processing ${webhook.stripe_event_id}:`, error);
      }
    }

    console.log(`[WEBHOOK-RETRY] Completed: ${successCount} success, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook retry processing completed',
      processed: successCount,
      errors: errorCount,
      total: failedWebhooks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[WEBHOOK-RETRY] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});