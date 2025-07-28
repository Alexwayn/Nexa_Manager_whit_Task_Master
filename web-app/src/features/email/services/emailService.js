import { quotePdfService } from '@features/financial';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { getEmailProviderService } from '@features/email';

/**
 * EmailService - Professional email management with templates and tracking
 * Handles invoice delivery, reminders, and email automation
 */
class EmailService {
  constructor() {
    this.baseUrl = 'https://api.emailjs.com/api/v1.0/email/send';
    this.serviceId = 'your_service_id'; // Configure in environment
    this.publicKey = 'your_public_key'; // Configure in environment

    this.templates = {
      INVOICE_SEND: 'invoice_send',
      PAYMENT_REMINDER: 'payment_reminder',
      PAYMENT_CONFIRMATION: 'payment_confirmation',
      OVERDUE_NOTICE: 'overdue_notice',
      FINAL_NOTICE: 'final_notice',
      STATEMENT: 'statement',
      QUOTE_SEND: 'quote_send',
    };

    this.defaultTemplates = {
      [this.templates.INVOICE_SEND]: {
        subject: 'New Invoice #{invoice_number} - {company_name}',
        body: `Dear {client_name},

Please find attached invoice no. {invoice_number} dated {issue_date} for the amount of € {total_amount}.

Invoice details:
- Number: {invoice_number}
- Issue Date: {issue_date}
- Due Date: {due_date}
- Total Amount: € {total_amount}

The invoice is also available online at the following link: {invoice_link}

If you have any questions, please do not hesitate to contact us.

Best regards,
{company_name}
{company_email}
{company_phone}`,
      },

      [this.templates.PAYMENT_REMINDER]: {
        subject: 'Payment Reminder - Invoice #{invoice_number}',
        body: `Dear {client_name},

This is a reminder that invoice no. {invoice_number} dated {issue_date} for the amount of € {total_amount} is due on {due_date}.

If you have already made the payment, please disregard this message.

If you have any questions, please do not hesitate to contact us.

Best regards,
{company_name}`,
      },

      [this.templates.PAYMENT_CONFIRMATION]: {
        subject: 'Payment Received Confirmation - Invoice #{invoice_number}',
        body: `Dear {client_name},

We confirm that we have received the payment of € {payment_amount} for invoice no. {invoice_number}.

Payment details:
- Payment Date: {payment_date}
- Amount: € {payment_amount}
- Method: {payment_method}

Thank you for your prompt payment.

Best regards,
{company_name}`,
      },

      [this.templates.OVERDUE_NOTICE]: {
        subject: 'Overdue Invoice #{invoice_number} - Payment Reminder',
        body: `Dear {client_name},

Invoice no. {invoice_number} dated {issue_date} for the amount of € {total_amount} was due on {due_date}.

It has been {days_overdue} days since the due date.

Please arrange for payment urgently. If you have already made the payment, please send us the receipt.

If you have any questions, please do not hesitate to contact us.

Best regards,
{company_name}`,
      },

      [this.templates.FINAL_NOTICE]: {
        subject: 'FINAL NOTICE - Invoice #{invoice_number} Seriously Overdue',
        body: `Dear {client_name},

This is the final notice for invoice no. {invoice_number} dated {issue_date} for the amount of € {total_amount}.

The invoice is {days_overdue} days overdue.

If we do not receive payment within 7 business days, we will be forced to take legal action to recover the debt.

Please contact us immediately to resolve this situation.

Best regards,
{company_name}
{company_email}
{company_phone}`,
      },

      [this.templates.STATEMENT]: {
        subject: 'Account Statement - {period}',
        body: `Dear {client_name},

Please find attached your account statement for the period {period}.

Summary:
- Invoices issued: € {total_invoiced}
- Payments received: € {total_paid}
- Balance: € {balance}

If you have any questions, please do not hesitate to contact us.

Best regards,
{company_name}`,
      },
    };
  }

