import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Added allowed methods
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // Respond to CORS preflight with all headers and 200 status
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, email } = await req.json();
    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Downgrade user to Free plan immediately
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ subscription_tier: 'free', subscription_status: 'cancelled' })
      .eq('user_id', userId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to cancel subscription', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally, log the cancellation event
    await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'cancelled',
        metadata: {
          email,
          timestamp: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription cancelled and downgraded to Free plan.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
