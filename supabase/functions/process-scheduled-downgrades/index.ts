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

    console.log('[process-scheduled-downgrades] Starting scheduled downgrade processing')

    // Get all scheduled downgrades that are due for execution
    const { data: dueDowngrades, error: fetchError } = await supabase
      .from('subscription_transitions')
      .select('*')
      .eq('transition_type', 'downgrade')
      .lte('effective_date', new Date().toISOString())
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('[process-scheduled-downgrades] Error fetching due downgrades:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled downgrades' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!dueDowngrades || dueDowngrades.length === 0) {
      console.log('[process-scheduled-downgrades] No scheduled downgrades due for processing')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No scheduled downgrades due for processing',
          processed_count: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[process-scheduled-downgrades] Found ${dueDowngrades.length} downgrades due for processing`)

    let processedCount = 0
    let failedCount = 0

    for (const downgrade of dueDowngrades) {
      try {
        console.log(`[process-scheduled-downgrades] Processing downgrade for user ${downgrade.user_id} from ${downgrade.from_plan} to ${downgrade.to_plan}`)

        // Update subscriber record with new plan
        const { error: subscriberError } = await supabase
          .from('subscribers')
          .update({
            subscription_tier: downgrade.to_plan,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', downgrade.user_id)

        if (subscriberError) {
          console.error(`[process-scheduled-downgrades] Error updating subscriber for user ${downgrade.user_id}:`, subscriberError)
          failedCount++
          continue
        }

        // Update profiles table to keep in sync
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            package_type: downgrade.to_plan,
            updated_at: new Date().toISOString()
          })
          .eq('id', downgrade.user_id)

        if (profileError) {
          console.warn(`[process-scheduled-downgrades] Warning: Failed to update profile for user ${downgrade.user_id}:`, profileError)
        }

        // Log the completion event
        const { error: eventError } = await supabase
          .from('subscription_events')
          .insert({
            user_id: downgrade.user_id,
            event_type: 'downgrade_executed',
            metadata: {
              from_plan: downgrade.from_plan,
              to_plan: downgrade.to_plan,
              original_effective_date: downgrade.effective_date,
              executed_at: new Date().toISOString(),
              transition_id: downgrade.id
            }
          })

        if (eventError) {
          console.warn(`[process-scheduled-downgrades] Warning: Failed to log event for user ${downgrade.user_id}:`, eventError)
        }

        // Remove the processed transition record
        const { error: deleteError } = await supabase
          .from('subscription_transitions')
          .delete()
          .eq('id', downgrade.id)

        if (deleteError) {
          console.warn(`[process-scheduled-downgrades] Warning: Failed to delete transition record ${downgrade.id}:`, deleteError)
        }

        processedCount++
        console.log(`[process-scheduled-downgrades] Successfully processed downgrade for user ${downgrade.user_id}`)

      } catch (error) {
        console.error(`[process-scheduled-downgrades] Error processing downgrade for user ${downgrade.user_id}:`, error)
        failedCount++
      }
    }

    console.log(`[process-scheduled-downgrades] Processing complete. Processed: ${processedCount}, Failed: ${failedCount}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${processedCount} scheduled downgrades`,
        processed_count: processedCount,
        failed_count: failedCount,
        total_due: dueDowngrades.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[process-scheduled-downgrades] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
