
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportTicketRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const generateTicketNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `SUP-${dateStr}-${randomNum}`;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { name, email, subject, message }: SupportTicketRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate unique ticket number
    const ticketNumber = generateTicketNumber();

    // Insert support ticket into database
    const { data: ticket, error: dbError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        name,
        email,
        subject,
        message,
        status: 'open'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: "Failed to create support ticket" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "EasyFund Support <noreply@easyfund.me>",
      to: [email],
      subject: `Support Ticket Created: ${ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Support Ticket Confirmation</h2>
          <p>Dear ${name},</p>
          <p>Thank you for contacting EasyFund support. We have received your message and created a support ticket for you.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #495057;">Ticket Details:</h3>
            <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Status:</strong> Open</p>
          </div>
          
          <p>Our support team will review your request and respond within 24-48 hours. Please keep your ticket number for reference.</p>
          
          <p>If you need to follow up on this ticket, please reply to this email with your ticket number.</p>
          
          <p>Best regards,<br>
          The EasyFund Support Team</p>
          
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      `,
    });

    // Send notification email to admin (using a default admin email for now)
    const adminEmailResponse = await resend.emails.send({
      from: "EasyFund Support <noreply@easyfund.me>",
      to: ["support@easyfund.me"], // You can change this to your actual support email
      subject: `New Support Ticket: ${ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Support Ticket Received</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #495057;">Ticket Information:</h3>
            <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Status:</strong> Open</p>
            <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #fff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #495057;">Message:</h4>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="margin-top: 20px;">
            Please respond to this ticket within 24-48 hours.
          </p>
        </div>
      `,
    });

    console.log('User email sent:', userEmailResponse);
    console.log('Admin email sent:', adminEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Support ticket created successfully",
        ticketNumber: ticketNumber,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
