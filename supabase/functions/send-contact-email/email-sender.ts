
import { Resend } from "npm:resend@2.0.0";
import { ContactEmailRequest, EmailResult } from './types.ts';
import { generateEmailContent } from './email-templates.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

export const sendEmailToContact = async (
  contact: { email: string; name?: string },
  emailData: ContactEmailRequest,
  index: number,
  total: number
): Promise<EmailResult> => {
  try {
    console.log(`Sending email ${index + 1}/${total} to: ${contact.email}`);
    
    const { subject, html } = generateEmailContent({
      investorName: emailData.investorName,
      senderName: emailData.senderName,
      senderEmail: emailData.senderEmail,
      senderPhone: emailData.senderPhone,
      message: emailData.message,
    });

    const emailResponse = await resend.emails.send({
      from: "EasyFund <noreply@easyfund.me>",
      to: [contact.email],
      subject,
      html,
      replyTo: emailData.senderEmail,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'EasyFund Platform',
      },
    });
    
    console.log(`Email sent successfully to ${contact.email}:`, emailResponse.id);
    return { 
      success: true, 
      contact: contact.email, 
      emailId: emailResponse.id,
      response: emailResponse 
    };
  } catch (error) {
    console.error(`Failed to send email to ${contact.email}:`, error);
    return { 
      success: false, 
      contact: contact.email, 
      error: error.message 
    };
  }
};

export const sendEmailsToContacts = async (
  contacts: Array<{ email: string; name?: string }>,
  emailData: ContactEmailRequest
): Promise<EmailResult[]> => {
  const emailPromises = contacts.map((contact, index) =>
    sendEmailToContact(contact, emailData, index, contacts.length)
  );

  return await Promise.all(emailPromises);
};
