/**
 * Email Command Handler for Voice Assistant
 * Handles email-related voice commands including composing, sending, searching, and managing emails
 */

import emailManagementService from '@/features/email/services/emailManagementService';
// Type assertion to help TypeScript understand this is an instance
const emailService = emailManagementService as any;
import emailSearchService from '@/features/email/services/emailSearchService';
import emailTemplateService from '@/features/email/services/emailTemplateService';
import emailCampaignService from '@/features/email/services/emailCampaignService';
import emailAnalyticsService from '@/features/email/services/emailAnalyticsService';
import emailAutomationService from '@/features/email/services/emailAutomationService';

// Interface for email command parameters
interface EmailParams {
  recipient?: string;
  subject?: string;
  message?: string;
  query?: string;
  folderName?: string;
  templateName?: string;
  body?: string;
  scheduledTime?: string;
  invoiceId?: string;
  quoteId?: string;
  emailId?: string;
  sender?: string;
  campaignName?: string;
  campaignId?: string;
  templateId?: string;
  clientId?: string;
  ruleName?: string;
  conditions?: string;
  actions?: string;
  category?: string;
  [key: string]: any; // Allow additional properties
}

class EmailCommandHandler {
  private emailCommands: Record<string, { action: string; params: string[] }>;
  private searchCommands: Record<string, { action: string; params: string[] }>;
  private helpCommands: Record<string, { action: string; params: string[] }>;

  constructor() {
    this.emailCommands = {
      // Compose and Send Commands
      'compose email': { action: 'compose', params: [] },
      'write email': { action: 'compose', params: [] },
      'new email': { action: 'compose', params: [] },
      'create email': { action: 'compose', params: [] },
      'draft email': { action: 'compose', params: [] },
      'send email': { action: 'send', params: ['recipient', 'subject', 'message'] },
      'send message': { action: 'send', params: ['recipient', 'subject', 'message'] },
      'email to': { action: 'send', params: ['recipient', 'subject', 'message'] },
      'send email to': { action: 'send', params: ['recipient', 'subject', 'message'] },
      'reply to email': { action: 'reply', params: ['message'] },
      'reply': { action: 'reply', params: ['message'] },
      'forward email': { action: 'forward', params: ['recipient'] },
      'forward': { action: 'forward', params: ['recipient'] },
      
      // Email Management Commands
      'check emails': { action: 'checkEmails', params: [] },
      'check email': { action: 'checkEmails', params: [] },
      'show emails': { action: 'showEmails', params: [] },
      'list emails': { action: 'showEmails', params: [] },
      'get emails': { action: 'showEmails', params: [] },
      'view emails': { action: 'showEmails', params: [] },
      'mark as read': { action: 'markRead', params: ['emailId'] },
      'mark read': { action: 'markRead', params: ['emailId'] },
      'mark as unread': { action: 'markUnread', params: ['emailId'] },
      'mark unread': { action: 'markUnread', params: ['emailId'] },
      'star email': { action: 'starEmail', params: ['emailId'] },
      'unstar email': { action: 'unstarEmail', params: ['emailId'] },
      'delete email': { action: 'deleteEmail', params: ['emailId'] },
      'remove email': { action: 'deleteEmail', params: ['emailId'] },
      'archive email': { action: 'archiveEmail', params: ['emailId'] },
      
      // Search Commands
      'search emails': { action: 'searchEmails', params: ['query'] },
      'find emails': { action: 'searchEmails', params: ['query'] },
      'search for': { action: 'searchEmails', params: ['query'] },
      'find email from': { action: 'searchByFrom', params: ['sender'] },
      'emails from': { action: 'searchByFrom', params: ['sender'] },
      'search subject': { action: 'searchBySubject', params: ['subject'] },
      'find subject': { action: 'searchBySubject', params: ['subject'] },
      'search attachments': { action: 'searchAttachments', params: ['query'] },
      'find attachments': { action: 'searchAttachments', params: ['query'] },
      
      // Folder Management Commands
      'show folders': { action: 'showFolders', params: [] },
      'list folders': { action: 'showFolders', params: [] },
      'create folder': { action: 'createFolder', params: ['folderName'] },
      'new folder': { action: 'createFolder', params: ['folderName'] },
      'delete folder': { action: 'deleteFolder', params: ['folderName'] },
      'remove folder': { action: 'deleteFolder', params: ['folderName'] },
      'move to folder': { action: 'moveToFolder', params: ['emailId', 'folderName'] },
      'move email to': { action: 'moveToFolder', params: ['emailId', 'folderName'] },
      
      // Template Commands
      'show templates': { action: 'showTemplates', params: [] },
      'list templates': { action: 'showTemplates', params: [] },
      'create template': { action: 'createTemplate', params: ['templateName', 'subject', 'body'] },
      'new template': { action: 'createTemplate', params: ['templateName', 'subject', 'body'] },
      'use template': { action: 'useTemplate', params: ['templateName'] },
      'apply template': { action: 'useTemplate', params: ['templateName'] },
      'delete template': { action: 'deleteTemplate', params: ['templateName'] },
      'remove template': { action: 'deleteTemplate', params: ['templateName'] },
      
      // Campaign Commands
      'create campaign': { action: 'createCampaign', params: ['campaignName', 'subject', 'templateId'] },
      'new campaign': { action: 'createCampaign', params: ['campaignName', 'subject', 'templateId'] },
      'send campaign': { action: 'sendCampaign', params: ['campaignId'] },
      'launch campaign': { action: 'sendCampaign', params: ['campaignId'] },
      'show campaigns': { action: 'showCampaigns', params: [] },
      'list campaigns': { action: 'showCampaigns', params: [] },
      'campaign stats': { action: 'campaignStats', params: ['campaignId'] },
      'campaign analytics': { action: 'campaignStats', params: ['campaignId'] },
      'pause campaign': { action: 'pauseCampaign', params: ['campaignId'] },
      'resume campaign': { action: 'resumeCampaign', params: ['campaignId'] },
      
      // Analytics Commands
      'email analytics': { action: 'emailAnalytics', params: [] },
      'email stats': { action: 'emailStats', params: [] },
      'email metrics': { action: 'emailMetrics', params: [] },
      'email performance': { action: 'emailPerformance', params: [] },
      'email report': { action: 'emailReport', params: [] },
      'client email history': { action: 'clientEmailHistory', params: ['clientId'] },
      'email activity': { action: 'emailActivity', params: [] },
      
      // Automation Commands
      'schedule email': { action: 'scheduleEmail', params: ['recipient', 'subject', 'message', 'scheduledTime'] },
      'schedule message': { action: 'scheduleEmail', params: ['recipient', 'subject', 'message', 'scheduledTime'] },
      'create automation': { action: 'createAutomation', params: ['ruleName', 'conditions', 'actions'] },
      'automation rules': { action: 'showAutomationRules', params: [] },
      'show automations': { action: 'showAutomationRules', params: [] },
      'follow up reminders': { action: 'showFollowUps', params: [] },
      'show follow ups': { action: 'showFollowUps', params: [] },
      
      // Business Integration Commands
      'send invoice email': { action: 'sendInvoiceEmail', params: ['invoiceId', 'recipient'] },
      'email invoice': { action: 'sendInvoiceEmail', params: ['invoiceId', 'recipient'] },
      'send quote email': { action: 'sendQuoteEmail', params: ['quoteId', 'recipient'] },
      'email quote': { action: 'sendQuoteEmail', params: ['quoteId', 'recipient'] },
      'payment reminder': { action: 'sendPaymentReminder', params: ['invoiceId'] },
      'send reminder': { action: 'sendPaymentReminder', params: ['invoiceId'] },
      
      // Settings Commands
      'email settings': { action: 'showEmailSettings', params: [] },
      'configure email': { action: 'showEmailSettings', params: [] },
      'email signature': { action: 'manageSignature', params: [] },
      'update signature': { action: 'manageSignature', params: [] },
      'notification settings': { action: 'notificationSettings', params: [] },
      'email notifications': { action: 'notificationSettings', params: [] }
    };

    this.searchCommands = {
      'search': { action: 'searchEmails', params: ['query'] },
      'find': { action: 'searchEmails', params: ['query'] },
      'look for': { action: 'searchEmails', params: ['query'] },
      'locate': { action: 'searchEmails', params: ['query'] }
    };

    this.helpCommands = {
      'email help': { action: 'emailHelp', params: [] },
      'help with email': { action: 'emailHelp', params: [] },
      'email commands': { action: 'emailHelp', params: [] },
      'what can I do with email': { action: 'emailHelp', params: [] },
      'email features': { action: 'emailHelp', params: [] },
      'how to send email': { action: 'emailHelp', params: ['send'] },
      'how to compose email': { action: 'emailHelp', params: ['compose'] },
      'how to search emails': { action: 'emailHelp', params: ['search'] },
      'template help': { action: 'emailHelp', params: ['templates'] },
      'campaign help': { action: 'emailHelp', params: ['campaigns'] },
      'automation help': { action: 'emailHelp', params: ['automation'] }
    };
  }

