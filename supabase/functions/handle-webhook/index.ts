import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logStep, logError } from './utils/logging.ts';
import { storeWebhookEvent, markWebhookProcessed } from './utils/webhook-storage.ts';
import { verifyStripeSignature } from './utils/signature-verification.ts';
import { processWebhookEvent } from './processors/event-processor.ts';

serve(async (req) => {
  // Handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  // Add comprehensive request logging
  logStep("Webhook request received", {
    method: req.method,
    url: req.url,
    contentType: req.headers.get('content-type'),
    userAgent: req.headers.get('user-agent'),
    hasSignature: !!req.headers.get('stripe-signature'),
    timestamp: new Date().toISOString()
  });

  // Only accept POST requests from Stripe
  if (req.method !== 'POST') {
    logError("Invalid method", { method: req.method });
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    logError("No stripe-signature header found", {
      allHeaders: Object.fromEntries(req.headers.entries()),
      url: req.url,
      method: req.method
    });
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    logStep("Environment check", {
      hasWebhookSecret: !!webhookSecret,
      bodyLength: body.length
    });
    
    if (!webhookSecret) {
      logError('Missing webhook secret');
      return new Response('Missing webhook configuration', { status: 500 });
    }

    // Use our custom signature verification
    const isSignatureValid = await verifyStripeSignature(body, signature, webhookSecret);
    
    if (!isSignatureValid) {
      logError("Invalid signature");
      return new Response('Invalid signature', { status: 400 });
    }

    logStep("Signature verified successfully");

    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
      logStep("Event parsed", { type: event.type, id: event.id });
    } catch (parseError) {
      logError("Failed to parse event body", parseError.message);
      return new Response('Invalid JSON', { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Store webhook event for audit trail
    await storeWebhookEvent(supabaseClient, event.id, event.type, event.data);

    let processingSuccess = false;
    let errorMessage = '';

    try {
      // Set processing timeout to prevent hanging webhooks
      const PROCESSING_TIMEOUT = 25000; // 25 seconds (Supabase function timeout is 30s)
      
      const processingPromise = processWebhookEvent(event, supabaseClient);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Webhook processing timeout')), PROCESSING_TIMEOUT)
      );
      
      const result = await Promise.race([processingPromise, timeoutPromise]);
      processingSuccess = result.success;
      if (!result.success) {
        errorMessage = result.error;
      }

    } catch (processingError: any) {
      processingSuccess = false;
      errorMessage = processingError.message;
      logError("Processing failed", { error: errorMessage });
    }

    // Mark webhook as processed (success or failure)
    await markWebhookProcessed(supabaseClient, event.id, processingSuccess, errorMessage);

    if (!processingSuccess) {
      return new Response(`Webhook processing failed: ${errorMessage}`, { status: 500 });
    }

    return new Response(JSON.stringify({ 
      received: true, 
      processed: processingSuccess,
      event_id: event.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logError("Webhook error", { 
      message: error.message, 
      stack: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    });
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});