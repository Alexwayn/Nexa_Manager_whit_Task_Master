import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { getEnvVar } from '@/utils/env';

/**
 * EmailTemplateService - Manages email templates with WYSIWYG editing and variables
 */
class EmailTemplateService {
  constructor() {
    this.defaultVariables = [
      'client_name',
      'company_name',
      'company_email',
      'company_phone',
      'invoice_number',
      'invoice_date',
      'due_date',
      'total_amount',
      'payment_amount',
      'payment_date',
      'payment_method',
      'days_overdue',
      'quote_number',
      'issue_date',
      'expiry_date',
    ];

    // Email-safe CSS for maximum compatibility
    this.emailSafeCSS = {
      container:
        'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;',
      header: 'background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center;',
      content: 'padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0;',
      footer:
        'background-color: #1f2937; color: #ffffff; padding: 15px; text-align: center; font-size: 12px;',
      button:
        'display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 10px 0;',
      table: 'width: 100%; border-collapse: collapse; margin: 20px 0;',
      tableCell: 'padding: 12px; border: 1px solid #e2e8f0; text-align: left;',
      highlight: 'background-color: #fef3c7; padding: 2px 4px; border-radius: 2px;',
    };

    this.predefinedTemplates = {
      professional: {
        name: 'Professional',
        description: 'Clean and professional template for business communications',
        html: this.generateProfessionalTemplate(),
        variables: ['client_name', 'company_name', 'content', 'company_email'],
      },
      invoice: {
        name: 'Invoice Template',
        description: 'Template for invoice delivery and payment notices',
        html: this.generateInvoiceTemplate(),
        variables: ['client_name', 'company_name', 'invoice_number', 'total_amount', 'due_date'],
      },
      reminder: {
        name: 'Payment Reminder',
        description: 'Friendly reminder template for overdue payments',
        html: this.generateReminderTemplate(),
        variables: ['client_name', 'invoice_number', 'days_overdue', 'total_amount'],
      },
      newsletter: {
        name: 'Newsletter',
        description: 'Modern newsletter template for marketing campaigns',
        html: this.generateNewsletterTemplate(),
        variables: ['subscriber_name', 'company_name', 'unsubscribe_link'],
      },
    };
  }