  /**
   * Get all email commands
   */
  getAllCommands() {
    return {
      ...this.emailCommands,
      ...this.searchCommands,
      ...this.helpCommands
    };
  }

  /**
   * Process email command and extract parameters
   */
  processCommand(command: string, context: any = {}) {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Direct command match
    if (this.emailCommands[normalizedCommand]) {
      return this.extractParameters(normalizedCommand, command, this.emailCommands[normalizedCommand]);
    }

    // Search for partial matches
    const partialMatch = this.findPartialMatch(normalizedCommand);
    if (partialMatch) {
      return this.extractParameters(partialMatch.command, command, partialMatch.config);
    }

    // Check for search commands with query
    const searchMatch = this.findSearchMatch(normalizedCommand);
    if (searchMatch) {
      return searchMatch;
    }

    // Check for help commands
    const helpMatch = this.findHelpMatch(normalizedCommand);
    if (helpMatch) {
      return helpMatch;
    }

    return null;
  }

  /**
   * Find partial command matches
   */
  findPartialMatch(command: string): { command: string; config: { action: string; params: string[] } } | null {
    const commands = Object.keys(this.emailCommands);
    
    for (const cmd of commands) {
      if (command.includes(cmd) || cmd.includes(command)) {
        return {
          command: cmd,
          config: this.emailCommands[cmd]
        };
      }
    }

    // Check for specific patterns
    if (command.includes('email') && command.includes('to')) {
      return {
        command: 'send email to',
        config: this.emailCommands['send email to']
      };
    }

    if (command.includes('compose') || command.includes('write')) {
      return {
        command: 'compose email',
        config: this.emailCommands['compose email']
      };
    }

    if (command.includes('search') || command.includes('find')) {
      return {
        command: 'search emails',
        config: this.emailCommands['search emails']
      };
    }

    return null;
  }

  /**
   * Find search command matches
   */
  findSearchMatch(command: string): { action: string; params: EmailParams; confidence: number } | null {
    const searchTerms = ['search', 'find', 'look for', 'locate'];
    
    for (const term of searchTerms) {
      if (command.includes(term)) {
        const query = command.replace(term, '').replace('emails', '').replace('email', '').trim();
        if (query) {
          return {
            action: 'searchEmails',
            params: { query },
            confidence: 0.8
          };
        }
      }
    }

    return null;
  }

