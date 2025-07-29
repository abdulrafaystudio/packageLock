
import { logStep } from '../utils/logging.ts';
import { processCheckoutSessionCompleted } from './checkout-processor.ts';
import { processSubscriptionEvent } from './subscription-processor.ts';
import { processInvoiceEvent } from './invoice-processor.ts';

// Enhanced webhook event processing with retry mechanism
export const processWebhookEvent = async (event: any, supabaseClient: any): Promise<{ success: boolean; error?: string }> => {
  try {
    logStep("Starting webhook event processing", { eventType: event.type, eventId: event.id });

    let processingResult = { success: false, error: '' };

    // Handle successful checkout completion
    if (event.type === 'checkout.session.completed') {
      processingResult = await processCheckoutSessionCompleted(event, supabaseClient);
    }

    // Handle subscription updates and changes
    else if (event.type === 'customer.subscription.updated' || 
             event.type === 'customer.subscription.deleted' ||
             event.type === 'customer.subscription.created') {
      processingResult = await processSubscriptionEvent(event, supabaseClient);
    }

    // Handle invoice events (for autorenewal)
    else if (event.type === 'invoice.payment_succeeded' || 
             event.type === 'invoice.payment_failed') {
      processingResult = await processInvoiceEvent(event, supabaseClient);
    }

    // Handle other event types
    else {
      logStep("Unhandled event type", { type: event.type });
      return { success: true }; // Not an error, just not handled
    }

    // If processing failed, add to retry queue
    if (!processingResult.success) {
      logStep("Adding failed webhook to retry queue", { 
        eventId: event.id, 
        error: processingResult.error 
      });
      
      await supabaseClient.from('webhook_retry_queue').insert({
        webhook_event_id: event.id,
        event_type: event.type,
        event_data: event,
        last_error: processingResult.error,
        status: 'pending'
      });
    }

    return processingResult;

  } catch (error: any) {
    logStep("Webhook event processing failed", { 
      error: error.message,
      eventType: event.type,
      eventId: event.id
    });

    // Add to retry queue on exception
    try {
      await supabaseClient.from('webhook_retry_queue').insert({
        webhook_event_id: event.id,
        event_type: event.type,
        event_data: event,
        last_error: error.message,
        status: 'pending'
      });
    } catch (retryQueueError) {
      logStep("Failed to add to retry queue", { error: retryQueueError.message });
    }

    return { success: false, error: error.message };
  }
};
