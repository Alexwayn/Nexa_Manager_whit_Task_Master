/* eslint-disable @typescript-eslint/no-explicit-any */
import { emailService } from '../features/email/services/emailService';
import { emailSearchService } from '../features/email/services/emailSearchService';
import { emailTemplateService } from '../features/email/services/emailTemplateService';
import { emailCampaignService } from '../features/email/services/emailCampaignService';
import { emailAnalyticsService } from '../features/email/services/emailAnalyticsService';
import { emailAutomationService } from '../features/email/services/emailAutomationService';

// Define the interface for email parameters
export interface EmailParams {
  [key: string]: any;
}

// Main class for handling email commands
class EmailCommandHandler {
  private static instance: EmailCommandHandler;

  private readonly commands: any = {
    'compose': { action: 'handleComposeEmail', aliases: ['new', 'write'] },
    'send': { action: 'handleSendEmail', aliases: ['send email', 'email'] },
    'reply': { action: 'handleReplyEmail', aliases: ['reply to'] },
    'forward': { action: 'handleForwardEmail', aliases: ['forward email'] },
    'show': { action: 'handleShowEmails', aliases: ['show emails', 'get emails', 'view emails'] },
    'read': { action: 'handleMarkRead', aliases: ['mark as read'] },
    'unread': { action: 'handleMarkUnread', aliases: ['mark as unread'] },
    'star': { action: 'handleStarEmail', aliases: ['star email'] },
    'unstar': { action: 'handleUnstarEmail', aliases: ['unstar email'] },
    'delete': { action: 'handleDeleteEmail', aliases: ['delete email', 'remove email'] },
    'archive': { action: 'handleArchiveEmail', aliases: ['archive email'] },
    'search': { action: 'handleSearchEmails', aliases: ['search emails', 'find emails'] },
    'search_from': { action: 'handleSearchByFrom', aliases: ['search from', 'find from'] },
    'search_subject': { action: 'handleSearchBySubject', aliases: ['search subject', 'find subject'] },
    'search_attachment': { action: 'handleSearchAttachments', aliases: ['search attachments', 'find attachments'] },
    'show_folders': { action: 'handleShowFolders', aliases: ['show folders', 'list folders'] },
    'create_folder': { action: 'handleCreateFolder', aliases: ['create folder', 'new folder'] },
    'delete_folder': { action: 'handleDeleteFolder', aliases: ['delete folder', 'remove folder'] },
    'move_to_folder': { action: 'handleMoveToFolder', aliases: ['move to folder'] },
    'show_templates': { action: 'handleShowTemplates', aliases: ['show templates', 'list templates'] },
    'create_template': { action: 'handleCreateTemplate', aliases: ['create template', 'new template'] },
    'use_template': { action: 'handleUseTemplate', aliases: ['use template'] },
    'delete_template': { action: 'handleDeleteTemplate', aliases: ['delete template', 'remove template'] },
    'create_campaign': { action: 'handleCreateCampaign', aliases: ['create campaign', 'new campaign'] },
    'send_campaign': { action: 'handleSendCampaign', aliases: ['send campaign'] },
    'show_campaigns': { action: 'handleShowCampaigns', aliases: ['show campaigns', 'list campaigns'] },
    'campaign_stats': { action: 'handleCampaignStats', aliases: ['campaign stats', 'campaign statistics'] },
    'pause_campaign': { action: 'handlePauseCampaign', aliases: ['pause campaign'] },
    'resume_campaign': { action: 'handleResumeCampaign', aliases: ['resume campaign'] },
    'analytics': { action: 'handleEmailAnalytics', aliases: ['email analytics'] },
    'stats': { action: 'handleEmailStats', aliases: ['email stats', 'email statistics'] },
    'metrics': { action: 'handleEmailMetrics', aliases: ['email metrics'] },
    'performance': { action: 'handleEmailPerformance', aliases: ['email performance'] },
    'report': { action: 'handleEmailReport', aliases: ['email report'] },
    'client_history': { action: 'handleClientEmailHistory', aliases: ['client email history'] },
    'activity': { action: 'handleEmailActivity', aliases: ['email activity'] },
    'schedule': { action: 'handleScheduleEmail', aliases: ['schedule email'] },
    'create_automation': { action: 'handleCreateAutomation', aliases: ['create automation', 'new automation'] },
    'show_automation': { action: 'handleShowAutomationRules', aliases: ['show automation', 'list automation'] },
    'show_follow_ups': { action: 'handleShowFollowUps', aliases: ['show follow ups', 'list follow ups'] },
    'send_invoice': { action: 'handleSendInvoiceEmail', aliases: ['send invoice', 'invoice email'] },
    'send_quote': { action: 'handleSendQuoteEmail', aliases: ['send quote', 'quote email'] },
    'send_reminder': { action: 'handleSendPaymentReminder', aliases: ['send reminder', 'payment reminder'] },
    'settings': { action: 'handleShowEmailSettings', aliases: ['email settings'] },
    'signature': { action: 'handleManageSignature', aliases: ['manage signature'] },
    'notifications': { action: 'handleNotificationSettings', aliases: ['notification settings'] },
    'help': { action: 'handleEmailHelp', aliases: ['email help'] },
  };

