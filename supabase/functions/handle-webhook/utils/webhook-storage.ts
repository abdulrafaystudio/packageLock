import { logStep, logError } from './logging.ts';

export const storeWebhookEvent = async (supabaseClient: any, eventId: string, eventType: string, eventData: any) => {
  try {
    const { error } = await supabaseClient
      .from('webhook_events')
      .insert({
        stripe_event_id: eventId,
        event_type: eventType,
        event_data: eventData,
        processed: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      logError("Failed to store webhook event", { eventId, error });
      return false;
    }
    
    logStep("Webhook event stored", { eventId, eventType });
    return true;
  } catch (error) {
    logError("Exception storing webhook event", { eventId, error: error.message });
    return false;
  }
};

export const markWebhookProcessed = async (supabaseClient: any, eventId: string, success: boolean, errorMessage?: string) => {
  try {
    const updateData: any = {
      processed: success,
      processed_at: new Date().toISOString()
    };

    if (!success && errorMessage) {
      updateData.error_message = errorMessage;
      const { data } = await supabaseClient
        .from('webhook_events')
        .select('retry_count')
        .eq('stripe_event_id', eventId)
        .single();
      
      updateData.retry_count = (data?.retry_count || 0) + 1;
    }

    await supabaseClient
      .from('webhook_events')
      .update(updateData)
      .eq('stripe_event_id', eventId);

    logStep(success ? "Webhook marked as processed" : "Webhook marked as failed", { eventId, errorMessage });
  } catch (error) {
    logError("Failed to update webhook status", { eventId, error: error.message });
  }
};