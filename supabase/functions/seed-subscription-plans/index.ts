
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Sample subscription plans - replace with your actual Stripe price IDs
    const subscriptionPlans = [
      {
        package_type: 'standard',
        billing_frequency: 'monthly',
        stripe_price_id: 'price_1standard_monthly', // Replace with actual Stripe price ID
        monthly_price: 29.00,
        is_active: true
      },
      {
        package_type: 'standard',
        billing_frequency: 'yearly',
        stripe_price_id: 'price_1standard_yearly', // Replace with actual Stripe price ID
        yearly_price: 290.00,
        is_active: true
      },
      {
        package_type: 'premium',
        billing_frequency: 'monthly',
        stripe_price_id: 'price_1premium_monthly', // Replace with actual Stripe price ID
        monthly_price: 59.00,
        is_active: true
      },
      {
        package_type: 'premium',
        billing_frequency: 'yearly',
        stripe_price_id: 'price_1premium_yearly', // Replace with actual Stripe price ID
        yearly_price: 590.00,
        is_active: true
      },
      {
        package_type: 'premiumpro',
        billing_frequency: 'monthly',
        stripe_price_id: 'price_1premiumpro_monthly', // Replace with actual Stripe price ID
        monthly_price: 99.00,
        is_active: true
      },
      {
        package_type: 'premiumpro',
        billing_frequency: 'yearly',
        stripe_price_id: 'price_1premiumpro_yearly', // Replace with actual Stripe price ID
        yearly_price: 990.00,
        is_active: true
      },
      {
        package_type: 'enterprise',
        billing_frequency: 'monthly',
        stripe_price_id: 'price_1enterprise_monthly', // Replace with actual Stripe price ID
        monthly_price: 199.00,
        is_active: true
      },
      {
        package_type: 'enterprise',
        billing_frequency: 'yearly',
        stripe_price_id: 'price_1enterprise_yearly', // Replace with actual Stripe price ID
        yearly_price: 1990.00,
        is_active: true
      }
    ];

    // Insert or update subscription plans
    const { error } = await supabaseClient
      .from('subscription_plans')
      .upsert(subscriptionPlans, { 
        onConflict: 'package_type,billing_frequency',
        ignoreDuplicates: false 
      });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Subscription plans seeded successfully',
      plans_count: subscriptionPlans.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Seeding error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