  private constructor() {}

  public static getInstance(): EmailCommandHandler {
    if (!EmailCommandHandler.instance) {
      EmailCommandHandler.instance = new EmailCommandHandler();
    }
    return EmailCommandHandler.instance;
  }

  public getAllCommands() {
    return this.commands;
  }

  public async processCommand(command: string, context: any) {
    const { action, params } = this.findCommandAction(command);

    if (action && typeof this[action] === 'function') {
      return this[action](params, context);
    } else {
      return {
        success: false,
        message: `Unknown command: ${command}`,
        action: 'error',
      };
    }
  }

  public async executeCommand(action: string, params: EmailParams, context: any) {
    if (typeof this[action] === 'function') {
      return this[action](params, context);
    } else {
      return {
        success: false,
        message: `Unknown action: ${action}`,
        action: 'error',
      };
    }
  }

  private findCommandAction(command: string): { action: string | null; params: EmailParams } {
    for (const key in this.commands) {
      const commandData = this.commands[key];
      const allAliases = [key, ...(commandData.aliases || [])];

      for (const alias of allAliases) {
        if (command.toLowerCase().startsWith(alias)) {
          const remaining = command.substring(alias.length).trim();
          const params = this.extractParameters(remaining);
          return { action: commandData.action, params };
        }
      }
    }
    return { action: null, params: {} };
  }

  private extractParameters(paramString: string): EmailParams {
    const params: EmailParams = {};
    const parts = paramString.split(/\s+(?:to|from|subject|body|with|for|at|on|about|in|named|called)\s+/i);
    let currentKey = 'recipient'; // Default key

    if (paramString.includes(' to ')) currentKey = 'recipient';
    else if (paramString.includes(' from ')) currentKey = 'sender';
    else if (paramString.includes(' subject ')) currentKey = 'subject';
    else if (paramString.includes(' body ')) currentKey = 'body';

    params[currentKey] = parts[0] || '';

    // A more robust extraction logic would be needed for complex commands
    // For now, this is a simplified version

    return params;
  }

