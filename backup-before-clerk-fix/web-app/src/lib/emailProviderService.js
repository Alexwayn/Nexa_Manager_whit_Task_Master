import Logger from '@utils/Logger';

/**
 * EmailProviderService - Handles integration with various email service providers
 * Supports SendGrid, AWS SES, Mailgun, Postmark, and more
 */
class EmailProviderService {
  constructor() {
    this.providers = {
      sendgrid: {
        name: 'SendGrid',
        endpoint: 'https://api.sendgrid.com/v3/mail/send',
        requiresAuth: true,
        authType: 'bearer',
        limits: { daily: 40000, monthly: 1200000 },
      },
      ses: {
        name: 'Amazon SES',
        endpoint: 'https://email.{region}.amazonaws.com/',
        requiresAuth: true,
        authType: 'aws',
        limits: { daily: 200, monthly: 1000000 },
      },
      mailgun: {
        name: 'Mailgun',
        endpoint: 'https://api.mailgun.net/v3/{domain}/messages',
        requiresAuth: true,
        authType: 'basic',
        limits: { daily: 300, monthly: 10000 },
      },
      postmark: {
        name: 'Postmark',
        endpoint: 'https://api.postmarkapp.com/email',
        requiresAuth: true,
        authType: 'token',
        limits: { daily: 25000, monthly: 750000 },
      },
      smtp: {
        name: 'Custom SMTP',
        endpoint: null,
        requiresAuth: true,
        authType: 'smtp',
        limits: { daily: null, monthly: null },
      },
    };

    this.activeProvider = this.getActiveProvider();
  }

  /**
   * Get the currently active email provider
   */
  getActiveProvider() {
    const provider = import.meta.env.VITE_EMAIL_PROVIDER || 'sendgrid';
    return this.providers[provider] ? provider : 'sendgrid';
  }

  /**
   * Send email using the active provider
   */
  async sendEmail(emailData) {
    try {
      const provider = this.activeProvider;

      switch (provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(emailData);
        case 'ses':
          return await this.sendWithSES(emailData);
        case 'mailgun':
          return await this.sendWithMailgun(emailData);
        case 'postmark':
          return await this.sendWithPostmark(emailData);
        case 'smtp':
          return await this.sendWithSMTP(emailData);
        default:
          return await this.sendWithMockProvider(emailData);
      }
    } catch (error) {
      Logger.error('Error sending email:', error);
      return {
        success: false,
        error: error.message,
        provider: this.activeProvider,
      };
    }
  }