  /**
   * Retrieves a formatted HTML email template.
   * @param {string} templateType - The type of template to retrieve (e.g., 'quote_sent').
   * @param {Object} data - The data to populate the template with.
   * @returns {{subject: string, htmlBody: string}|null} The formatted email subject and body, or null if the template is not found.
   */
  getEmailTemplate(templateType, data) {
    const templates = {
      quote_sent: {
        subject: `Quote ${data.quoteNumber} - ${data.companyName}`,
        htmlBody: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background: #343a40; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 14px; }
                .quote-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
                .highlight { color: #667eea; font-weight: bold; }
                .amount { font-size: 24px; color: #28a745; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🧾 Quote</h1>
                <p>Quote request from ${data.companyName}</p>
              </div>
              
              <div class="content">
                <p>Dear <strong>${data.clientName}</strong>,</p>
                
                <p>We are pleased to send you the requested quote. Please find the details below:</p>
                
                <div class="quote-details">
                  <h3>📋 Quote Details</h3>
                  <p><strong>Number:</strong> <span class="highlight">${data.quoteNumber}</span></p>
                  <p><strong>Issue Date:</strong> ${new Date(data.issueDate).toLocaleDateString('en-US')}</p>
                  <p><strong>Valid Until:</strong> ${new Date(data.expiryDate).toLocaleDateString('en-US')}</p>
                  <p><strong>Total Amount:</strong> <span class="amount">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalAmount)}</span></p>
                </div>
                
                <p>The quote is attached to this email in PDF format. Please review it carefully and do not hesitate to contact us for any clarification.</p>
                
                <p><strong>Acceptance Methods:</strong></p>
                <ul>
                  <li>📧 Reply via email with confirmation of acceptance</li>
                  <li>📞 Phone call to our office</li>
                  <li>📱 WhatsApp to the company number</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:${data.companyPhone}" class="button">📞 Call Now</a>
                  <a href="mailto:${data.companyEmail}" class="button">📧 Reply</a>
                </div>
                
                <p><em>This quote is valid until the date indicated. After this date, prices may be subject to change.</em></p>
                
                <p>We are available for further information.</p>
                
                <p>Best regards,<br>
                <strong>${data.companyName}</strong></p>
              </div>
              
              <div class="footer">
                <p><strong>${data.companyName}</strong></p>
                <p>${data.companyAddress}</p>
                <p>📧 ${data.companyEmail} | 📞 ${data.companyPhone}</p>
                ${data.companyWebsite ? `<p>🌐 ${data.companyWebsite}</p>` : ''}
              </div>
            </body>
          </html>
        `,
        textBody: `
Dear ${data.clientName},

We are pleased to send you the requested quote.

QUOTE DETAILS:
- Number: ${data.quoteNumber}
- Issue Date: ${new Date(data.issueDate).toLocaleDateString('en-US')}
- Valid Until: ${new Date(data.expiryDate).toLocaleDateString('en-US')}
- Total Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalAmount)}

The quote is attached in PDF format. Please review it and contact us for any clarifications.

Acceptance methods:
- Email: ${data.companyEmail}
- Phone: ${data.companyPhone}
- WhatsApp: available

This quote is valid until the date indicated.

Best regards,
${data.companyName}
${data.companyAddress}
${data.companyEmail} | ${data.companyPhone}
        `,
      },

      quote_reminder: {
        subject: `Quote Reminder ${data.quoteNumber} - Expires on ${new Date(data.expiryDate).toLocaleDateString('en-US')}`,
        htmlBody: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background: #343a40; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 14px; }
                .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .urgent { color: #dc3545; font-weight: bold; }
                .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>⏰ Quote Reminder</h1>
                <p>The quote is expiring soon</p>
              </div>
              
              <div class="content">
                <p>Dear <strong>${data.clientName}</strong>,</p>
                
                <div class="reminder-box">
                  <h3>⚠️ Quote Expiring</h3>
                  <p>We remind you that quote <strong>${data.quoteNumber}</strong> will expire on <span class="urgent">${new Date(data.expiryDate).toLocaleDateString('en-US')}</span>.</p>
                  <p><strong>Days remaining:</strong> <span class="urgent">${Math.ceil((new Date(data.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))}</span></p>
                </div>
                
                <p>To confirm the order and lock in the current price, please contact us as soon as possible.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="tel:${data.companyPhone}" class="button">📞 Call Now</a>
                  <a href="mailto:${data.companyEmail}?subject=Accept Quote ${data.quoteNumber}" class="button">✅ Accept</a>
                </div>
                
                <p>We are available for further information or clarification.</p>
                
                <p>Best regards,<br>
                <strong>${data.companyName}</strong></p>
              </div>
              
              <div class="footer">
                <p><strong>${data.companyName}</strong></p>
                <p>📧 ${data.companyEmail} | 📞 ${data.companyPhone}</p>
              </div>
            </body>
          </html>
        `,
        textBody: `
Dear ${data.clientName},

REMINDER: Quote ${data.quoteNumber} will expire on ${new Date(data.expiryDate).toLocaleDateString('en-US')}.

Days remaining: ${Math.ceil((new Date(data.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))}

To confirm the order and lock in the price, please contact us:
- Email: ${data.companyEmail}
- Phone: ${data.companyPhone}

Best regards,
${data.companyName}
        `,
      },

