import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[manual-downgrade-test] Processing manual downgrade test')

    // Get the user's scheduled downgrade
    const { data: pendingDowngrade, error: fetchError } = await supabase
      .from('subscription_transitions')
      .select('*')
      .eq('user_id', '702adfae-6e51-4c99-b989-f4b8dc6baad6')
      .eq('transition_type', 'downgrade')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !pendingDowngrade) {
      console.error('[manual-downgrade-test] No pending downgrade found:', fetchError)
      return new Response(
        JSON.stringify({ error: 'No pending downgrade found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[manual-downgrade-test] Found downgrade: ${pendingDowngrade.from_plan} -> ${pendingDowngrade.to_plan}`)

    // Execute the downgrade immediately for testing
    const { error: subscriberError } = await supabase
      .from('subscribers')
      .update({
        subscription_tier: pendingDowngrade.to_plan,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', pendingDowngrade.user_id)

    if (subscriberError) {
      console.error('[manual-downgrade-test] Error updating subscriber:', subscriberError)
      return new Response(
        JSON.stringify({ error: 'Failed to update subscriber' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update profiles table 
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        package_type: pendingDowngrade.to_plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingDowngrade.user_id)

    if (profileError) {
      console.warn('[manual-downgrade-test] Warning: Failed to update profile:', profileError)
    }

    // Log the event
    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert({
        user_id: pendingDowngrade.user_id,
        event_type: 'downgrade_executed_manual_test',
        metadata: {
          from_plan: pendingDowngrade.from_plan,
          to_plan: pendingDowngrade.to_plan,
          original_effective_date: pendingDowngrade.effective_date,
          executed_at: new Date().toISOString(),
          transition_id: pendingDowngrade.id,
          test_mode: true
        }
      })

    if (eventError) {
      console.warn('[manual-downgrade-test] Warning: Failed to log event:', eventError)
    }

    // Remove the processed transition
    const { error: deleteError } = await supabase
      .from('subscription_transitions')
      .delete()
      .eq('id', pendingDowngrade.id)

    if (deleteError) {
      console.warn('[manual-downgrade-test] Warning: Failed to delete transition:', deleteError)
    }

    console.log(`[manual-downgrade-test] Successfully executed downgrade for user ${pendingDowngrade.user_id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully executed downgrade from ${pendingDowngrade.from_plan} to ${pendingDowngrade.to_plan}`,
        from_plan: pendingDowngrade.from_plan,
        to_plan: pendingDowngrade.to_plan,
        user_id: pendingDowngrade.user_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[manual-downgrade-test] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})