  /**
   * Send email using SendGrid
   */
  async sendWithSendGrid(emailData) {
    const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    if (!apiKey) {
      return await this.sendWithMockProvider(emailData, 'SendGrid API key not configured');
    }

    try {
      const payload = {
        personalizations: [
          {
            to: [{ email: emailData.to, name: emailData.toName || '' }],
            subject: emailData.subject,
          },
        ],
        from: {
          email: emailData.from || import.meta.env.VITE_FROM_EMAIL || 'noreply@nexamanager.com',
          name: emailData.fromName || import.meta.env.VITE_FROM_NAME || 'Nexa Manager',
        },
        content: [
          {
            type: 'text/plain',
            value: emailData.text || this.htmlToText(emailData.html),
          },
          {
            type: 'text/html',
            value: emailData.html,
          },
        ],
      };

      // Add attachments if present
      if (emailData.attachments && emailData.attachments.length > 0) {
        payload.attachments = emailData.attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type || 'application/octet-stream',
          disposition: 'attachment',
        }));
      }

      // Add tracking if enabled
      if (emailData.tracking !== false) {
        payload.tracking_settings = {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
          subscription_tracking: { enable: false },
        };
      }

      const response = await fetch(this.providers.sendgrid.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const messageId = response.headers.get('X-Message-Id');
        return {
          success: true,
          messageId,
          provider: 'sendgrid',
        };
      } else {
        const error = await response.json();
        throw new Error(`SendGrid error: ${error.errors?.[0]?.message || 'Unknown error'}`);
      }
    } catch (error) {
      Logger.error('SendGrid send error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid',
      };
    }
  }

  /**
   * Send email using AWS SES
   */
  async sendWithSES(emailData) {
    const accessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
    const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

    if (!accessKey || !secretKey) {
      return await this.sendWithMockProvider(emailData, 'AWS credentials not configured');
    }

    try {
      // This is a simplified example - in production, you'd use AWS SDK
      const payload = {
        Source: emailData.from || import.meta.env.VITE_FROM_EMAIL || 'noreply@nexamanager.com',
        Destination: {
          ToAddresses: [emailData.to],
        },
        Message: {
          Subject: {
            Data: emailData.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: emailData.text || this.htmlToText(emailData.html),
              Charset: 'UTF-8',
            },
            Html: {
              Data: emailData.html,
              Charset: 'UTF-8',
            },
          },
        },
      };

      // Note: This is a mock implementation
      // In real implementation, you'd use AWS SDK v3 SESv2Client
      return await this.sendWithMockProvider(
        {
          ...emailData,
          provider: 'AWS SES',
        },
        null,
      );
    } catch (error) {
      Logger.error('AWS SES send error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'ses',
      };
    }
  }

  /**
   * Send email using Mailgun
   */
  async sendWithMailgun(emailData) {
    const apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
    const domain = import.meta.env.VITE_MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
      return await this.sendWithMockProvider(emailData, 'Mailgun credentials not configured');
    }

    try {
      const formData = new FormData();
      formData.append(
        'from',
        emailData.from || import.meta.env.VITE_FROM_EMAIL || 'noreply@nexamanager.com',
      );
      formData.append('to', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('text', emailData.text || this.htmlToText(emailData.html));
      formData.append('html', emailData.html);

      if (emailData.tracking !== false) {
        formData.append('o:tracking', 'yes');
        formData.append('o:tracking-clicks', 'yes');
        formData.append('o:tracking-opens', 'yes');
      }

      const endpoint = this.providers.mailgun.endpoint.replace('{domain}', domain);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.id,
          provider: 'mailgun',
        };
      } else {
        const error = await response.json();
        throw new Error(`Mailgun error: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      Logger.error('Mailgun send error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'mailgun',
      };
    }
  }

  /**
   * Send email using Postmark
   */
  async sendWithPostmark(emailData) {
    const serverToken = import.meta.env.VITE_POSTMARK_SERVER_TOKEN;

    if (!serverToken) {
      return await this.sendWithMockProvider(emailData, 'Postmark server token not configured');
    }

    try {
      const payload = {
        From: emailData.from || import.meta.env.VITE_FROM_EMAIL || 'noreply@nexamanager.com',
        To: emailData.to,
        Subject: emailData.subject,
        TextBody: emailData.text || this.htmlToText(emailData.html),
        HtmlBody: emailData.html,
        TrackOpens: emailData.tracking !== false,
        TrackLinks: emailData.tracking !== false ? 'HtmlAndText' : 'None',
      };

      if (emailData.attachments && emailData.attachments.length > 0) {
        payload.Attachments = emailData.attachments.map(attachment => ({
          Name: attachment.filename,
          Content: attachment.content,
          ContentType: attachment.type || 'application/octet-stream',
        }));
      }

      const response = await fetch(this.providers.postmark.endpoint, {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': serverToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          messageId: result.MessageID,
          provider: 'postmark',
        };
      } else {
        const error = await response.json();
        throw new Error(`Postmark error: ${error.Message || 'Unknown error'}`);
      }
    } catch (error) {
      Logger.error('Postmark send error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'postmark',
      };
    }
  }

  /**
   * Send email using custom SMTP (placeholder)
   */
  async sendWithSMTP(emailData) {
    // This would require a backend SMTP service
    // For now, we'll use the mock provider
    return await this.sendWithMockProvider(
      {
        ...emailData,
        provider: 'Custom SMTP',
      },
      'SMTP integration requires backend service',
    );
  }

  /**
   * Mock email provider for development/testing
   */
  async sendWithMockProvider(emailData, mockError = null) {
    await this.delay(Math.random() * 1000 + 500); // Simulate network delay

    if (mockError) {
      Logger.warn('Mock email provider:', mockError);
    }

    // Simulate occasional failures for testing
    const shouldFail = Math.random() < 0.05; // 5% failure rate

    if (shouldFail && !mockError) {
      return {
        success: false,
        error: 'Mock provider: Simulated network error',
        provider: 'mock',
      };
    }

    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log the email for development
    Logger.info('Mock email sent:', {
      to: emailData.to,
      subject: emailData.subject,
      messageId,
      provider: emailData.provider || 'mock',
      note: mockError || 'Simulated successful delivery',
    });

    return {
      success: true,
      messageId,
      provider: emailData.provider || 'mock',
      note: mockError ? `Warning: ${mockError}` : 'Email sent successfully',
    };
  }

  /**
   * Test email configuration
   */
  async testConfiguration(testEmail, provider = null) {
    const testData = {
      to: testEmail,
      subject: 'Test Email - Nexa Manager Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Configuration Test</h2>
          <p>This is a test email to verify your email service configuration.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Provider:</strong> ${this.providers[this.activeProvider]?.name || 'Unknown'}</p>
            <p><strong>Test Date:</strong> €{new Date().toLocaleString()}</p>
          </div>
          <p>If you received this email, your configuration is working correctly!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated test email from Nexa Manager.
          </p>
        </div>
      `,
      tracking: false,
    };

    if (provider) {
      const originalProvider = this.activeProvider;
      this.activeProvider = provider;
      const result = await this.sendEmail(testData);
      this.activeProvider = originalProvider;
      return result;
    }

    return await this.sendEmail(testData);
  }

  /**
   * Get provider statistics and limits
   */
  getProviderInfo(provider = null) {
    const target = provider || this.activeProvider;
    const providerData = this.providers[target];

    if (!providerData) {
      return null;
    }

    return {
      name: providerData.name,
      active: target === this.activeProvider,
      configured: this.isProviderConfigured(target),
      limits: providerData.limits,
      authType: providerData.authType,
    };
  }

  /**
   * Check if a provider is properly configured
   */
  isProviderConfigured(provider) {
    switch (provider) {
      case 'sendgrid':
        return !!import.meta.env.VITE_SENDGRID_API_KEY;
      case 'ses':
        return !!(
          import.meta.env.VITE_AWS_ACCESS_KEY_ID && import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
        );
      case 'mailgun':
        return !!(import.meta.env.VITE_MAILGUN_API_KEY && import.meta.env.VITE_MAILGUN_DOMAIN);
      case 'postmark':
        return !!import.meta.env.VITE_POSTMARK_SERVER_TOKEN;
      case 'smtp':
        return !!(import.meta.env.VITE_SMTP_HOST && import.meta.env.VITE_SMTP_USER);
      default:
        return true; // Mock provider is always "configured"
    }
  }

  /**
   * Get all available providers with their status
   */
  getAllProviders() {
    return Object.keys(this.providers).map(key => ({
      id: key,
      ...this.getProviderInfo(key),
    }));
  }

  /**
   * Switch active provider
   */
  setActiveProvider(provider) {
    if (this.providers[provider]) {
      this.activeProvider = provider;
      return true;
    }
    return false;
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    if (!html) return '';

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
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate email address
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Estimate delivery time based on provider
   */
  getEstimatedDeliveryTime(provider = null) {
    const target = provider || this.activeProvider;

    const deliveryTimes = {
      sendgrid: '1-5 minutes',
      ses: '1-3 minutes',
      mailgun: '1-5 minutes',
      postmark: '30 seconds - 2 minutes',
      smtp: '1-10 minutes',
      mock: 'Instant (development)',
    };

    return deliveryTimes[target] || 'Unknown';
  }

  /**
   * Get webhook URLs for tracking (if supported)
   */
  getWebhookUrls() {
    const baseUrl = import.meta.env.VITE_BASE_URL || 'https://your-domain.com';

    return {
      sendgrid: `${baseUrl}/api/webhooks/sendgrid`,
      postmark: `${baseUrl}/api/webhooks/postmark`,
      mailgun: `${baseUrl}/api/webhooks/mailgun`,
      ses: `${baseUrl}/api/webhooks/ses`,
    };
  }
}

export default new EmailProviderService();