  /**
   * Get all email templates for the current user/organization
   */
  async getTemplates(organizationId = null) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .or(`user_id.eq.${supabase.auth.user()?.id},is_system.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        predefined: this.predefinedTemplates,
      };
    } catch (error) {
      Logger.error('Error fetching email templates:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        predefined: this.predefinedTemplates,
      };
    }
  }

  /**
   * Save or update an email template
   */
  async saveTemplate(templateData) {
    try {
      const currentUser = supabase.auth.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const template = {
        name: templateData.name,
        description: templateData.description || '',
        subject: templateData.subject || '',
        content_html: this.optimizeForEmail(templateData.htmlContent),
        content_text: this.htmlToText(templateData.htmlContent),
        variables: templateData.variables || [],
        category: templateData.category || 'custom',
        user_id: currentUser.id,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (templateData.id) {
        // Update existing template
        result = await supabase
          .from('email_templates')
          .update(template)
          .eq('id', templateData.id)
          .eq('user_id', currentUser.id) // Ensure user can only update their own templates
          .select()
          .single();
      } else {
        // Create new template
        template.created_at = new Date().toISOString();
        result = await supabase.from('email_templates').insert(template).select().single();
      }

      if (result.error) throw result.error;

      return {
        success: true,
        data: result.data,
        message: templateData.id
          ? 'Template updated successfully'
          : 'Template created successfully',
      };
    } catch (error) {
      Logger.error('Error saving email template:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(templateId) {
    try {
      const currentUser = supabase.auth.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', currentUser.id) // Ensure user can only delete their own templates
        .eq('is_system', false); // Prevent deletion of system templates

      if (error) throw error;

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      Logger.error('Error deleting email template:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template, variables = {}) {
    try {
      let subject = template.subject || '';
      let htmlContent = template.content_html || template.html_content || template.html || '';
      let textContent = template.content_text || template.text_content || '';

      // Replace variables in subject
      subject = this.replaceVariables(subject, variables);

      // Replace variables in HTML content
      htmlContent = this.replaceVariables(htmlContent, variables);

      // Replace variables in text content
      textContent = this.replaceVariables(textContent, variables);

      // If no text content, generate from HTML
      if (!textContent && htmlContent) {
        textContent = this.htmlToText(htmlContent);
      }

      return {
        success: true,
        data: {
          subject,
          htmlContent,
          textContent,
        },
      };
    } catch (error) {
      Logger.error('Error rendering template:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Replace template variables with actual values
   */
  replaceVariables(content, variables) {
    let result = content;

    // Replace {variable_name} patterns
    Object.keys(variables).forEach(key => {
      const pattern = new RegExp(`{${key}}`, 'g');
      result = result.replace(pattern, variables[key] || '');
    });

    // Replace {{variable_name}} patterns (double braces)
    Object.keys(variables).forEach(key => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(pattern, variables[key] || '');
    });

    return result;
  }

  /**
   * Optimize HTML for email clients
   */
  optimizeForEmail(html) {
    let optimized = html;

    // Convert CSS classes to inline styles where possible
    optimized = this.inlineBasicStyles(optimized);

    // Ensure absolute URLs for images
    optimized = this.convertToAbsoluteUrls(optimized);

    // Add email-safe DOCTYPE if not present
    if (!optimized.includes('<!DOCTYPE')) {
      optimized =
        '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' +
        optimized;
    }

    // Wrap in html and body tags if not present
    if (!optimized.includes('<html')) {
      optimized = `<html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin: 0; padding: 0;">
          ${optimized}
        </body>
      </html>`;
    }

    return optimized;
  }

  /**
   * Convert relative URLs to absolute URLs
   */
  convertToAbsoluteUrls(html) {
    // This would need to be configured with your actual domain
    const baseUrl = getEnvVar('VITE_BASE_URL') || 'https://your-domain.com';

    return html
      .replace(/src="\/([^"]+)"/g, `src="${baseUrl}/€1"`)
      .replace(/href="\/([^"]+)"/g, `href="${baseUrl}/€1"`);
  }

  /**
   * Apply basic inline styles for email compatibility
   */
  inlineBasicStyles(html) {
    // Simple inline styling for common elements
    let styled = html;

    // Style paragraphs
    styled = styled.replace(
      /<p(?![^>]*style)/g,
      '<p style="margin: 0 0 16px 0; line-height: 1.6;"',
    );

    // Style headings
    styled = styled.replace(
      /<h([1-6])(?![^>]*style)/g,
      '<h€1 style="margin: 0 0 16px 0; font-weight: bold;"',
    );

    // Style links
    styled = styled.replace(
      /<a(?![^>]*style)/g,
      '<a style="color: #2563eb; text-decoration: underline;"',
    );

    return styled;
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Validate template for email compatibility
   */
  validateTemplate(html) {
    const issues = [];

    // Check for unsupported CSS
    if (html.includes('flex') || html.includes('grid')) {
      issues.push('Flexbox and CSS Grid are not supported in many email clients');
    }

    // Check for external stylesheets
    if (html.includes('<link') && html.includes('stylesheet')) {
      issues.push('External stylesheets are not supported in email clients');
    }

    // Check for JavaScript
    if (html.includes('<script')) {
      issues.push('JavaScript is not supported in email clients');
    }

    // Check for embedded videos
    if (html.includes('<video') || html.includes('<iframe')) {
      issues.push('Videos and iframes are not supported in most email clients');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate professional template
   */
  generateProfessionalTemplate() {
    return `
      <div style="${this.emailSafeCSS.container}">
        <div style="${this.emailSafeCSS.header}">
          <h1 style="margin: 0; font-size: 24px;">{company_name}</h1>
        </div>
        <div style="${this.emailSafeCSS.content}">
          <p style="margin: 0 0 16px 0;">Dear {client_name},</p>
          
          <div style="margin: 20px 0;">
            {content}
          </div>
          
          <p style="margin: 16px 0 0 0;">
            Best regards,<br>
            <strong>{company_name}</strong>
          </p>
        </div>
        <div style="${this.emailSafeCSS.footer}">
          <p style="margin: 0;">Contact us: {company_email}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate invoice template
   */
  generateInvoiceTemplate() {
    return `
      <div style="${this.emailSafeCSS.container}">
        <div style="${this.emailSafeCSS.header}">
          <h1 style="margin: 0; font-size: 24px;">Invoice {invoice_number}</h1>
        </div>
        <div style="${this.emailSafeCSS.content}">
          <p style="margin: 0 0 16px 0;">Dear {client_name},</p>
          
          <p>Please find attached invoice #{invoice_number} for the amount of <strong style="${this.emailSafeCSS.highlight}">{total_amount}</strong>.</p>
          
          <table style="${this.emailSafeCSS.table}">
            <tr>
              <td style="${this.emailSafeCSS.tableCell}"><strong>Invoice Number:</strong></td>
              <td style="${this.emailSafeCSS.tableCell}">{invoice_number}</td>
            </tr>
            <tr>
              <td style="${this.emailSafeCSS.tableCell}"><strong>Due Date:</strong></td>
              <td style="${this.emailSafeCSS.tableCell}">{due_date}</td>
            </tr>
            <tr>
              <td style="${this.emailSafeCSS.tableCell}"><strong>Total Amount:</strong></td>
              <td style="${this.emailSafeCSS.tableCell}"><strong>{total_amount}</strong></td>
            </tr>
          </table>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="margin: 16px 0 0 0;">
            Best regards,<br>
            <strong>{company_name}</strong>
          </p>
        </div>
        <div style="${this.emailSafeCSS.footer}">
          <p style="margin: 0;">This is an automated message from {company_name}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate reminder template
   */
  generateReminderTemplate() {
    return `
      <div style="${this.emailSafeCSS.container}">
        <div style="background-color: #f59e0b; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Payment Reminder</h1>
        </div>
        <div style="${this.emailSafeCSS.content}">
          <p style="margin: 0 0 16px 0;">Dear {client_name},</p>
          
          <p>This is a friendly reminder that invoice #{invoice_number} is now <strong>{days_overdue} days overdue</strong>.</p>
          
          <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold;">Outstanding Amount: {total_amount}</p>
          </div>
          
          <p>Please arrange payment as soon as possible to avoid any late fees.</p>
          
          <p style="margin: 16px 0 0 0;">
            Thank you for your prompt attention to this matter.<br>
            <strong>{company_name}</strong>
          </p>
        </div>
        <div style="${this.emailSafeCSS.footer}">
          <p style="margin: 0;">Contact us if you have any questions about this invoice</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate newsletter template
   */
  generateNewsletterTemplate() {
    return `
      <div style="${this.emailSafeCSS.container}">
        <div style="${this.emailSafeCSS.header}">
          <h1 style="margin: 0; font-size: 28px;">Newsletter</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">{company_name}</p>
        </div>
        <div style="${this.emailSafeCSS.content}">
          <p style="margin: 0 0 16px 0;">Hello {subscriber_name},</p>
          
          <p>Welcome to our latest newsletter! Here's what's new:</p>
          
          <div style="margin: 20px 0;">
            {content}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="${this.emailSafeCSS.button}">Visit Our Website</a>
          </div>
          
          <p style="margin: 16px 0 0 0;">
            Best regards,<br>
            <strong>{company_name}</strong>
          </p>
        </div>
        <div style="${this.emailSafeCSS.footer}">
          <p style="margin: 0;">
            <a href="{unsubscribe_link}" style="color: #9ca3af;">Unsubscribe</a> | 
            Contact us: {company_email}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get available template variables
   */
  getAvailableVariables() {
    return this.defaultVariables.map(variable => ({
      name: variable,
      placeholder: `{${variable}}`,
      description: this.getVariableDescription(variable),
    }));
  }

  /**
   * Get description for a variable
   */
  getVariableDescription(variable) {
    const descriptions = {
      client_name: 'Client or customer name',
      company_name: 'Your company name',
      company_email: 'Your company email address',
      company_phone: 'Your company phone number',
      invoice_number: 'Invoice number',
      invoice_date: 'Invoice issue date',
      due_date: 'Payment due date',
      total_amount: 'Total invoice amount',
      payment_amount: 'Payment amount received',
      payment_date: 'Date payment was received',
      payment_method: 'Method of payment',
      days_overdue: 'Number of days payment is overdue',
      quote_number: 'Quote number',
      issue_date: 'Date document was issued',
      expiry_date: 'Quote expiration date',
    };

    return descriptions[variable] || 'Custom variable';
  }
}

let emailTemplateServiceInstance = null;

export const getEmailTemplateService = () => {
  if (!emailTemplateServiceInstance) {
    emailTemplateServiceInstance = new EmailTemplateService();
  }
  return emailTemplateServiceInstance;
};

export default getEmailTemplateService;
