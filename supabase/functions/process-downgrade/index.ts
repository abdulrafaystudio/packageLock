import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DowngradeRequest {
  targetPlan: string;
  billing: string;
  userId: string;
  email: string;
}

// Map plan names to valid enum values
const mapPlanToEnum = (planName: string): string => {
  const normalizedPlan = planName.toLowerCase().replace(/\s+/g, '');
  
  switch (normalizedPlan) {
    case 'free':
      return 'free';
    case 'freepro':
      return 'freepro';
    case 'standard':
      return 'standard';
    case 'premium':
    case 'premiumpro':
      return 'premium';
    case 'enterprise':
      return 'enterprise';
    default:
      console.warn(`[process-downgrade] Unknown plan: ${planName}, defaulting to free`);
      return 'free';
  }
};

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

    const { targetPlan, billing, userId, email }: DowngradeRequest = await req.json()

    console.log(`[process-downgrade] Processing downgrade request for user ${userId} to ${targetPlan}`)

    // Validate required inputs
    if (!targetPlan || !billing || !userId || !email) {
      console.error('[process-downgrade] Missing required fields:', { targetPlan, billing, userId, email })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current subscriber info
    const { data: currentSubscriber, error: subscriberError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subscriberError || !currentSubscriber) {
      console.error('[process-downgrade] Subscriber not found:', subscriberError)
      return new Response(
        JSON.stringify({ error: 'Subscriber not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map plan names to valid enum values
    const fromPlan = mapPlanToEnum(currentSubscriber.subscription_tier || 'free');
    const toPlan = mapPlanToEnum(targetPlan);

    console.log(`[process-downgrade] Mapping plans: ${currentSubscriber.subscription_tier} -> ${fromPlan}, ${targetPlan} -> ${toPlan}`)

    // Calculate effective date - use subscription end if available, otherwise add 30 days
    let effectiveDate: Date;
    if (currentSubscriber.subscription_end) {
      effectiveDate = new Date(currentSubscriber.subscription_end);
    } else if (currentSubscriber.current_period_end) {
      effectiveDate = new Date(currentSubscriber.current_period_end);
    } else {
      // Fallback: schedule for 30 days from now
      effectiveDate = new Date();
      effectiveDate.setDate(effectiveDate.getDate() + 30);
    }

    console.log(`[process-downgrade] Effective date calculated: ${effectiveDate.toISOString()}`)

    // Check if a downgrade is already scheduled for this user
    const { data: existingTransition } = await supabase
      .from('subscription_transitions')
      .select('*')
      .eq('user_id', userId)
      .eq('transition_type', 'downgrade')
      .gte('effective_date', new Date().toISOString())
      .single();

    if (existingTransition) {
      // Update existing transition instead of creating a new one
      const { error: updateError } = await supabase
        .from('subscription_transitions')
        .update({
          to_plan: toPlan,
          to_billing_frequency: billing,
          effective_date: effectiveDate.toISOString()
        })
        .eq('id', existingTransition.id);

      if (updateError) {
        console.error('[process-downgrade] Error updating existing downgrade:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update downgrade schedule' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[process-downgrade] Updated existing downgrade schedule for user ${userId}`)
    } else {
      // Create a new downgrade schedule record
      const { error: scheduleError } = await supabase
        .from('subscription_transitions')
        .insert({
          user_id: userId,
          from_plan: fromPlan,
          to_plan: toPlan,
          from_billing_frequency: billing,
          to_billing_frequency: billing,
          transition_type: 'downgrade',
          effective_date: effectiveDate.toISOString(),
          stripe_subscription_id: currentSubscriber.stripe_subscription_id
        })

      if (scheduleError) {
        console.error('[process-downgrade] Error scheduling downgrade:', scheduleError)
        return new Response(
          JSON.stringify({ error: 'Failed to schedule downgrade', details: scheduleError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[process-downgrade] Created new downgrade schedule for user ${userId}`)
    }

    // Log the downgrade event (always create a new event)
    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        event_type: 'downgrade_scheduled',
        metadata: {
          from_plan: fromPlan,
          to_plan: toPlan,
          billing_frequency: billing,
          effective_date: effectiveDate.toISOString(),
          timestamp: new Date().toISOString()
        }
      })

    if (eventError) {
      console.warn('[process-downgrade] Warning: Failed to log event (non-critical):', eventError)
    }

    console.log(`[process-downgrade] Downgrade scheduled successfully for user ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Downgrade to ${targetPlan} scheduled for ${effectiveDate.toLocaleDateString()}`,
        effective_date: effectiveDate.toISOString(),
        from_plan: fromPlan,
        to_plan: toPlan
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[process-downgrade] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})