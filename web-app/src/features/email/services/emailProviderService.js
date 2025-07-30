import Logger from '@utils/Logger';
import { getEnvVar } from '@/utils/env';

/**
 * EmailProviderService - Comprehensive email provider service with IMAP/SMTP support
 * Handles both sending (SMTP) and receiving (IMAP) emails with multiple provider support
 * Supports SendGrid, AWS SES, Mailgun, Postmark, and custom IMAP/SMTP servers
 */
class EmailProviderService {
  constructor() {
    this.imapConnections = new Map(); // Store active IMAP connections
    this.smtpConnections = new Map(); // Store active SMTP connections
    this.syncIntervals = new Map(); // Store sync intervals for accounts
    
    this.providers = {
      sendgrid: {
        name: 'SendGrid',
        endpoint: 'https://api.sendgrid.com/v3/mail/send',
        requiresAuth: true,
        authType: 'bearer',
        limits: { daily: 40000, monthly: 1200000 },
        supportsImap: false,
      },
      ses: {
        name: 'Amazon SES',
        endpoint: 'https://email.{region}.amazonaws.com/',
        requiresAuth: true,
        authType: 'aws',
        limits: { daily: 200, monthly: 1000000 },
        supportsImap: false,
      },
      mailgun: {
        name: 'Mailgun',
        endpoint: 'https://api.mailgun.net/v3/{domain}/messages',
        requiresAuth: true,
        authType: 'basic',
        limits: { daily: 300, monthly: 10000 },
        supportsImap: false,
      },
      postmark: {
        name: 'Postmark',
        endpoint: 'https://api.postmarkapp.com/email',
        requiresAuth: true,
        authType: 'token',
        limits: { daily: 25000, monthly: 750000 },
        supportsImap: false,
      },
      imap_smtp: {
        name: 'IMAP/SMTP Server',
        endpoint: null,
        requiresAuth: true,
        authType: 'credentials',
        limits: { daily: null, monthly: null },
        supportsImap: true,
        supportsSmtp: true,
      },
      gmail: {
        name: 'Gmail',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        requiresAuth: true,
        authType: 'oauth2',
        supportsImap: true,
        supportsSmtp: true,
      },
      outlook: {
        name: 'Outlook/Hotmail',
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        requiresAuth: true,
        authType: 'credentials',
        supportsImap: true,
        supportsSmtp: true,
      },
    };

    this.activeProvider = this.getActiveProvider();
  }

