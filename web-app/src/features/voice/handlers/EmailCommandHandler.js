/**
 * Email Command Handler for Voice Assistant
 * Handles email-related voice commands
 */

import { emailService } from '@/lib/emailService';
import { notificationService } from '@/lib/notificationService';

export class EmailCommandHandler {
  constructor() {
    this.commands = [
      'compose email',
      'new email',
      'write email',
      'check email',
      'check my email',
      'show inbox',
      'search emails',
      'find emails',
      'mark as read',
      'mark as unread',
      'delete email',
      'reply to email',
      'forward email'
    ];
  }

  /**
   * Check if command can be handled by this handler
   * @param {string} command - Voice command
   * @returns {boolean} Whether command can be handled
   */
  canHandle(command) {
    const normalizedCommand = command.toLowerCase().trim();
    return this.commands.some(cmd => 
      normalizedCommand.includes(cmd) || 
      normalizedCommand.startsWith(cmd)
    );
  }

  /**
   * Handle email-related voice commands
   * @param {string} command - Voice command
   * @param {Object} context - Command context
   * @returns {Promise<Object>} Command result
   */
  async handle(command, context = {}) {
    try {
      const normalizedCommand = command.toLowerCase().trim();
      
      // Compose/New Email Commands
      if (this.matchesCommand(normalizedCommand, ['compose email', 'new email', 'write email'])) {
        return await this.handleComposeEmail(command, context);
      }
      
      // Check Email Commands
      if (this.matchesCommand(normalizedCommand, ['check email', 'check my email', 'show inbox'])) {
        return await this.handleCheckEmail(command, context);
      }
      
      // Search Email Commands
      if (this.matchesCommand(normalizedCommand, ['search emails', 'find emails'])) {
        return await this.handleSearchEmails(command, context);
      }
      
      // Mark Email Commands
      if (this.matchesCommand(normalizedCommand, ['mark as read', 'mark as unread'])) {
        return await this.handleMarkEmail(command, context);
      }
      
      // Delete Email Commands
      if (this.matchesCommand(normalizedCommand, ['delete email'])) {
        return await this.handleDeleteEmail(command, context);
      }
      
      // Reply Email Commands
      if (this.matchesCommand(normalizedCommand, ['reply to email', 'reply'])) {
        return await this.handleReplyEmail(command, context);
      }
      
      // Forward Email Commands
      if (this.matchesCommand(normalizedCommand, ['forward email', 'forward'])) {
        return await this.handleForwardEmail(command, context);
      }

      return {
        success: false,
        message: 'Email command not recognized',
        action: 'unknown'
      };
    } catch (error) {
      console.error('Error handling email command:', error);
      return {
        success: false,
        message: `Error processing email command: ${error.message}`,
        action: 'error'
      };
    }
  }

