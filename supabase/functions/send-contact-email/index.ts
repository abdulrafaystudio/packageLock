
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { ContactEmailRequest } from './types.ts';
import { validateAuthentication } from './auth.ts';
import { validateRequest, getValidEmailContacts } from './validation.ts';
import { sendEmailsToContacts } from './email-sender.ts';
import { createCorsResponse, createErrorResponse, createSuccessResponse } from './response-helpers.ts';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return createCorsResponse();
  }

  try {
    console.log("=== SEND CONTACT EMAIL FUNCTION START ===");
    
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!validateAuthentication(authHeader)) {
      return createErrorResponse(401, "Authentication required");
    }

    const requestData: ContactEmailRequest = await req.json();

    console.log("Processing contact email request:");
    console.log("- Investor/Company:", requestData.investorName);
    console.log("- Sender:", requestData.senderName);
    console.log("- Sender Email:", requestData.senderEmail);
    console.log("- Number of contacts:", requestData.contacts.length);

    // Validate request data
    const validation = validateRequest(requestData);
    if (!validation.isValid) {
      console.error("Validation failed:", validation.error);
      return createErrorResponse(400, validation.error!);
    }

    // Filter contacts that have valid email addresses
    const emailContacts = getValidEmailContacts(requestData.contacts);
    
    if (emailContacts.length === 0) {
      console.error("No valid email contacts found");
      return createErrorResponse(400, "No valid email contacts found");
    }

    console.log("Valid email contacts:", emailContacts.length);

    // Send emails to all valid contacts
    const results = await sendEmailsToContacts(emailContacts, requestData);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Email sending complete. Success: ${successful.length}, Failed: ${failed.length}`);
    console.log("=== SEND CONTACT EMAIL FUNCTION SUCCESS ===");

    if (failed.length > 0) {
      console.warn("Some emails failed to send:", failed);
    }

    return createSuccessResponse({
      success: true,
      message: `Message sent successfully to ${successful.length} contact${successful.length !== 1 ? 's' : ''}`,
      details: {
        successful: successful.length,
        failed: failed.length,
        results: results,
      },
    });
  } catch (error: any) {
    console.error("=== SEND CONTACT EMAIL FUNCTION ERROR ===");
    console.error("Error in send-contact-email function:", error);
    console.error("Error stack:", error.stack);
    
    return createErrorResponse(
      500,
      "Internal server error",
      "Failed to process contact request. Please try again."
    );
  }
};

serve(handler);