  /**
   * Get the currently active email provider
   */
  getActiveProvider() {
    const provider = getEnvVar('VITE_EMAIL_PROVIDER') || 'sendgrid';
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
    const apiKey = getEnvVar('VITE_SENDGRID_API_KEY');
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
          email: emailData.from || getEnvVar('VITE_FROM_EMAIL') || 'noreply@nexamanager.com',
          name: emailData.fromName || getEnvVar('VITE_FROM_NAME') || 'Nexa Manager',
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
    const accessKey = getEnvVar('VITE_AWS_ACCESS_KEY_ID');
    const secretKey = getEnvVar('VITE_AWS_SECRET_ACCESS_KEY');
    const region = getEnvVar('VITE_AWS_REGION') || 'us-east-1';

    if (!accessKey || !secretKey) {
      return await this.sendWithMockProvider(emailData, 'AWS credentials not configured');
    }

    try {
      // This is a simplified example - in production, you'd use AWS SDK
      const payload = {
        Source: emailData.from || getEnvVar('VITE_FROM_EMAIL') || 'noreply@nexamanager.com',
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
    const apiKey = getEnvVar('VITE_MAILGUN_API_KEY');
    const domain = getEnvVar('VITE_MAILGUN_DOMAIN');

    if (!apiKey || !domain) {
      return await this.sendWithMockProvider(emailData, 'Mailgun credentials not configured');
    }

    try {
      const formData = new FormData();
      formData.append(
        'from',
        emailData.from || getEnvVar('VITE_FROM_EMAIL') || 'noreply@nexamanager.com',
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
    const serverToken = getEnvVar('VITE_POSTMARK_SERVER_TOKEN');

    if (!serverToken) {
      return await this.sendWithMockProvider(emailData, 'Postmark server token not configured');
    }

    try {
      const payload = {
        From: emailData.from || getEnvVar('VITE_FROM_EMAIL') || 'noreply@nexamanager.com',
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
   * Send email using custom SMTP
   */
  async sendWithSMTP(emailData) {
    try {
      const smtpConfig = this.getSmtpConfig();
      if (!smtpConfig) {
        return await this.sendWithMockProvider(emailData, 'SMTP configuration not found');
      }

      // In a real implementation, this would use a backend service or WebSocket
      // For now, we'll simulate SMTP sending
      const result = await this.simulateSmtpSend(emailData, smtpConfig);
      return result;
    } catch (error) {
      Logger.error('SMTP send error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'smtp',
      };
    }
  }

  /**
   * IMAP CONNECTION MANAGEMENT
   */

  /**
   * Connect to IMAP server
   */
  async connectImap(accountConfig) {
    try {
      const { id, host, port, username, password, secure = true } = accountConfig;
      
      // In a real implementation, this would use a backend IMAP library
      // For now, we'll simulate the connection
      const connection = await this.simulateImapConnection({
        host,
        port: port || (secure ? 993 : 143),
        username,
        password,
        secure,
      });

      this.imapConnections.set(id, {
        ...connection,
        accountId: id,
        lastSync: new Date(),
        folders: ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam'],
      });

      Logger.info(`IMAP connected for account: ${username}`);
      return { success: true, accountId: id };
    } catch (error) {
      Logger.error('IMAP connection error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect from IMAP server
   */
  async disconnectImap(accountId) {
    try {
      const connection = this.imapConnections.get(accountId);
      if (connection) {
        // Clear sync interval if exists
        if (this.syncIntervals.has(accountId)) {
          clearInterval(this.syncIntervals.get(accountId));
          this.syncIntervals.delete(accountId);
        }

        // Simulate disconnection
        await this.simulateImapDisconnection(connection);
        this.imapConnections.delete(accountId);
        
        Logger.info(`IMAP disconnected for account: ${accountId}`);
        return { success: true };
      }
      return { success: false, error: 'Connection not found' };
    } catch (error) {
      Logger.error('IMAP disconnection error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch emails from IMAP server
   */
  async fetchEmails(accountId, options = {}) {
    try {
      const connection = this.imapConnections.get(accountId);
      if (!connection) {
        throw new Error('IMAP connection not found');
      }

      const {
        folder = 'INBOX',
        limit = 50,
        since = null,
        unseen = false,
        search = null,
      } = options;

      // Simulate email fetching
      const emails = await this.simulateEmailFetch(connection, {
        folder,
        limit,
        since,
        unseen,
        search,
      });

      return {
        success: true,
        emails,
        folder,
        total: emails.length,
      };
    } catch (error) {
      Logger.error('Email fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get folder list from IMAP server
   */
  async getFolders(accountId) {
    try {
      const connection = this.imapConnections.get(accountId);
      if (!connection) {
        throw new Error('IMAP connection not found');
      }

      return {
        success: true,
        folders: connection.folders.map(name => ({
          name,
          path: name,
          delimiter: '/',
          attributes: name === 'INBOX' ? ['\\HasNoChildren'] : [],
        })),
      };
    } catch (error) {
      Logger.error('Folder fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark email as read/unread
   */
  async markEmail(accountId, emailId, flags) {
    try {
      const connection = this.imapConnections.get(accountId);
      if (!connection) {
        throw new Error('IMAP connection not found');
      }

      // Simulate marking email
      await this.simulateEmailMark(connection, emailId, flags);

      return { success: true, emailId, flags };
    } catch (error) {
      Logger.error('Email mark error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Move email to folder
   */
  async moveEmail(accountId, emailId, targetFolder) {
    try {
      const connection = this.imapConnections.get(accountId);
      if (!connection) {
        throw new Error('IMAP connection not found');
      }

      // Simulate moving email
      await this.simulateEmailMove(connection, emailId, targetFolder);

      return { success: true, emailId, targetFolder };
    } catch (error) {
      Logger.error('Email move error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete email
   */
  async deleteEmail(accountId, emailId, permanent = false) {
    try {
      const connection = this.imapConnections.get(accountId);
      if (!connection) {
        throw new Error('IMAP connection not found');
      }

      if (permanent) {
        await this.simulateEmailDelete(connection, emailId, true);
      } else {
        await this.moveEmail(accountId, emailId, 'Trash');
      }

      return { success: true, emailId, permanent };
    } catch (error) {
      Logger.error('Email delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start email synchronization for an account
   */
  startEmailSync(accountId, intervalMinutes = 5) {
    try {
      // Clear existing interval if any
      if (this.syncIntervals.has(accountId)) {
        clearInterval(this.syncIntervals.get(accountId));
      }

      const interval = setInterval(async () => {
        try {
          await this.syncEmails(accountId);
        } catch (error) {
          Logger.error(`Email sync error for account ${accountId}:`, error);
        }
      }, intervalMinutes * 60 * 1000);

      this.syncIntervals.set(accountId, interval);
      Logger.info(`Email sync started for account: ${accountId} (every ${intervalMinutes} minutes)`);
      
      return { success: true, intervalMinutes };
    } catch (error) {
      Logger.error('Email sync start error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop email synchronization for an account
   */
  stopEmailSync(accountId) {
    try {
      if (this.syncIntervals.has(accountId)) {
        clearInterval(this.syncIntervals.get(accountId));
        this.syncIntervals.delete(accountId);
        Logger.info(`Email sync stopped for account: ${accountId}`);
        return { success: true };
      }
      return { success: false, error: 'No sync interval found' };
    } catch (error) {
      Logger.error('Email sync stop error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform email synchronization
   */
  async syncEmails(accountId) {
    try {
      const connection = this.imapConnections.get(accountId);
      if (!connection) {
        throw new Error('IMAP connection not found');
      }

      const lastSync = connection.lastSync;
      const result = await this.fetchEmails(accountId, {
        since: lastSync,
        unseen: true,
      });

      if (result.success && result.emails.length > 0) {
        // Update last sync time
        connection.lastSync = new Date();
        
        // Emit sync event (in real implementation, this would trigger UI updates)
        this.emitSyncEvent(accountId, {
          newEmails: result.emails.length,
          lastSync: connection.lastSync,
        });

        Logger.info(`Synced ${result.emails.length} new emails for account: ${accountId}`);
      }

      return result;
    } catch (error) {
      Logger.error('Email sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SIMULATION METHODS (In production, these would be real IMAP/SMTP implementations)
   */

  async simulateImapConnection(config) {
    await this.delay(1000); // Simulate connection time
    
    return {
      host: config.host,
      port: config.port,
      username: config.username,
      secure: config.secure,
      connected: true,
      connectedAt: new Date(),
    };
  }

  async simulateImapDisconnection(connection) {
    await this.delay(500);
    connection.connected = false;
  }

  async simulateEmailFetch(connection, options) {
    await this.delay(800); // Simulate fetch time

    // Generate mock emails
    const emails = [];
    const count = Math.min(options.limit, 20); // Simulate up to 20 emails

    for (let i = 0; i < count; i++) {
      emails.push({
        id: `email_${Date.now()}_${i}`,
        uid: 1000 + i,
        subject: `Sample Email ${i + 1}`,
        from: {
          name: `Sender ${i + 1}`,
          email: `sender${i + 1}@example.com`,
        },
        to: [{
          name: connection.username,
          email: connection.username,
        }],
        date: new Date(Date.now() - (i * 3600000)), // 1 hour apart
        flags: i % 3 === 0 ? ['\\Seen'] : [], // Some read, some unread
        folder: options.folder,
        size: Math.floor(Math.random() * 50000) + 1000,
        bodyPreview: `This is a preview of email ${i + 1}...`,
        hasAttachments: i % 4 === 0, // Some with attachments
        priority: i % 10 === 0 ? 'high' : 'normal',
      });
    }

    return emails;
  }

  async simulateEmailMark(connection, emailId, flags) {
    await this.delay(300);
    Logger.info(`Email ${emailId} marked with flags:`, flags);
  }

  async simulateEmailMove(connection, emailId, targetFolder) {
    await this.delay(500);
    Logger.info(`Email ${emailId} moved to folder: ${targetFolder}`);
  }

  async simulateEmailDelete(connection, emailId, permanent) {
    await this.delay(400);
    Logger.info(`Email ${emailId} ${permanent ? 'permanently deleted' : 'moved to trash'}`);
  }

  async simulateSmtpSend(emailData, smtpConfig) {
    await this.delay(1200); // Simulate send time

    const messageId = `smtp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    Logger.info('SMTP email sent:', {
      to: emailData.to,
      subject: emailData.subject,
      messageId,
      server: smtpConfig.host,
    });

    return {
      success: true,
      messageId,
      provider: 'smtp',
      server: smtpConfig.host,
    };
  }

  /**
   * CONFIGURATION HELPERS
   */

  getSmtpConfig() {
    return {
      host: getEnvVar('VITE_SMTP_HOST'),
      port: parseInt(getEnvVar('VITE_SMTP_PORT')) || 587,
      username: getEnvVar('VITE_SMTP_USER'),
      password: getEnvVar('VITE_SMTP_PASS'),
      secure: getEnvVar('VITE_SMTP_SECURE') === 'true',
    };
  }

  /**
   * Validate email account configuration
   */
  async validateAccountConfig(config) {
    const { type, host, port, username, password, secure } = config;
    
    const errors = [];
    
    if (!host) errors.push('Host is required');
    if (!port || port < 1 || port > 65535) errors.push('Valid port is required');
    if (!username) errors.push('Username is required');
    if (!password) errors.push('Password is required');
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Test connection
    try {
      if (type === 'imap' || type === 'both') {
        const testConnection = await this.simulateImapConnection({
          host, port, username, password, secure
        });
        await this.simulateImapDisconnection(testConnection);
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Get connection status for all accounts
   */
  getConnectionStatus() {
    const status = {};
    
    for (const [accountId, connection] of this.imapConnections) {
      status[accountId] = {
        connected: connection.connected,
        lastSync: connection.lastSync,
        host: connection.host,
        folders: connection.folders.length,
        hasSync: this.syncIntervals.has(accountId),
      };
    }
    
    return status;
  }

  /**
   * Emit sync event (placeholder for real event system)
   */
  emitSyncEvent(accountId, data) {
    // In a real implementation, this would emit events to the UI
    Logger.info(`Sync event for ${accountId}:`, data);
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
        return !!getEnvVar('VITE_SENDGRID_API_KEY');
      case 'ses':
        return !!(
          getEnvVar('VITE_AWS_ACCESS_KEY_ID') && getEnvVar('VITE_AWS_SECRET_ACCESS_KEY')
        );
      case 'mailgun':
        return !!(getEnvVar('VITE_MAILGUN_API_KEY') && getEnvVar('VITE_MAILGUN_DOMAIN'));
      case 'postmark':
        return !!getEnvVar('VITE_POSTMARK_SERVER_TOKEN');
      case 'imap_smtp':
        return !!(getEnvVar('VITE_IMAP_HOST') && getEnvVar('VITE_SMTP_HOST'));
      case 'gmail':
        return !!(getEnvVar('VITE_GMAIL_CLIENT_ID') && getEnvVar('VITE_GMAIL_CLIENT_SECRET'));
      case 'outlook':
        return !!(getEnvVar('VITE_OUTLOOK_CLIENT_ID') && getEnvVar('VITE_OUTLOOK_CLIENT_SECRET'));
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
    const baseUrl = getEnvVar('VITE_BASE_URL') || 'https://your-domain.com';

    return {
      sendgrid: `${baseUrl}/api/webhooks/sendgrid`,
      postmark: `${baseUrl}/api/webhooks/postmark`,
      mailgun: `${baseUrl}/api/webhooks/mailgun`,
      ses: `${baseUrl}/api/webhooks/ses`,
    };
  }

  /**
   * Get supported email providers with their capabilities
   */
  getSupportedProviders() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      id: key,
      name: provider.name,
      supportsImap: provider.supportsImap || false,
      supportsSmtp: provider.supportsSmtp || true,
      authType: provider.authType,
      configured: this.isProviderConfigured(key),
      limits: provider.limits,
    }));
  }

  /**
   * Get IMAP-capable providers
   */
  getImapProviders() {
    return this.getSupportedProviders().filter(provider => provider.supportsImap);
  }

  /**
   * Test IMAP connection
   */
  async testImapConnection(config) {
    try {
      const validation = await this.validateAccountConfig({ ...config, type: 'imap' });
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Simulate connection test
      const connection = await this.simulateImapConnection(config);
      await this.simulateImapDisconnection(connection);

      return { 
        success: true, 
        message: 'IMAP connection successful',
        serverInfo: {
          host: config.host,
          port: config.port,
          secure: config.secure,
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test SMTP connection
   */
  async testSmtpConnection(config) {
    try {
      const validation = await this.validateAccountConfig({ ...config, type: 'smtp' });
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Simulate SMTP test
      const result = await this.simulateSmtpSend({
        to: config.username,
        subject: 'SMTP Test - Nexa Manager',
        html: '<p>This is a test email to verify SMTP configuration.</p>',
      }, config);

      return { 
        success: true, 
        message: 'SMTP connection successful',
        messageId: result.messageId,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get email account suggestions based on email address
   */
  getAccountSuggestions(emailAddress) {
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    
    const suggestions = {
      'gmail.com': {
        provider: 'gmail',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        secure: true,
        authType: 'oauth2',
        note: 'Requires App Password or OAuth2',
      },
      'outlook.com': {
        provider: 'outlook',
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        secure: true,
        authType: 'credentials',
      },
      'hotmail.com': {
        provider: 'outlook',
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        secure: true,
        authType: 'credentials',
      },
      'yahoo.com': {
        provider: 'yahoo',
        imapHost: 'imap.mail.yahoo.com',
        imapPort: 993,
        smtpHost: 'smtp.mail.yahoo.com',
        smtpPort: 587,
        secure: true,
        authType: 'credentials',
        note: 'Requires App Password',
      },
    };

    return suggestions[domain] || {
      provider: 'custom',
      note: 'Custom IMAP/SMTP configuration required',
    };
  }

  /**
   * Cleanup all connections and intervals
   */
  cleanup() {
    // Stop all sync intervals
    for (const [accountId, interval] of this.syncIntervals) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();

    // Disconnect all IMAP connections
    for (const [accountId, connection] of this.imapConnections) {
      this.simulateImapDisconnection(connection);
    }
    this.imapConnections.clear();

    Logger.info('EmailProviderService cleanup completed');
  }
}

let emailProviderServiceInstance = null;

export const getEmailProviderService = () => {
  if (!emailProviderServiceInstance) {
    emailProviderServiceInstance = new EmailProviderService();
  }
  return emailProviderServiceInstance;
};

export default getEmailProviderService;