  /**
   * Find help command matches
   */
  findHelpMatch(command: string): { action: string; params: EmailParams; confidence: number } | null {
    if (command.includes('help') && command.includes('email')) {
      return {
        action: 'emailHelp',
        params: {},
        confidence: 0.9
      };
    }

    return null;
  }

  /**
   * Extract parameters from command
   */
  extractParameters(matchedCommand: string, originalCommand: string, config: { action: string; params: string[] }) {
    const params: EmailParams = {};
    const words = originalCommand.toLowerCase().split(' ');
    
    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = originalCommand.match(emailRegex) || [];
    
    // Extract quoted strings
    const quotedRegex = /"([^"]*)"/g;
    const quotedStrings: string[] = [];
    let match;
    while ((match = quotedRegex.exec(originalCommand)) !== null) {
      if (match[1] !== undefined) {
        quotedStrings.push(match[1]);
      }
    }

    // Parameter extraction based on action
    switch (config.action) {
      case 'send':
        if (emails.length > 0) params.recipient = emails[0];
        if (quotedStrings.length > 0) {
          params.subject = quotedStrings[0];
          if (quotedStrings.length > 1) params.message = quotedStrings[1];
        }
        break;

      case 'searchEmails':
      case 'searchByFrom':
      case 'searchBySubject':
        const searchQuery = this.extractSearchQuery(originalCommand, matchedCommand);
        if (searchQuery) params.query = searchQuery;
        break;

      case 'createFolder':
      case 'deleteFolder':
        const folderName = this.extractFolderName(originalCommand, matchedCommand);
        if (folderName) params.folderName = folderName;
        break;

      case 'createTemplate':
        if (quotedStrings.length > 0) {
          params.templateName = quotedStrings[0];
          if (quotedStrings.length > 1) params.subject = quotedStrings[1];
          if (quotedStrings.length > 2) params.body = quotedStrings[2];
        }
        break;

      case 'scheduleEmail':
        if (emails.length > 0) params.recipient = emails[0];
        if (quotedStrings.length > 0) {
          params.subject = quotedStrings[0];
          if (quotedStrings.length > 1) params.message = quotedStrings[1];
        }
        params.scheduledTime = this.extractScheduledTime(originalCommand);
        break;

      case 'sendInvoiceEmail':
      case 'sendQuoteEmail':
        if (emails.length > 0) params.recipient = emails[0];
        const idMatch = originalCommand.match(/\b(invoice|quote)\s+(\w+)/i);
        if (idMatch) {
          if (config.action === 'sendInvoiceEmail') {
            params.invoiceId = idMatch[2];
          } else {
            params.quoteId = idMatch[2];
          }
        }
        break;
    }

    return {
      action: config.action,
      params,
      confidence: 0.9
    };
  }

  /**
   * Extract search query from command
   */
  extractSearchQuery(command: string, matchedCommand: string): string | undefined {
    const cleanCommand = command.toLowerCase()
      .replace(matchedCommand, '')
      .replace(/^(for|from|about|with)\s+/, '')
      .trim();
    
    return cleanCommand || undefined;
  }

  /**
   * Extract folder name from command
   */
  extractFolderName(command: string, matchedCommand: string): string | undefined {
    const cleanCommand = command.toLowerCase()
      .replace(matchedCommand, '')
      .replace(/^(called|named)\s+/, '')
      .trim();
    
    return cleanCommand || undefined;
  }

  /**
   * Extract scheduled time from command
   */
  extractScheduledTime(command: string): string | undefined {
    const timePatterns = [
      /at (\d{1,2}:\d{2})/i,
      /in (\d+) (minutes?|hours?|days?)/i,
      /(tomorrow|today|tonight)/i,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    ];

    for (const pattern of timePatterns) {
      const match = command.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  /**
   * Execute email command
   */
  async executeCommand(action: string, params: EmailParams, context: any = {}) {
    const userId = context.userId || 'default';

    try {
      switch (action) {
        case 'compose':
          return await this.handleComposeEmail(params, context);

        case 'send':
          return await this.handleSendEmail(params, userId);

        case 'reply':
          return await this.handleReplyEmail(params, context);

        case 'forward':
          return await this.handleForwardEmail(params, context);

        case 'checkEmails':
        case 'showEmails':
          return await this.handleShowEmails(params, userId);

        case 'markRead':
          return await this.handleMarkRead(params, userId, context);

        case 'markUnread':
          return await this.handleMarkUnread(params, userId, context);

        case 'starEmail':
          return await this.handleStarEmail(params, userId, context);

        case 'unstarEmail':
          return await this.handleUnstarEmail(params, userId, context);

        case 'deleteEmail':
          return await this.handleDeleteEmail(params, userId, context);

        case 'archiveEmail':
          return await this.handleArchiveEmail(params, userId, context);

        case 'searchEmails':
          return await this.handleSearchEmails(params, userId);

        case 'searchByFrom':
          return await this.handleSearchByFrom(params, userId);

        case 'searchBySubject':
          return await this.handleSearchBySubject(params, userId);

        case 'searchAttachments':
          return await this.handleSearchAttachments(params, userId);

        case 'showFolders':
          return await this.handleShowFolders(params, userId);

        case 'createFolder':
          return await this.handleCreateFolder(params, userId);

        case 'deleteFolder':
          return await this.handleDeleteFolder(params, userId);

        case 'moveToFolder':
          return await this.handleMoveToFolder(params, userId);

        case 'showTemplates':
          return await this.handleShowTemplates(params, userId);

        case 'createTemplate':
          return await this.handleCreateTemplate(params, userId);

        case 'useTemplate':
          return await this.handleUseTemplate(params, context);

        case 'deleteTemplate':
          return await this.handleDeleteTemplate(params, userId);

        case 'createCampaign':
          return await this.handleCreateCampaign(params, userId);

        case 'sendCampaign':
          return await this.handleSendCampaign(params, userId);

        case 'showCampaigns':
          return await this.handleShowCampaigns(params, userId);

        case 'campaignStats':
          return await this.handleCampaignStats(params, userId);

        case 'pauseCampaign':
          return await this.handlePauseCampaign(params, userId);

        case 'resumeCampaign':
          return await this.handleResumeCampaign(params, userId);

        case 'emailAnalytics':
          return await this.handleEmailAnalytics(params, userId);

        case 'emailStats':
          return await this.handleEmailStats(params, userId);

        case 'emailMetrics':
          return await this.handleEmailMetrics(params, userId);

        case 'emailPerformance':
          return await this.handleEmailPerformance(params, userId);

        case 'emailReport':
          return await this.handleEmailReport(params, userId);

        case 'clientEmailHistory':
          return await this.handleClientEmailHistory(params, userId);

        case 'emailActivity':
          return await this.handleEmailActivity(params, userId);

        case 'scheduleEmail':
          return await this.handleScheduleEmail(params, userId);

        case 'createAutomation':
          return await this.handleCreateAutomation(params, userId);

        case 'showAutomationRules':
          return await this.handleShowAutomationRules(params, userId);

        case 'showFollowUps':
          return await this.handleShowFollowUps(params, userId);

        case 'sendInvoiceEmail':
          return await this.handleSendInvoiceEmail(params, userId);

        case 'sendQuoteEmail':
          return await this.handleSendQuoteEmail(params, userId);

        case 'sendPaymentReminder':
          return await this.handleSendPaymentReminder(params, userId);

        case 'showEmailSettings':
          return await this.handleShowEmailSettings(params, context);

        case 'manageSignature':
          return await this.handleManageSignature(params, context);

        case 'notificationSettings':
          return await this.handleNotificationSettings(params, context);

        case 'emailHelp':
          return await this.handleEmailHelp(params, context);

        default:
          return {
            success: false,
            message: `Unknown email action: ${action}`,
            action: 'error'
          };
      }
    } catch (error: unknown) {
      console.error('Email command execution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Error executing email command: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  // Email Action Handlers

  async handleComposeEmail(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening email composer...',
      action: 'navigate',
      data: {
        route: '/email/compose',
        params: params
      }
    };
  }

  async handleSendEmail(params: EmailParams, userId: string) {
    if (!params.recipient) {
      return {
        success: false,
        message: 'Please specify a recipient email address',
        action: 'input_required',
        data: { field: 'recipient' }
      };
    }

    const emailData = {
      to: [params.recipient],
      subject: params.subject || 'No Subject',
      body: params.message || '',
      priority: 'normal'
    };

    try {
      const result = await emailService.sendEmail(userId, emailData);
      return {
        success: true,
        message: `Email sent successfully to ${params.recipient}`,
        action: 'email_sent',
        data: result
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleReplyEmail(params: EmailParams, context: any) {
    if (!context.currentEmail) {
      return {
        success: false,
        message: 'No email selected to reply to',
        action: 'error'
      };
    }

    return {
      success: true,
      message: 'Opening reply composer...',
      action: 'navigate',
      data: {
        route: '/email/compose',
        params: {
          type: 'reply',
          originalEmailId: context.currentEmail.id,
          message: params.message
        }
      }
    };
  }

  async handleForwardEmail(params: EmailParams, context: any) {
    if (!context.currentEmail) {
      return {
        success: false,
        message: 'No email selected to forward',
        action: 'error'
      };
    }

    return {
      success: true,
      message: 'Opening forward composer...',
      action: 'navigate',
      data: {
        route: '/email/compose',
        params: {
          type: 'forward',
          originalEmailId: context.currentEmail.id,
          recipient: params.recipient
        }
      }
    };
  }

  async handleShowEmails(params: EmailParams, userId: string) {
    try {
      const result = await emailService.fetchEmails(userId, {
        limit: 20,
        status: 'all'
      });

      if (result.success) {
        return {
          success: true,
          message: `Found ${result.data.length} emails`,
          action: 'show_data',
          data: {
            type: 'emails',
            items: result.data,
            total: result.total,
            hasMore: result.hasMore,
            route: '/email'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch emails: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch emails: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleMarkRead(params: EmailParams, userId: string, context: any = {}) {
    if (!params.emailId && !context.currentEmail) {
      return {
        success: false,
        message: 'Please specify which email to mark as read',
        action: 'input_required',
        data: { field: 'emailId' }
      };
    }

    const emailId = params.emailId || context.currentEmail?.id;

    try {
      const result = await emailService.markAsRead(emailId, userId, true);
      
      if (result.success) {
        return {
          success: true,
          message: 'Email marked as read',
          action: 'email_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to mark email as read: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to mark email as read: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleMarkUnread(params: EmailParams, userId: string, context: any = {}) {
    if (!params.emailId && !context.currentEmail) {
      return {
        success: false,
        message: 'Please specify which email to mark as unread',
        action: 'input_required',
        data: { field: 'emailId' }
      };
    }

    const emailId = params.emailId || context.currentEmail?.id;

    try {
      const result = await emailService.markAsRead(emailId, userId, false);
      
      if (result.success) {
        return {
          success: true,
          message: 'Email marked as unread',
          action: 'email_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to mark email as unread: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to mark email as unread: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleStarEmail(params: EmailParams, userId: string, context: any = {}) {
    if (!params.emailId && !context.currentEmail) {
      return {
        success: false,
        message: 'Please specify which email to star',
        action: 'input_required',
        data: { field: 'emailId' }
      };
    }

    const emailId = params.emailId || context.currentEmail?.id;

    try {
      const result = await emailService.starEmail(emailId, userId, true);
      
      if (result.success) {
        return {
          success: true,
          message: 'Email starred',
          action: 'email_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to star email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to star email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleUnstarEmail(params: EmailParams, userId: string, context: any = {}) {
    if (!params.emailId && !context.currentEmail) {
      return {
        success: false,
        message: 'Please specify which email to unstar',
        action: 'input_required',
        data: { field: 'emailId' }
      };
    }

    const emailId = params.emailId || context.currentEmail?.id;

    try {
      const result = await emailService.starEmail(emailId, userId, false);
      
      if (result.success) {
        return {
          success: true,
          message: 'Email unstarred',
          action: 'email_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to unstar email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to unstar email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleDeleteEmail(params: EmailParams, userId: string, context: any = {}) {
    if (!params.emailId && !context.currentEmail) {
      return {
        success: false,
        message: 'Please specify which email to delete',
        action: 'input_required',
        data: { field: 'emailId' }
      };
    }

    const emailId = params.emailId || context.currentEmail?.id;

    try {
      const result = await emailService.deleteEmail(emailId, userId, false);
      
      if (result.success) {
        return {
          success: true,
          message: 'Email deleted',
          action: 'email_deleted'
        };
      } else {
        return {
          success: false,
          message: `Failed to delete email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to delete email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleArchiveEmail(params: EmailParams, userId: string, context: any = {}) {
    if (!params.emailId && !context.currentEmail) {
      return {
        success: false,
        message: 'Please specify which email to archive',
        action: 'input_required',
        data: { field: 'emailId' }
      };
    }

    const emailId = params.emailId || context.currentEmail?.id;

    try {
      const result = await emailService.moveToFolder(emailId, userId, 'archive');
      
      if (result.success) {
        return {
          success: true,
          message: 'Email archived',
          action: 'email_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to archive email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to archive email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSearchEmails(params: EmailParams, userId: string) {
    if (!params.query) {
      return {
        success: false,
        message: 'Please specify what to search for',
        action: 'input_required',
        data: { field: 'query' }
      };
    }

    try {
      const result = await emailSearchService.searchEmails(userId, {
        query: params.query,
        limit: 20
      });

      if (result.success) {
        const emails = result.data || [];
        return {
          success: true,
          message: `Found ${emails.length} emails matching "${params.query}"`,
          action: 'show_data',
          data: {
            type: 'search_results',
            query: params.query,
            items: emails,
            route: '/email/search'
          }
        };
      } else {
        return {
          success: false,
          message: `Search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Search failed: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSearchByFrom(params: EmailParams, userId: string) {
    if (!params.sender) {
      return {
        success: false,
        message: 'Please specify the sender to search for',
        action: 'input_required',
        data: { field: 'sender' }
      };
    }

    try {
      const result = await emailSearchService.searchEmails(userId, {
        from: params.sender,
        limit: 20
      });

      if (result.success) {
        const emails = result.data || [];
        return {
          success: true,
          message: `Found ${emails.length} emails from ${params.sender}`,
          action: 'show_data',
          data: {
            type: 'search_results',
            query: `from:${params.sender}`,
            items: emails,
            route: '/email/search'
          }
        };
      } else {
        return {
          success: false,
          message: `Search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Search failed: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSearchBySubject(params: EmailParams, userId: string) {
    if (!params.subject) {
      return {
        success: false,
        message: 'Please specify the subject to search for',
        action: 'input_required',
        data: { field: 'subject' }
      };
    }

    try {
      const result = await emailSearchService.searchEmails(userId, {
        subject: params.subject,
        limit: 20
      });

      if (result.success) {
        const emails = result.data || [];
        return {
          success: true,
          message: `Found ${emails.length} emails with subject containing "${params.subject}"`,
          action: 'show_data',
          data: {
            type: 'search_results',
            query: `subject:${params.subject}`,
            items: emails,
            route: '/email/search'
          }
        };
      } else {
        return {
          success: false,
          message: `Search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Search failed: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSearchAttachments(params: EmailParams, userId: string) {
    if (!params.query) {
      return {
        success: false,
        message: 'Please specify what attachment to search for',
        action: 'input_required',
        data: { field: 'query' }
      };
    }

    try {
      const result = await emailSearchService.searchAttachments(userId, {
        query: params.query,
        limit: 20
      });

      if (result.success) {
        const attachments = result.data || [];
        return {
          success: true,
          message: `Found ${attachments.length} emails with attachments matching "${params.query}"`,
          action: 'show_data',
          data: {
            type: 'search_results',
            query: `attachment:${params.query}`,
            items: attachments,
            route: '/email/search'
          }
        };
      } else {
        return {
          success: false,
          message: `Attachment search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Attachment search failed: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleShowFolders(params: EmailParams, userId: string) {
    try {
      const result = await emailService.getFolders(userId);
      
      if (result.success) {
        const folders = result.data || [];
        return {
          success: true,
          message: `Found ${folders.length} email folders`,
          action: 'show_data',
          data: {
            type: 'folders',
            items: folders,
            route: '/email/folders'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch folders: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch folders: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleCreateFolder(params: EmailParams, userId: string) {
    if (!params.folderName) {
      return {
        success: false,
        message: 'Please specify a folder name',
        action: 'input_required',
        data: { field: 'folderName' }
      };
    }

    try {
      const result = await emailService.createFolder(userId, {
        name: params.folderName,
        type: 'custom'
      });

      if (result.success) {
        return {
          success: true,
          message: `Folder "${params.folderName}" created successfully`,
          action: 'folder_created',
          data: result.data
        };
      } else {
        return {
          success: false,
          message: `Failed to create folder: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to create folder: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleDeleteFolder(params: EmailParams, userId: string) {
    if (!params.folderName) {
      return {
        success: false,
        message: 'Please specify which folder to delete',
        action: 'input_required',
        data: { field: 'folderName' }
      };
    }

    try {
      // Find folder by name
      const foldersResult = await emailService.getFolders(userId);
      
      if (!foldersResult.success) {
        return {
          success: false,
          message: `Failed to fetch folders: ${String(foldersResult.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }

      const folders = foldersResult.data || [];
      const folder = folders.find((f: any) => f.name.toLowerCase() === params.folderName!.toLowerCase());

      if (!folder) {
        return {
          success: false,
          message: `Folder "${params.folderName}" not found`,
          action: 'error'
        };
      }

      const deleteResult = await emailService.deleteFolder(folder.id, userId);
      
      if (deleteResult.success) {
        return {
          success: true,
          message: `Folder "${params.folderName}" deleted successfully`,
          action: 'folder_deleted'
        };
      } else {
        return {
          success: false,
          message: `Failed to delete folder: ${String(deleteResult.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to delete folder: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleMoveToFolder(params: EmailParams, userId: string) {
    if (!params.emailId || !params.folderName) {
      return {
        success: false,
        message: 'Please specify both email ID and folder name',
        action: 'input_required',
        data: { fields: ['emailId', 'folderName'] }
      };
    }

    try {
      // Find folder by name
      const foldersResult = await emailService.getFolders(userId);
      
      if (!foldersResult.success) {
        return {
          success: false,
          message: `Failed to fetch folders: ${String(foldersResult.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }

      const folders = foldersResult.data || [];
      const folder = folders.find((f: any) => f.name.toLowerCase() === params.folderName!.toLowerCase());

      if (!folder) {
        return {
          success: false,
          message: `Folder "${params.folderName}" not found`,
          action: 'error'
        };
      }

      const moveResult = await emailService.moveToFolder(params.emailId, userId, folder.id);
      
      if (moveResult.success) {
        return {
          success: true,
          message: `Email moved to "${params.folderName}" folder`,
          action: 'email_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to move email: ${String(moveResult.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to move email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleShowTemplates(params: EmailParams, userId: string) {
    try {
      const result = await emailTemplateService.getTemplates(null);
      
      if (result.success) {
        const templates = result.data || [];
        return {
          success: true,
          message: `Found ${templates.length} email templates`,
          action: 'show_data',
          data: {
            type: 'templates',
            items: templates,
            route: '/email/templates'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch templates: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch templates: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleCreateTemplate(params: EmailParams, userId: string) {
    if (!params.templateName) {
      return {
        success: false,
        message: 'Please specify a template name',
        action: 'input_required',
        data: { field: 'templateName' }
      };
    }

    try {
      const templateData = {
        name: params.templateName,
        subject: params.subject || 'Template Subject',
        body: params.body || 'Template Body',
        category: 'custom',
        variables: [],
        isActive: true,
        userId: userId
      };

      const result = await emailTemplateService.saveTemplate(templateData);

      if (result.success) {
        return {
          success: true,
          message: `Template "${params.templateName}" created successfully`,
          action: 'template_created',
          data: result.data
        };
      } else {
        return {
          success: false,
          message: `Failed to create template: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to create template: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleUseTemplate(params: EmailParams, context: any) {
    if (!params.templateName) {
      return {
        success: false,
        message: 'Please specify which template to use',
        action: 'input_required',
        data: { field: 'templateName' }
      };
    }

    return {
      success: true,
      message: `Opening composer with template "${params.templateName}"...`,
      action: 'navigate',
      data: {
        route: '/email/compose',
        params: {
          templateName: params.templateName
        }
      }
    };
  }

  async handleDeleteTemplate(params: EmailParams, userId: string) {
    if (!params.templateName) {
      return {
        success: false,
        message: 'Please specify which template to delete',
        action: 'input_required',
        data: { field: 'templateName' }
      };
    }

    try {
      // Find template by name
      const templatesResult = await emailTemplateService.getTemplates(null);
      
      if (!templatesResult.success) {
        return {
          success: false,
          message: `Failed to fetch templates: ${String(templatesResult.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }

      const templates = templatesResult.data || [];
      const template = templates.find((t: any) => t.name.toLowerCase() === params.templateName!.toLowerCase());

      if (!template) {
        return {
          success: false,
          message: `Template "${params.templateName}" not found`,
          action: 'error'
        };
      }

      const deleteResult = await emailTemplateService.deleteTemplate(template.id);
      
      if (deleteResult.success) {
        return {
          success: true,
          message: `Template "${params.templateName}" deleted successfully`,
          action: 'template_deleted'
        };
      } else {
        return {
          success: false,
          message: `Failed to delete template: ${String(deleteResult.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to delete template: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleCreateCampaign(params: EmailParams, userId: string) {
    if (!params.campaignName) {
      return {
        success: false,
        message: 'Please specify a campaign name',
        action: 'input_required',
        data: { field: 'campaignName' }
      };
    }

    try {
      const campaignData = {
        name: params.campaignName,
        subject: params.subject || 'Campaign Subject',
        templateId: params.templateId || null,
        recipients: [],
        status: 'draft',
        userId: userId
      };

      const result = await emailCampaignService.createCampaign(campaignData);

      if (result.success) {
        return {
          success: true,
          message: `Campaign "${params.campaignName}" created successfully`,
          action: 'campaign_created',
          data: result.data
        };
      } else {
        return {
          success: false,
          message: `Failed to create campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to create campaign: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSendCampaign(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to send',
        action: 'input_required',
        data: { field: 'campaignId' }
      };
    }

    try {
      const result = await emailCampaignService.sendCampaign(params.campaignId);

      if (result.success) {
        return {
          success: true,
          message: `Campaign sent successfully`,
          action: 'campaign_sent',
          data: result.data
        };
      } else {
        return {
          success: false,
          message: `Failed to send campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send campaign: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleShowCampaigns(params: EmailParams, userId: string) {
    try {
      const result = await emailCampaignService.getCampaigns(userId);

      if (result.success) {
        const campaigns = result.data || [];
        return {
          success: true,
          message: `Found ${campaigns.length} email campaigns`,
          action: 'show_data',
          data: {
            type: 'campaigns',
            items: campaigns,
            route: '/email/campaigns'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch campaigns: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch campaigns: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleCampaignStats(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to get stats for',
        action: 'input_required',
        data: { field: 'campaignId' }
      };
    }

    try {
      const result = await emailCampaignService.getCampaignStats(params.campaignId);

      if (result.success) {
        return {
          success: true,
          message: `Campaign statistics retrieved`,
          action: 'show_data',
          data: {
            type: 'campaign_stats',
            stats: result.data,
            route: '/email/campaigns'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to get campaign stats: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get campaign stats: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handlePauseCampaign(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to pause',
        action: 'input_required',
        data: { field: 'campaignId' }
      };
    }

    try {
      const result = await emailCampaignService.pauseCampaign(params.campaignId);

      if (result.success) {
        return {
          success: true,
          message: `Campaign paused successfully`,
          action: 'campaign_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to pause campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to pause campaign: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleResumeCampaign(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to resume',
        action: 'input_required',
        data: { field: 'campaignId' }
      };
    }

    try {
      const result = await emailCampaignService.resumeCampaign(params.campaignId);

      if (result.success) {
        return {
          success: true,
          message: `Campaign resumed successfully`,
          action: 'campaign_updated'
        };
      } else {
        return {
          success: false,
          message: `Failed to resume campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to resume campaign: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleEmailAnalytics(params: EmailParams, userId: string) {
    try {
      const result = await emailAnalyticsService.getDashboardAnalytics(userId);

      if (result.success) {
        return {
          success: true,
          message: 'Email analytics retrieved',
          action: 'show_data',
          data: {
            type: 'analytics',
            analytics: result.data,
            route: '/email/analytics'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to get email analytics: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email analytics: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleEmailStats(params: EmailParams, userId: string) {
    try {
      const result = await emailAnalyticsService.getEmailStats(userId);

      if (result.success) {
        return {
          success: true,
          message: 'Email statistics retrieved',
          action: 'show_data',
          data: {
            type: 'stats',
            stats: result.data,
            route: '/email/analytics'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to get email stats: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email stats: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleEmailMetrics(params: EmailParams, userId: string) {
    try {
      const result = await emailAnalyticsService.getActivityMetrics(userId);

      if (result.success) {
        return {
          success: true,
          message: 'Email metrics retrieved',
          action: 'show_data',
          data: {
            type: 'metrics',
            metrics: result.data,
            route: '/email/analytics'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to get email metrics: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email metrics: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleEmailPerformance(params: EmailParams, userId: string) {
    try {
      const result = await emailAnalyticsService.getPerformanceMetrics(userId);

      if (result.success) {
        return {
          success: true,
          message: 'Email performance metrics retrieved',
          action: 'show_data',
          data: {
            type: 'performance',
            performance: result.data,
            route: '/email/analytics'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to get email performance: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email performance: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleEmailReport(params: EmailParams, userId: string) {
    try {
      const result = await emailAnalyticsService.generateEmailReport(userId);

      if (result.success) {
        return {
          success: true,
          message: 'Email report generated',
          action: 'show_data',
          data: {
            type: 'report',
            report: result.data,
            route: '/email/reports'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to generate email report: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to generate email report: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleClientEmailHistory(params: EmailParams, userId: string) {
    if (!params.clientId) {
      return {
        success: false,
        message: 'Please specify a client ID',
        action: 'input_required',
        data: { field: 'clientId' }
      };
    }

    try {
      const result = await emailService.getClientEmailHistory(userId, params.clientId);

      if (result.success) {
        return {
          success: true,
          message: `Client email history retrieved`,
          action: 'show_data',
          data: {
            type: 'client_history',
            history: result.data,
            clientId: params.clientId,
            route: '/email/clients'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to get client email history: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get client email history: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleEmailActivity(params: EmailParams, userId: string) {
    try {
      const result = await emailAnalyticsService.getActivityMetrics(userId);

      if (result.success) {
        return {
          success: true,
          message: 'Email activity retrieved',
          action: 'show_data',
          data: {
            type: 'activity',
            activity: result.data,
            route: '/email/activity'
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to get email activity: ${String(result.error ?? 'Unknown error')}`,
          action: 'error'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email activity: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleScheduleEmail(params: EmailParams, userId: string) {
    if (!params.recipient || !params.scheduledTime) {
      return {
        success: false,
        message: 'Please specify recipient and scheduled time',
        action: 'input_required',
        data: { fields: ['recipient', 'scheduledTime'] }
      };
    }

    try {
      const emailData = {
        to: [params.recipient],
        subject: params.subject || 'Scheduled Email',
        body: params.message || '',
        priority: 'normal'
      };

      const result = await emailAutomationService.scheduleEmail(
        emailData,
        new Date(params.scheduledTime),
        userId
      );

      return {
        success: true,
        message: `Email scheduled for ${params.scheduledTime}`,
        action: 'email_scheduled',
        data: result
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to schedule email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleCreateAutomation(params: EmailParams, userId: string) {
    if (!params.ruleName) {
      return {
        success: false,
        message: 'Please specify an automation rule name',
        action: 'input_required',
        data: { field: 'ruleName' }
      };
    }

    return {
      success: true,
      message: 'Opening automation rule creator...',
      action: 'navigate',
      data: {
        route: '/email/automation',
        params: {
          action: 'create',
          ruleName: params.ruleName
        }
      }
    };
  }

  async handleShowAutomationRules(params: EmailParams, userId: string) {
    try {
      const rules = await emailAutomationService.getAutomationRules(userId);

      return {
        success: true,
        message: `Found ${rules.length} automation rules`,
        action: 'show_data',
        data: {
          type: 'automation_rules',
          items: rules,
          route: '/email/automation'
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch automation rules: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleShowFollowUps(params: EmailParams, userId: string) {
    try {
      const followUps = await emailAutomationService.getFollowUpReminders(userId);

      return {
        success: true,
        message: `Found ${followUps.length} follow-up reminders`,
        action: 'show_data',
        data: {
          type: 'follow_ups',
          items: followUps,
          route: '/email/follow-ups'
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch follow-ups: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSendInvoiceEmail(params: EmailParams, userId: string) {
    if (!params.invoiceId || !params.recipient) {
      return {
        success: false,
        message: 'Please specify invoice ID and recipient',
        action: 'input_required',
        data: { fields: ['invoiceId', 'recipient'] }
      };
    }

    try {
      const result = await emailService.sendInvoiceEmail(
        userId,
        params.invoiceId,
        params.recipient
      );

      return {
        success: true,
        message: `Invoice email sent to ${params.recipient}`,
        action: 'email_sent',
        data: result
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send invoice email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSendQuoteEmail(params: EmailParams, userId: string) {
    if (!params.quoteId || !params.recipient) {
      return {
        success: false,
        message: 'Please specify quote ID and recipient',
        action: 'input_required',
        data: { fields: ['quoteId', 'recipient'] }
      };
    }

    try {
      const result = await emailService.sendQuoteEmail(
        userId,
        params.quoteId,
        params.recipient
      );

      return {
        success: true,
        message: `Quote email sent to ${params.recipient}`,
        action: 'email_sent',
        data: result
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send quote email: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleSendPaymentReminder(params: EmailParams, userId: string) {
    if (!params.invoiceId) {
      return {
        success: false,
        message: 'Please specify an invoice ID',
        action: 'input_required',
        data: { field: 'invoiceId' }
      };
    }

    try {
      // This would integrate with the invoice service
      const result = await emailService.sendInvoiceEmail(
        userId,
        params.invoiceId,
        null, // recipient will be determined from invoice
        'payment_reminder'
      );

      return {
        success: true,
        message: `Payment reminder sent`,
        action: 'email_sent',
        data: result
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send payment reminder: ${errorMessage}`,
        action: 'error'
      };
    }
  }

  async handleShowEmailSettings(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening email settings...',
      action: 'navigate',
      data: {
        route: '/email/settings'
      }
    };
  }

  async handleManageSignature(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening signature manager...',
      action: 'navigate',
      data: {
        route: '/email/settings/signature'
      }
    };
  }

  async handleNotificationSettings(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening notification settings...',
      action: 'navigate',
      data: {
        route: '/email/settings/notifications'
      }
    };
  }

  async handleEmailHelp(params: EmailParams, context: any) {
    const helpTopics = {
      send: 'To send an email, say "send email to [recipient]" or "email [recipient] about [subject]"',
      compose: 'To compose an email, say "compose email" or "write new email"',
      search: 'To search emails, say "search emails for [query]" or "find emails from [sender]"',
      templates: 'To manage templates, say "show templates", "create template", or "use template [name]"',
      campaigns: 'To manage campaigns, say "show campaigns", "create campaign", or "send campaign [id]"',
      automation: 'To manage automation, say "show automation rules" or "create automation"'
    };

    const topic = params[0];
    let helpMessage = 'Email Voice Commands:\n\n';

    if (topic && helpTopics[topic]) {
      helpMessage += helpTopics[topic];
    } else {
      helpMessage += `Available commands:
• Compose: "compose email", "write email"
• Send: "send email to [recipient]", "email [recipient]"
• Search: "search emails", "find emails from [sender]"
• Manage: "mark as read", "star email", "delete email"
• Folders: "show folders", "create folder", "move to folder"
• Templates: "show templates", "create template", "use template"
• Campaigns: "show campaigns", "create campaign", "send campaign"
• Analytics: "email stats", "email analytics", "email report"
• Business: "send invoice email", "send quote email"
• Automation: "schedule email", "create automation"

Say "help with [topic]" for specific guidance.`;
    }

    return {
      success: true,
      message: helpMessage,
      action: 'show_help',
      data: {
        type: 'email_help',
        topic: topic
      }
    };
  }
}

// Create singleton instance
const emailCommandHandler = new EmailCommandHandler();

// Export the handler and its methods
export { emailCommandHandler };
export const allEmailCommands = emailCommandHandler.getAllCommands();
export const processEmailCommand = (command: string, context: any) => emailCommandHandler.processCommand(command, context);
export const executeEmailCommand = (action: string, params: EmailParams, context: any) => emailCommandHandler.executeCommand(action, params, context);