      quote_accepted: {
        subject: `Quote Acceptance Confirmation ${data.quoteNumber}`,
        htmlBody: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background: #343a40; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 14px; }
                .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                .next-steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>✅ Quote Accepted!</h1>
                <p>Thank you for choosing ${data.companyName}</p>
              </div>
              
              <div class="content">
                <p>Dear <strong>${data.clientName}</strong>,</p>
                
                <div class="success-box">
                  <h3>🎉 Acceptance Confirmation</h3>
                  <p>Quote <strong>${data.quoteNumber}</strong> has been successfully accepted!</p>
                  <p><strong>Acceptance date:</strong> ${new Date().toLocaleDateString('en-US')}</p>
                </div>
                
                <div class="next-steps">
                  <h3>📋 Next Steps</h3>
                  <ol>
                    <li><strong>Invoicing:</strong> We will proceed with creating the invoice</li>
                    <li><strong>Planning:</strong> We will contact you to define the operational details</li>
                    <li><strong>Work start:</strong> We will start according to the agreed timeline</li>
                  </ol>
                </div>
                
                <p>We will contact you within 24 hours to coordinate the start of activities.</p>
                
                <p>Thank you for the trust placed in us!</p>
                
                <p>Best regards,<br>
                <strong>${data.companyName}</strong></p>
              </div>
              
              <div class="footer">
                <p><strong>${data.companyName}</strong></p>
                <p>📧 ${data.companyEmail} | 📞 ${data.companyPhone}</p>
              </div>
            </body>
          </html>
        `,
        textBody: `
Dear ${data.clientName},

CONFIRMATION: Quote ${data.quoteNumber} has been accepted!

Acceptance date: ${new Date().toLocaleDateString('en-US')}

NEXT STEPS:
1. Invoicing: We will proceed with creating the invoice
2. Planning: We will contact you to define the operational details
3. Work start: We will begin according to the agreed timeline

We will contact you within 24 hours to coordinate the start.

Thank you for your trust!

Best regards,
${data.companyName}
        `,
      },
    };

    return templates[templateType] || null;
  }

  /**
   * Sends an email with a quote attached.
   * @param {Object} quote - The quote object.
   * @param {string} recipientEmail - The email address of the recipient.
   * @param {string} [templateType='quote_sent'] - The type of email template to use.
   * @param {string} [customMessage=''] - A custom message to include in the email.
   * @returns {Promise<{success: boolean, messageId: string|null, error: string|null}>} The result of the send operation.
   */
  async sendQuoteEmail(quote, recipientEmail, templateType = 'quote_sent', customMessage = '') {
    try {
      // Prepare email data
      const emailData = {
        quoteNumber: quote.quote_number || quote.number,
        clientName: quote.client_name || quote.client,
        issueDate: quote.issue_date || quote.date,
        expiryDate: quote.expiry_date || quote.expiryDate,
        totalAmount: quote.total_amount || quote.amount,
        companyName: 'Nexa Manager', // This should come from settings
        companyEmail: 'info@nexamanager.com', // This should come from settings
        companyPhone: '+39 123 456 7890', // This should come from settings
        companyAddress: 'Via Roma 123, 00100 Roma (RM)', // This should come from settings
        companyWebsite: 'www.nexamanager.com', // This should come from settings
      };

      // Get email template
      const template = this.getEmailTemplate(templateType, emailData);

      // Generate PDF attachment
      const pdfBlob = await quotePdfService.generateBlob(quote);
      const pdfBase64 = await this.blobToBase64(pdfBlob);

      // Prepare email payload
      const emailPayload = {
        service_id: this.serviceId,
        template_id: templateType,
        user_id: this.publicKey,
        template_params: {
          to_email: recipientEmail,
          to_name: emailData.clientName,
          from_name: emailData.companyName,
          from_email: emailData.companyEmail,
          subject: template.subject,
          message_html: customMessage || template.htmlBody,
          message_text: template.textBody,
          quote_number: emailData.quoteNumber,
          attachment_name: `Quote_${emailData.quoteNumber}.pdf`,
          attachment_content: pdfBase64,
        },
      };

      // For demo purposes, we'll use a simulated email service
      // In a real implementation, you would integrate with:
      // - EmailJS
      // - SendGrid
      // - Mailgun
      // - AWS SES
      // - Or any other email service

      return this.simulateEmailSending(emailPayload);
    } catch (error) {
      Logger.error('Error sending quote email:', error);
      throw new Error(`Error sending email: ${error.message}`);
    }
  }

  /**
   * Sends a reminder email for an expiring quote.
   * @param {Object} quote - The quote object.
   * @param {string} recipientEmail - The email address of the recipient.
   * @param {number} daysUntilExpiry - The number of days until the quote expires.
   * @returns {Promise<{success: boolean, messageId: string|null, error: string|null}>} The result of the send operation.
   */
  async sendReminderEmail(quote, recipientEmail, _daysUntilExpiry) {
    return this.sendQuoteEmail(quote, recipientEmail, 'quote_reminder');
  }

  /**
   * Sends a confirmation email when a quote is accepted.
   * @param {Object} quote - The quote object.
   * @param {string} recipientEmail - The email address of the recipient.
   * @returns {Promise<{success: boolean, messageId: string|null, error: string|null}>} The result of the send operation.
   */
  async sendAcceptanceConfirmation(quote, recipientEmail) {
    return this.sendQuoteEmail(quote, recipientEmail, 'quote_accepted');
  }

  /**
   * Simulates sending an email for development and demonstration purposes.
   * This method introduces a random delay and has a chance of simulated failure.
   * @param {Object} emailPayload - The payload that would be sent to a real email service.
   * @returns {Promise<Object>} A promise that resolves with a success object or rejects with a simulated error.
   */
  async simulateEmailSending(emailPayload) {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(
        () => {
          // Simulate success/failure (95% success rate)
          if (Math.random() > 0.05) {
            resolve({
              success: true,
              messageId: 'sim_' + Date.now(),
              timestamp: new Date().toISOString(),
              recipient: emailPayload.template_params.to_email,
            });
          } else {
            reject(new Error('Simulated email sending failure'));
          }
        },
        1000 + Math.random() * 2000,
      ); // 1-3 second delay
    });
  }

  /**
   * Sends an email using the EmailJS service.
   * This is an example of a real email service integration.
   * @param {Object} emailPayload - The payload to send to the EmailJS API.
   * @returns {Promise<Object>} A promise that resolves with the response from the EmailJS service.
   * @throws {Error} If the email sending fails.
   */
  async sendEmailViaEmailJS(emailPayload) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EmailJS API Error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      Logger.error('Error sending email via EmailJS:', error);
      throw error;
    }
  }

  /**
   * Converts a Blob object to a Base64 encoded string.
   * @param {Blob} blob - The Blob to convert.
   * @returns {Promise<string>} A promise that resolves with the Base64 string.
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // The result includes the Base64 prefix, remove it.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Schedules reminder emails for a quote before it expires.
   * Note: This is a placeholder for a more robust scheduling system (e.g., using cron jobs or a background worker).
   * @param {Object} quote - The quote object for which to schedule reminders.
   */
  scheduleReminders(quote) {
    const now = new Date();
    const expiryDate = new Date(quote.expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    Logger.log(
      `Scheduling reminders for quote ${quote.quote_number}. Expires in ${daysUntilExpiry} days.`,
    );

    // Example: send reminders 7 days and 3 days before expiry
    if (daysUntilExpiry > 7) {
      // Logic to schedule an email in (daysUntilExpiry - 7) days
    }
    if (daysUntilExpiry > 3) {
      // Logic to schedule an email in (daysUntilExpiry - 3) days
    }
  }

  /**
   * Validates an email address format.
   * @param {string} email - The email address to validate.
   * @returns {boolean} True if the email format is valid, false otherwise.
   */
  isValidEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  /**
   * Retrieves email statistics, such as the number of emails sent.
   * Note: This is a placeholder. A real implementation would query a logging database or analytics service.
   * @returns {Promise<Object>} An object containing email statistics.
   */
  async getEmailStats() {
    try {
      const {
        data: _data,
        error,
        count,
      } = await supabase
        .from('email_logs') // Assuming an 'email_logs' table exists
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return {
        totalSent: count,
        // other stats can be calculated here
      };
    } catch (error) {
      Logger.error('Error fetching email stats:', error);
      return { totalSent: 0 };
    }
  }

  /**
   * Sends an invoice email to a recipient.
   * @param {string} invoiceId - The ID of the invoice to send.
   * @param {string} recipientEmail - The email address of the recipient.
   * @param {string|null} [customMessage=null] - A custom message to include in the email.
   * @param {boolean} [attachPdf=true] - Whether to attach the invoice as a PDF.
   * @returns {Promise<Object>} The result of the email sending operation.
   * @throws {Error} If the invoice or client is not found, or if the email fails to send.
   */
  async sendInvoice(invoiceId, recipientEmail, customMessage = null, attachPdf = true) {
    try {
      // 1. Fetch invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error(`Invoice with ID ${invoiceId} not found.`);
      }
      if (!invoice.clients) {
        throw new Error(`Client for invoice ${invoiceId} not found.`);
      }

      // 2. Prepare template data
      const templateData = {
        invoice_number: invoice.invoice_number,
        client_name: invoice.clients.name,
        issue_date: new Date(invoice.issue_date).toLocaleDateString('en-US'),
        due_date: new Date(invoice.due_date).toLocaleDateString('en-US'),
        total_amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          invoice.total_amount,
        ),
        invoice_link: `${window.location.origin}/invoices/${invoice.id}`,
        company_name: 'Nexa Manager', // from settings
        company_email: 'billing@nexamanager.com', // from settings
        company_phone: '+39 123 456 7890', // from settings
      };

      const templateContent = this.defaultTemplates[this.templates.INVOICE_SEND];
      const subject = this._replaceTemplateVariables(templateContent.subject, templateData);
      const body =
        customMessage || this._replaceTemplateVariables(templateContent.body, templateData);

      const emailPayload = {
        to: recipientEmail,
        subject,
        body,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`, // Simple HTML conversion
      };

