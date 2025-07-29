
export const generateEmailContent = (data: {
  investorName: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
}) => {
  const { investorName, senderName, senderEmail, senderPhone, message } = data;

  const subject = `New Contact Request from ${senderName} - ${investorName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 0 20px; }
        .footer { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; font-size: 14px; color: #666; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #555; }
        .message-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin: 0; color: #333;">New Contact Request</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Regarding: <strong>${investorName}</strong></p>
      </div>
      
      <div class="content">
        <div class="field">
          <span class="label">From:</span> ${senderName}
        </div>
        <div class="field">
          <span class="label">Email:</span> <a href="mailto:${senderEmail}">${senderEmail}</a>
        </div>
        ${senderPhone ? `<div class="field"><span class="label">Phone:</span> <a href="tel:${senderPhone}">${senderPhone}</a></div>` : ''}
        
        <div class="message-box">
          <div class="label">Message:</div>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      
      <div class="footer">
        <p><em>This message was sent through the EasyFund platform contact form.</em></p>
        <p><strong>To reply:</strong> Simply reply directly to ${senderName} at ${senderEmail}</p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};