  // Command Handlers
  async handleComposeEmail(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening email composer...',
      action: 'navigate',
      data: {
        route: '/email/compose',
        params: params,
      },
    };
  }

  async handleSendEmail(params: EmailParams, userId: string) {
    if (!params.recipient) {
      return {
        success: false,
        message: 'Please specify a recipient',
        action: 'input_required',
        data: { field: 'recipient' },
      };
    }

    try {
      const emailData = {
        to: [params.recipient],
        subject: params.subject || 'No Subject',
        body: params.body || '',
        priority: 'normal',
      };
      const result = await emailService.sendEmail(userId, emailData);

      if (result.success) {
        return {
          success: true,
          message: 'Email sent successfully',
          action: 'email_sent',
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: `Failed to send email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleReplyEmail(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to reply to',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    return {
      success: true,
      message: 'Opening email composer for reply...',
      action: 'navigate',
      data: {
        route: `/email/compose`,
        params: { replyTo: params.emailId, ...params },
      },
    };
  }

  async handleForwardEmail(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to forward',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    return {
      success: true,
      message: 'Opening email composer to forward...',
      action: 'navigate',
      data: {
        route: `/email/compose`,
        params: { forward: params.emailId, ...params },
      },
    };
  }

  async handleShowEmails(params: EmailParams, userId: string) {
    try {
      const result = await emailService.getEmails(userId, {
        folder: params.folderName || 'inbox',
        limit: 20,
      });

      if (result.success) {
        const emails = result.data || [];
        return {
          success: true,
          message: `Showing ${emails.length} emails from ${params.folderName || 'inbox'}`,
          action: 'show_data',
          data: {
            type: 'emails',
            items: emails,
            route: '/email',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch emails: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch emails: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleMarkRead(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to mark as read',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    try {
      const result = await emailService.updateEmail(params.emailId, userId, { read: true });
      if (result.success) {
        return {
          success: true,
          message: 'Email marked as read',
          action: 'email_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to mark as read: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to mark as read: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleMarkUnread(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to mark as unread',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    try {
      const result = await emailService.updateEmail(params.emailId, userId, { read: false });
      if (result.success) {
        return {
          success: true,
          message: 'Email marked as unread',
          action: 'email_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to mark as unread: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to mark as unread: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleStarEmail(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to star',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    try {
      const result = await emailService.updateEmail(params.emailId, userId, { starred: true });
      if (result.success) {
        return {
          success: true,
          message: 'Email starred',
          action: 'email_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to star email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to star email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleUnstarEmail(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to unstar',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    try {
      const result = await emailService.updateEmail(params.emailId, userId, { starred: false });
      if (result.success) {
        return {
          success: true,
          message: 'Email unstarred',
          action: 'email_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to unstar email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to unstar email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleDeleteEmail(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to delete',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    try {
      const result = await emailService.deleteEmail(params.emailId, userId);
      if (result.success) {
        return {
          success: true,
          message: 'Email moved to trash',
          action: 'email_deleted',
        };
      } else {
        return {
          success: false,
          message: `Failed to delete email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to delete email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleArchiveEmail(params: EmailParams, userId: string) {
    if (!params.emailId) {
      return {
        success: false,
        message: 'Please specify which email to archive',
        action: 'input_required',
        data: { field: 'emailId' },
      };
    }

    try {
      const result = await emailService.updateEmail(params.emailId, userId, { folder: 'archive' });
      if (result.success) {
        return {
          success: true,
          message: 'Email archived',
          action: 'email_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to archive email: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to archive email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSearchEmails(params: EmailParams, userId: string) {
    if (!params.query) {
      return {
        success: false,
        message: 'Please specify what to search for',
        action: 'input_required',
        data: { field: 'query' },
      };
    }

    try {
      const result = await emailSearchService.searchEmails(userId, {
        query: params.query,
        limit: 20,
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
            route: '/email/search',
          },
        };
      } else {
        return {
          success: false,
          message: `Search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Search failed: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSearchByFrom(params: EmailParams, userId: string) {
    if (!params.sender) {
      return {
        success: false,
        message: 'Please specify the sender to search for',
        action: 'input_required',
        data: { field: 'sender' },
      };
    }

    try {
      const result = await emailSearchService.searchEmails(userId, {
        from: params.sender,
        limit: 20,
      });

      if (result.success) {
        const emails = result.data || [];
        return {
          success: true,
          message: `Found ${emails.length} emails from "${params.sender}"`,
          action: 'show_data',
          data: {
            type: 'search_results',
            query: `from:${params.sender}`,
            items: emails,
            route: '/email/search',
          },
        };
      } else {
        return {
          success: false,
          message: `Search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Search failed: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSearchBySubject(params: EmailParams, userId: string) {
    if (!params.subject) {
      return {
        success: false,
        message: 'Please specify the subject to search for',
        action: 'input_required',
        data: { field: 'subject' },
      };
    }

    try {
      const result = await emailSearchService.searchEmails(userId, {
        subject: params.subject,
        limit: 20,
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
            route: '/email/search',
          },
        };
      } else {
        return {
          success: false,
          message: `Search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Search failed: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSearchAttachments(params: EmailParams, userId: string) {
    if (!params.query) {
      return {
        success: false,
        message: 'Please specify what attachment to search for',
        action: 'input_required',
        data: { field: 'query' },
      };
    }

    try {
      const result = await emailSearchService.searchAttachments(userId, {
        query: params.query,
        limit: 20,
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
            route: '/email/search',
          },
        };
      } else {
        return {
          success: false,
          message: `Attachment search failed: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Attachment search failed: ${errorMessage}`,
        action: 'error',
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
            route: '/email/folders',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch folders: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch folders: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleCreateFolder(params: EmailParams, userId: string) {
    if (!params.folderName) {
      return {
        success: false,
        message: 'Please specify a folder name',
        action: 'input_required',
        data: { field: 'folderName' },
      };
    }

    try {
      const result = await emailService.createFolder(userId, {
        name: params.folderName,
        type: 'custom',
      });

      if (result.success) {
        return {
          success: true,
          message: `Folder "${params.folderName}" created successfully`,
          action: 'folder_created',
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: `Failed to create folder: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to create folder: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleDeleteFolder(params: EmailParams, userId: string) {
    if (!params.folderName) {
      return {
        success: false,
        message: 'Please specify which folder to delete',
        action: 'input_required',
        data: { field: 'folderName' },
      };
    }

    try {
      const foldersResult = await emailService.getFolders(userId);

      if (!foldersResult.success) {
        return {
          success: false,
          message: `Failed to fetch folders: ${String(foldersResult.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }

      const folders = foldersResult.data || [];
      const folder = folders.find((f: any) => f.name.toLowerCase() === params.folderName!.toLowerCase());

      if (!folder) {
        return {
          success: false,
          message: `Folder "${params.folderName}" not found`,
          action: 'error',
        };
      }

      const deleteResult = await emailService.deleteFolder(folder.id, userId);

      if (deleteResult.success) {
        return {
          success: true,
          message: `Folder "${params.folderName}" deleted successfully`,
          action: 'folder_deleted',
        };
      } else {
        return {
          success: false,
          message: `Failed to delete folder: ${String(deleteResult.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to delete folder: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleMoveToFolder(params: EmailParams, userId: string) {
    if (!params.emailId || !params.folderName) {
      return {
        success: false,
        message: 'Please specify both email ID and folder name',
        action: 'input_required',
        data: { fields: ['emailId', 'folderName'] },
      };
    }

    try {
      const foldersResult = await emailService.getFolders(userId);

      if (!foldersResult.success) {
        return {
          success: false,
          message: `Failed to fetch folders: ${String(foldersResult.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }

      const folders = foldersResult.data || [];
      const folder = folders.find((f: any) => f.name.toLowerCase() === params.folderName!.toLowerCase());

      if (!folder) {
        return {
          success: false,
          message: `Folder "${params.folderName}" not found`,
          action: 'error',
        };
      }

      const moveResult = await emailService.moveToFolder(params.emailId, userId, folder.id);

      if (moveResult.success) {
        return {
          success: true,
          message: `Email moved to "${params.folderName}" folder`,
          action: 'email_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to move email: ${String(moveResult.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to move email: ${errorMessage}`,
        action: 'error',
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
            route: '/email/templates',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch templates: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch templates: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleCreateTemplate(params: EmailParams, userId: string) {
    if (!params.templateName) {
      return {
        success: false,
        message: 'Please specify a template name',
        action: 'input_required',
        data: { field: 'templateName' },
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
        userId: userId,
      };

      const result = await emailTemplateService.saveTemplate(templateData);

      if (result.success) {
        return {
          success: true,
          message: `Template "${params.templateName}" created successfully`,
          action: 'template_created',
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: `Failed to create template: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to create template: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleUseTemplate(params: EmailParams, context: any) {
    if (!params.templateName) {
      return {
        success: false,
        message: 'Please specify which template to use',
        action: 'input_required',
        data: { field: 'templateName' },
      };
    }

    return {
      success: true,
      message: `Opening composer with template "${params.templateName}"...`,
      action: 'navigate',
      data: {
        route: '/email/compose',
        params: {
          templateName: params.templateName,
        },
      },
    };
  }

  async handleDeleteTemplate(params: EmailParams, userId: string) {
    if (!params.templateName) {
      return {
        success: false,
        message: 'Please specify which template to delete',
        action: 'input_required',
        data: { field: 'templateName' },
      };
    }

    try {
      const templatesResult = await emailTemplateService.getTemplates(null);

      if (!templatesResult.success) {
        return {
          success: false,
          message: `Failed to fetch templates: ${String(templatesResult.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }

      const templates = templatesResult.data || [];
      const template = templates.find((t: any) => t.name.toLowerCase() === params.templateName!.toLowerCase());

      if (!template) {
        return {
          success: false,
          message: `Template "${params.templateName}" not found`,
          action: 'error',
        };
      }

      const deleteResult = await emailTemplateService.deleteTemplate(template.id);

      if (deleteResult.success) {
        return {
          success: true,
          message: `Template "${params.templateName}" deleted successfully`,
          action: 'template_deleted',
        };
      } else {
        return {
          success: false,
          message: `Failed to delete template: ${String(deleteResult.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to delete template: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleCreateCampaign(params: EmailParams, userId: string) {
    if (!params.campaignName) {
      return {
        success: false,
        message: 'Please specify a campaign name',
        action: 'input_required',
        data: { field: 'campaignName' },
      };
    }

    try {
      const campaignData = {
        name: params.campaignName,
        subject: params.subject || 'Campaign Subject',
        templateId: params.templateId || null,
        recipients: [],
        status: 'draft',
        userId: userId,
      };

      const result = await emailCampaignService.createCampaign(campaignData);

      if (result.success) {
        return {
          success: true,
          message: `Campaign "${params.campaignName}" created successfully`,
          action: 'campaign_created',
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: `Failed to create campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to create campaign: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSendCampaign(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to send',
        action: 'input_required',
        data: { field: 'campaignId' },
      };
    }

    try {
      const result = await emailCampaignService.sendCampaign(params.campaignId);

      if (result.success) {
        return {
          success: true,
          message: `Campaign sent successfully`,
          action: 'campaign_sent',
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: `Failed to send campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send campaign: ${errorMessage}`,
        action: 'error',
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
            route: '/email/campaigns',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch campaigns: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch campaigns: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleCampaignStats(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to get stats for',
        action: 'input_required',
        data: { field: 'campaignId' },
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
            route: '/email/campaigns',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get campaign stats: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get campaign stats: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handlePauseCampaign(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to pause',
        action: 'input_required',
        data: { field: 'campaignId' },
      };
    }

    try {
      const result = await emailCampaignService.pauseCampaign(params.campaignId);

      if (result.success) {
        return {
          success: true,
          message: `Campaign paused successfully`,
          action: 'campaign_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to pause campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to pause campaign: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleResumeCampaign(params: EmailParams, userId: string) {
    if (!params.campaignId) {
      return {
        success: false,
        message: 'Please specify which campaign to resume',
        action: 'input_required',
        data: { field: 'campaignId' },
      };
    }

    try {
      const result = await emailCampaignService.resumeCampaign(params.campaignId);

      if (result.success) {
        return {
          success: true,
          message: `Campaign resumed successfully`,
          action: 'campaign_updated',
        };
      } else {
        return {
          success: false,
          message: `Failed to resume campaign: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to resume campaign: ${errorMessage}`,
        action: 'error',
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
            route: '/email/analytics',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get email analytics: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email analytics: ${errorMessage}`,
        action: 'error',
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
            route: '/email/analytics',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get email stats: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email stats: ${errorMessage}`,
        action: 'error',
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
            route: '/email/analytics',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get email metrics: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email metrics: ${errorMessage}`,
        action: 'error',
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
            route: '/email/analytics',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get email performance: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email performance: ${errorMessage}`,
        action: 'error',
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
            route: '/email/reports',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to generate email report: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to generate email report: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleClientEmailHistory(params: EmailParams, userId: string) {
    if (!params.clientId) {
      return {
        success: false,
        message: 'Please specify a client ID',
        action: 'input_required',
        data: { field: 'clientId' },
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
            route: '/email/clients',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get client email history: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get client email history: ${errorMessage}`,
        action: 'error',
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
            route: '/email/activity',
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get email activity: ${String(result.error ?? 'Unknown error')}`,
          action: 'error',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to get email activity: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleScheduleEmail(params: EmailParams, userId: string) {
    if (!params.recipient || !params.scheduledTime) {
      return {
        success: false,
        message: 'Please specify recipient and scheduled time',
        action: 'input_required',
        data: { fields: ['recipient', 'scheduledTime'] },
      };
    }

    try {
      const emailData = {
        to: [params.recipient],
        subject: params.subject || 'Scheduled Email',
        body: params.message || '',
        priority: 'normal',
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
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to schedule email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleCreateAutomation(params: EmailParams, userId: string) {
    if (!params.ruleName) {
      return {
        success: false,
        message: 'Please specify an automation rule name',
        action: 'input_required',
        data: { field: 'ruleName' },
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
          ruleName: params.ruleName,
        },
      },
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
          route: '/email/automation',
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch automation rules: ${errorMessage}`,
        action: 'error',
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
          route: '/email/follow-ups',
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to fetch follow-ups: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSendInvoiceEmail(params: EmailParams, userId: string) {
    if (!params.invoiceId || !params.recipient) {
      return {
        success: false,
        message: 'Please specify invoice ID and recipient',
        action: 'input_required',
        data: { fields: ['invoiceId', 'recipient'] },
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
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send invoice email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSendQuoteEmail(params: EmailParams, userId: string) {
    if (!params.quoteId || !params.recipient) {
      return {
        success: false,
        message: 'Please specify quote ID and recipient',
        action: 'input_required',
        data: { fields: ['quoteId', 'recipient'] },
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
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send quote email: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleSendPaymentReminder(params: EmailParams, userId: string) {
    if (!params.invoiceId) {
      return {
        success: false,
        message: 'Please specify an invoice ID',
        action: 'input_required',
        data: { field: 'invoiceId' },
      };
    }

    try {
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
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to send payment reminder: ${errorMessage}`,
        action: 'error',
      };
    }
  }

  async handleShowEmailSettings(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening email settings...',
      action: 'navigate',
      data: {
        route: '/email/settings',
      },
    };
  }

  async handleManageSignature(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening signature manager...',
      action: 'navigate',
      data: {
        route: '/email/settings/signature',
      },
    };
  }

  async handleNotificationSettings(params: EmailParams, context: any) {
    return {
      success: true,
      message: 'Opening notification settings...',
      action: 'navigate',
      data: {
        route: '/email/settings/notifications',
      },
    };
  }

  async handleEmailHelp(params: EmailParams, context: any) {
    const helpTopics = {
      send: 'To send an email, say "send email to [recipient]" or "email [recipient] about [subject]"',
      compose: 'To compose an email, say "compose email" or "write new email"',
      search: 'To search emails, say "search emails for [query]" or "find emails from [sender]"',
      templates: 'To manage templates, say "show templates", "create template", or "use template [name]"',
      campaigns: 'To manage campaigns, say "show campaigns", "create campaign", or "send campaign [id]"',
      automation: 'To manage automation, say "show automation rules" or "create automation"',
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
        topic: topic,
      },
    };
  }
}

// Export the singleton instance
export const emailCommandHandler = EmailCommandHandler.getInstance();