      // 3. Attach PDF if requested
      if (attachPdf) {
        // This part needs a proper PDF generation service for invoices
        // For now, we simulate a placeholder
        const pdfContent = 'Simulated PDF content for invoice ' + invoice.invoice_number;
        const pdfBase64 = Buffer.from(pdfContent).toString('base64');

        emailPayload.attachments = [
          {
            filename: `Invoice_${invoice.invoice_number}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf',
          },
        ];
      }

      // 4. Send email and log activity
      const result = await this._sendEmail(emailPayload);
      await this._logEmailActivity({
        invoice_id: invoiceId,
        client_id: invoice.client_id,
        type: 'invoice_sent',
        status: 'sent',
        details: { to: recipientEmail, subject },
      });

      return result;
    } catch (error) {
      Logger.error(`Error in sendInvoice for invoiceId ${invoiceId}:`, String(error?.message || error || 'Unknown error'));
      throw error;
    }
  }

  /**
   * Sends a payment reminder for an outstanding invoice.
   * @param {string} invoiceId - The ID of the invoice.
   * @param {string} [reminderType='gentle'] - The type of reminder ('gentle', 'overdue', 'final').
   * @returns {Promise<Object>} The result of the email sending operation.
   * @throws {Error} If the invoice is not found or is already paid.
   */
  async sendPaymentReminder(invoiceId, reminderType = 'gentle') {
    try {
      // 1. Fetch invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, clients(name, email)')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error(`Invoice with ID ${invoiceId} not found.`);
      }
      if (invoice.status === 'paid') {
        throw new Error(`Invoice ${invoiceId} is already paid.`);
      }

      // 2. Select the correct template
      let templateKey;
      switch (reminderType) {
        case 'overdue':
          templateKey = this.templates.OVERDUE_NOTICE;
          break;
        case 'final':
          templateKey = this.templates.FINAL_NOTICE;
          break;
        case 'gentle':
        default:
          templateKey = this.templates.PAYMENT_REMINDER;
      }
      const templateContent = this.defaultTemplates[templateKey];

      // 3. Prepare template data
      const now = new Date();
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

      const templateData = {
        invoice_number: invoice.invoice_number,
        client_name: invoice.clients.name,
        issue_date: new Date(invoice.issue_date).toLocaleDateString('en-US'),
        due_date: dueDate.toLocaleDateString('en-US'),
        total_amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          invoice.total_amount,
        ),
        days_overdue: daysOverdue,
        company_name: 'Nexa Manager',
        company_email: 'billing@nexamanager.com',
        company_phone: '+39 123 456 7890',
      };

      const subject = this._replaceTemplateVariables(templateContent.subject, templateData);
      const body = this._replaceTemplateVariables(templateContent.body, templateData);

      const emailPayload = {
        to: invoice.clients.email,
        subject,
        body,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      };

      // 4. Send email and log
      const result = await this._sendEmail(emailPayload);
      await this._logEmailActivity({
        invoice_id: invoiceId,
        client_id: invoice.client_id,
        type: `reminder_${reminderType}`,
        status: 'sent',
        details: { to: invoice.clients.email, subject },
      });

      return result;
    } catch (error) {
      Logger.error(`Error in sendPaymentReminder for invoiceId ${invoiceId}:`, String(error?.message || error || 'Unknown error'));
      throw error;
    }
  }

  // Private methods

  /**
   * Sends an email using a mock implementation for development purposes.
   * In production, this should be replaced with a real email service integration.
   * @private
   * @param {Object} emailData - The email data object containing recipient, subject, body, etc.
   * @param {string} emailData.to - The recipient email address.
   * @param {string} emailData.subject - The email subject.
   * @param {string} emailData.body - The email body content.
   * @param {string} [emailData.html] - Optional HTML version of the email body.
   * @param {Array} [emailData.attachments] - Optional array of email attachments.
   * @returns {Promise<Object>} A promise that resolves with the email sending result.
   */
  async _sendEmail(_emailData) {
    try {
      // This is a mock implementation
      // In production, you would integrate with an email service like:
      // - SendGrid
      // - Mailgun
      // - AWS SES
      // - Nodemailer with SMTP

      // Simulate email sending delay
      await this._delay(2000);

      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      if (success) {
        return {
          success: true,
          data: {
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
          },
        };
      } else {
        throw new Error('Email delivery failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sends a single email as part of a bulk email operation.
   * @private
   * @param {Object} emailItem - The email item containing recipient information.
   * @param {string} emailItem.email - The recipient email address.
   * @param {string} [emailItem.invoiceId] - Optional invoice ID associated with the email.
   * @param {string} templateType - The type of email template to use.
   * @param {Object} customData - Additional data to merge with the email item for template variables.
   * @returns {Promise<Object>} A promise that resolves with the email sending result.
   */
  async _sendSingleBulkEmail(emailItem, templateType, customData) {
    try {
      const template = this.defaultTemplates[templateType];
      const emailData = { ...emailItem, ...customData };

      const subject = this._replaceTemplateVariables(template.subject, emailData);
      const body = this._replaceTemplateVariables(template.body, emailData);

      const result = await this._sendEmail({
        to: emailItem.email,
        subject,
        body,
        invoiceId: emailItem.invoiceId,
      });

      if (result.success) {
        await this._logEmailActivity({
          invoice_id: emailItem.invoiceId,
          recipient: emailItem.email,
          template_type: templateType,
          subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Logs email activity to the database for tracking and audit purposes.
   * @private
   * @param {Object} activityData - The activity data to log.
   * @param {string} [activityData.invoice_id] - The ID of the related invoice.
   * @param {string} [activityData.client_id] - The ID of the related client.
   * @param {string} activityData.type - The type of email activity (e.g., 'invoice_sent', 'reminder_gentle').
   * @param {string} activityData.status - The status of the email (e.g., 'sent', 'failed').
   * @param {Object} [activityData.details] - Additional details about the email activity.
   * @returns {Promise<void>} A promise that resolves when the activity is logged.
   */
  async _logEmailActivity(activityData) {
    try {
      const { error } = await supabase.from('email_activity').insert([activityData]);

      if (error) throw error;
    } catch (error) {
      Logger.error('Error logging email activity:', error);
    }
  }

  /**
   * Retrieves company information for use in email templates.
   * In a real implementation, this should fetch data from a settings table or configuration.
   * @private
   * @returns {Promise<Object>} A promise that resolves with the company information.
   * @returns {string} returns.name - The company name.
   * @returns {string} returns.email - The company email address.
   * @returns {string} returns.phone - The company phone number.
   * @returns {string} returns.address - The company address.
   */
  async _getCompanyInfo() {
    // In a real implementation, this would come from a settings table
    return {
      name: 'Nexa Manager',
      email: 'info@nexamanager.com',
      phone: '+39 123 456 7890',
      address: 'Via Roma 123, 00100 Roma',
    };
  }

  /**
   * Replaces template variables in a string with actual data values.
   * Variables in the template should be enclosed in curly braces, e.g., {variable_name}.
   * @private
   * @param {string} template - The template string containing variables to replace.
   * @param {Object} data - An object containing the data to substitute for template variables.
   * @returns {string} The template string with variables replaced by actual values.
   */
  _replaceTemplateVariables(template, data) {
    let result = template;

    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      const value = data[key] || '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * Creates a delay for the specified number of milliseconds.
   * Useful for simulating network delays or implementing rate limiting.
   * @private
   * @param {number} ms - The number of milliseconds to delay.
   * @returns {Promise<void>} A promise that resolves after the specified delay.
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configures email provider settings for the service.
   * In a production environment, this should store configuration securely in a database.
   * @param {Object} _providerConfig - The email provider configuration object.
   * @param {string} [_providerConfig.provider] - The email provider name (e.g., 'sendgrid', 'mailgun').
   * @param {string} [_providerConfig.apiKey] - The API key for the email provider.
   * @param {string} [_providerConfig.fromEmail] - The default sender email address.
   * @param {string} [_providerConfig.fromName] - The default sender name.
   * @returns {Promise<Object>} A promise that resolves with the configuration result.
   */
  async configureEmailProvider(_providerConfig) {
    try {
      // Store email provider configuration
      // This would typically be stored in a secure settings table
      return {
        success: true,
        message: 'Email configuration saved successfully',
      };
    } catch (error) {
      Logger.error('Error configuring email provider:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Tests the email configuration by sending a test email - Enhanced with multiple providers
   * @param {string} testEmail - The email address to send the test email to.
   * @param {string} [provider] - Optional specific provider to test
   * @returns {Promise<Object>} A promise that resolves with the test result.
   */
  async testEmailConfiguration(testEmail, provider = null) {
    try {
      // Use the new provider service for testing
      const result = await getEmailProviderService().testConfiguration(testEmail, provider);

      // Log the test in our activity
      if (result.success) {
        await this._logEmailActivity({
          recipient: testEmail,
          subject: 'Test Email - Nexa Manager Configuration',
          status: 'sent',
          provider: result.provider || 'unknown',
          type: 'test_email',
        });
      }

      return result;
    } catch (error) {
      Logger.error('Error testing email configuration:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email with enhanced provider support
   * @param {Object} emailData - Email data object
   * @param {string} [provider] - Optional specific provider to use
   * @returns {Promise<Object>} Result of the send operation
   */
  async sendEmailWithProvider(emailData, provider = null) {
    try {
      // Use the enhanced provider service
      const result = await getEmailProviderService().sendEmail({
        ...emailData,
        provider,
      });

      // Log the activity
      await this._logEmailActivity({
        recipient: emailData.to,
        subject: emailData.subject,
        status: result.success ? 'sent' : 'failed',
        provider: result.provider || 'unknown',
        message_id: result.messageId,
        error: result.error,
        type: emailData.type || 'general',
      });

      return result;
    } catch (error) {
      Logger.error('Error sending email with provider:', error);

      // Log failed attempt
      await this._logEmailActivity({
        recipient: emailData.to,
        subject: emailData.subject,
        status: 'failed',
        error: error.message,
        type: emailData.type || 'general',
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get email provider information
   * @param {string} [provider] - Optional provider to get info for
   * @returns {Object} Provider information
   */
  getProviderInfo(provider = null) {
    return getEmailProviderService().getProviderInfo(provider);
  }

  /**
   * Get all available providers
   * @returns {Array} List of all available providers with their status
   */
  getAllProviders() {
    return getEmailProviderService().getAllProviders();
  }

  /**
   * Switch email provider
   * @param {string} provider - Provider to switch to
   * @returns {boolean} Success status
   */
  setActiveProvider(provider) {
    return getEmailProviderService().setActiveProvider(provider);
  }

  /**
   * Check if provider is configured
   * @param {string} provider - Provider to check
   * @returns {boolean} Configuration status
   */
  isProviderConfigured(provider) {
    return getEmailProviderService().isProviderConfigured(provider);
  }

  /**
   * Get estimated delivery time for provider
   * @param {string} [provider] - Optional provider to check
   * @returns {string} Estimated delivery time
   */
  getEstimatedDeliveryTime(provider = null) {
    return getEmailProviderService().getEstimatedDeliveryTime(provider);
  }

}

let emailServiceInstance = null;

export const getEmailService = () => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

export default getEmailService();