  /**
   * Handle compose email command
   */
  async handleComposeEmail(command, context) {
    try {
      // Extract recipient from command if provided
      const recipientMatch = command.match(/to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const recipient = recipientMatch ? recipientMatch[1] : null;

      // Extract subject from command if provided
      const subjectMatch = command.match(/subject\s+["']([^"']+)["']/i) || 
                          command.match(/about\s+["']([^"']+)["']/i);
      const subject = subjectMatch ? subjectMatch[1] : null;

      const result = await emailService.composeEmail({
        to: recipient,
        subject: subject,
        body: '',
        context: 'voice_command'
      });

      if (result.success) {
        notificationService.show({
          type: 'success',
          message: 'Email composer opened',
          duration: 3000
        });

        return {
          success: true,
          message: recipient 
            ? `Started composing email to ${recipient}` 
            : 'Email composer opened',
          action: 'compose_email',
          data: result.data
        };
      }

      return {
        success: false,
        message: 'Failed to open email composer',
        action: 'compose_email'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error composing email: ${error.message}`,
        action: 'compose_email'
      };
    }
  }

  /**
   * Handle check email command
   */
  async handleCheckEmail(command, context) {
    try {
      const result = await emailService.getInbox({
        limit: 10,
        unreadOnly: command.includes('unread')
      });

      if (result.success) {
        const emails = result.data;
        const unreadCount = emails.filter(email => !email.read).length;
        
        let message = `You have ${emails.length} emails`;
        if (unreadCount > 0) {
          message += `, ${unreadCount} unread`;
        }

        notificationService.show({
          type: 'info',
          message: message,
          duration: 4000
        });

        return {
          success: true,
          message: message,
          action: 'check_email',
          data: {
            emails: emails,
            unreadCount: unreadCount,
            totalCount: emails.length
          }
        };
      }

      return {
        success: false,
        message: 'Failed to check emails',
        action: 'check_email'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error checking emails: ${error.message}`,
        action: 'check_email'
      };
    }
  }

  /**
   * Handle search emails command
   */
  async handleSearchEmails(command, context) {
    try {
      // Extract search query from command
      const queryMatch = command.match(/(?:search|find)\s+emails?\s+(?:for\s+)?["']?([^"']+)["']?/i);
      const query = queryMatch ? queryMatch[1].trim() : '';

      if (!query) {
        return {
          success: false,
          message: 'Please specify what to search for',
          action: 'search_emails'
        };
      }

      const result = await emailService.searchEmails({
        query: query,
        limit: 20
      });

      if (result.success) {
        const emails = result.data;
        const message = `Found ${emails.length} emails matching "${query}"`;

        notificationService.show({
          type: 'info',
          message: message,
          duration: 4000
        });

        return {
          success: true,
          message: message,
          action: 'search_emails',
          data: {
            emails: emails,
            query: query,
            count: emails.length
          }
        };
      }

      return {
        success: false,
        message: 'Failed to search emails',
        action: 'search_emails'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error searching emails: ${error.message}`,
        action: 'search_emails'
      };
    }
  }

  /**
   * Handle mark email command
   */
  async handleMarkEmail(command, context) {
    try {
      const isMarkAsRead = command.includes('mark as read');
      const selectedEmailId = context.selectedEmailId;

      if (!selectedEmailId) {
        return {
          success: false,
          message: 'Please select an email first',
          action: 'mark_email'
        };
      }

      const result = await emailService.markEmail(selectedEmailId, {
        read: isMarkAsRead
      });

      if (result.success) {
        const message = `Email marked as ${isMarkAsRead ? 'read' : 'unread'}`;
        
        notificationService.show({
          type: 'success',
          message: message,
          duration: 3000
        });

        return {
          success: true,
          message: message,
          action: 'mark_email',
          data: result.data
        };
      }

      return {
        success: false,
        message: 'Failed to mark email',
        action: 'mark_email'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error marking email: ${error.message}`,
        action: 'mark_email'
      };
    }
  }

  /**
   * Handle delete email command
   */
  async handleDeleteEmail(command, context) {
    try {
      const selectedEmailId = context.selectedEmailId;

      if (!selectedEmailId) {
        return {
          success: false,
          message: 'Please select an email first',
          action: 'delete_email'
        };
      }

      const result = await emailService.deleteEmail(selectedEmailId);

      if (result.success) {
        notificationService.show({
          type: 'success',
          message: 'Email deleted',
          duration: 3000
        });

        return {
          success: true,
          message: 'Email deleted successfully',
          action: 'delete_email',
          data: result.data
        };
      }

      return {
        success: false,
        message: 'Failed to delete email',
        action: 'delete_email'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error deleting email: ${error.message}`,
        action: 'delete_email'
      };
    }
  }

  /**
   * Handle reply email command
   */
  async handleReplyEmail(command, context) {
    try {
      const selectedEmailId = context.selectedEmailId;

      if (!selectedEmailId) {
        return {
          success: false,
          message: 'Please select an email first',
          action: 'reply_email'
        };
      }

      const result = await emailService.replyToEmail(selectedEmailId);

      if (result.success) {
        notificationService.show({
          type: 'success',
          message: 'Reply composer opened',
          duration: 3000
        });

        return {
          success: true,
          message: 'Reply composer opened',
          action: 'reply_email',
          data: result.data
        };
      }

      return {
        success: false,
        message: 'Failed to open reply composer',
        action: 'reply_email'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error replying to email: ${error.message}`,
        action: 'reply_email'
      };
    }
  }

  /**
   * Handle forward email command
   */
  async handleForwardEmail(command, context) {
    try {
      const selectedEmailId = context.selectedEmailId;

      if (!selectedEmailId) {
        return {
          success: false,
          message: 'Please select an email first',
          action: 'forward_email'
        };
      }

      const result = await emailService.forwardEmail(selectedEmailId);

      if (result.success) {
        notificationService.show({
          type: 'success',
          message: 'Forward composer opened',
          duration: 3000
        });

        return {
          success: true,
          message: 'Forward composer opened',
          action: 'forward_email',
          data: result.data
        };
      }

      return {
        success: false,
        message: 'Failed to open forward composer',
        action: 'forward_email'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error forwarding email: ${error.message}`,
        action: 'forward_email'
      };
    }
  }

  /**
   * Check if command matches any of the provided patterns
   */
  matchesCommand(command, patterns) {
    return patterns.some(pattern => 
      command.includes(pattern) || command.startsWith(pattern)
    );
  }

  /**
   * Get all available email commands
   */
  getAvailableCommands() {
    return this.commands.map(command => ({
      command,
      description: this.getCommandDescription(command),
      examples: this.getCommandExamples(command)
    }));
  }

  /**
   * Get description for a command
   */
  getCommandDescription(command) {
    const descriptions = {
      'compose email': 'Start composing a new email',
      'new email': 'Create a new email',
      'write email': 'Begin writing an email',
      'check email': 'Check your email inbox',
      'check my email': 'View your emails',
      'show inbox': 'Display email inbox',
      'search emails': 'Search through your emails',
      'find emails': 'Find specific emails',
      'mark as read': 'Mark selected email as read',
      'mark as unread': 'Mark selected email as unread',
      'delete email': 'Delete selected email',
      'reply to email': 'Reply to selected email',
      'forward email': 'Forward selected email'
    };
    return descriptions[command] || 'Email command';
  }

  /**
   * Get examples for a command
   */
  getCommandExamples(command) {
    const examples = {
      'compose email': ['Compose email to john@example.com', 'New email about project update'],
      'check email': ['Check my email', 'Show inbox'],
      'search emails': ['Search emails for "project"', 'Find emails from John'],
      'mark as read': ['Mark as read'],
      'delete email': ['Delete email'],
      'reply to email': ['Reply to email']
    };
    return examples[command] || [command];
  }
}

// Export singleton instance
export const emailCommandHandler = new EmailCommandHandler();

// Export all email commands for reference
export const allEmailCommands = emailCommandHandler.getAvailableCommands();

export default EmailCommandHandler;