import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Email Command Handler for voice-activated email operations
 */
class EmailCommandHandler {
  constructor(emailService, navigationService) {
    this.emailService = emailService;
    this.navigationService = navigationService;
  }

  /**
   * Process email-related voice commands
   */
  async processCommand(command, context = {}) {
    const normalizedCommand = command.toLowerCase().trim();
    
    try {
      // Navigate to email page
      if (this.isNavigationCommand(normalizedCommand)) {
        return await this.handleNavigation(normalizedCommand);
      }
      
      // Create new email
      if (this.isCreateCommand(normalizedCommand)) {
        return await this.handleCreateEmail(normalizedCommand, context);
      }
      
      // Send email
      if (this.isSendCommand(normalizedCommand)) {
        return await this.handleSendEmail(normalizedCommand, context);
      }
      
      // Search emails
      if (this.isSearchCommand(normalizedCommand)) {
        return await this.handleSearchEmails(normalizedCommand, context);
      }
      
      // Default response
      return {
        success: false,
        message: 'Email command not recognized',
        suggestions: [
          'go to email',
          'create new email',
          'send email to [recipient]',
          'search emails'
        ]
      };
    } catch (error) {
      return {
        success: false,
        message: `Error processing email command: ${error.message}`,
        error: error
      };
    }
  }

  isNavigationCommand(command) {
    const navigationKeywords = ['go to email', 'open email', 'show email', 'email page'];
    return navigationKeywords.some(keyword => command.includes(keyword));
  }

  isCreateCommand(command) {
    const createKeywords = ['create email', 'new email', 'compose email', 'write email'];
    return createKeywords.some(keyword => command.includes(keyword));
  }

  isSendCommand(command) {
    const sendKeywords = ['send email', 'send message', 'email to'];
    return sendKeywords.some(keyword => command.includes(keyword));
  }

  isSearchCommand(command) {
    const searchKeywords = ['search email', 'find email', 'look for email'];
    return searchKeywords.some(keyword => command.includes(keyword));
  }

  async handleNavigation(command) {
    if (this.navigationService) {
      this.navigationService('/email');
    }
    
    return {
      success: true,
      message: 'Navigating to email page',
      action: 'navigation',
      target: '/email'
    };
  }

  async handleCreateEmail(command, context) {
    const emailData = this.extractEmailData(command);
    
    if (this.emailService && this.emailService.createDraft) {
      await this.emailService.createDraft(emailData);
    }
    
    return {
      success: true,
      message: 'Creating new email',
      action: 'create',
      data: emailData
    };
  }

  async handleSendEmail(command, context) {
    const emailData = this.extractEmailData(command);
    
    if (!emailData.recipient) {
      return {
        success: false,
        message: 'Please specify a recipient',
        suggestions: ['send email to john@example.com']
      };
    }
    
    if (this.emailService && this.emailService.sendEmail) {
      await this.emailService.sendEmail(emailData);
    }
    
    return {
      success: true,
      message: `Sending email to ${emailData.recipient}`,
      action: 'send',
      data: emailData
    };
  }

  async handleSearchEmails(command, context) {
    const searchTerm = this.extractSearchTerm(command);
    
    if (this.emailService && this.emailService.searchEmails) {
      const results = await this.emailService.searchEmails(searchTerm);
      return {
        success: true,
        message: `Found ${results.length} emails`,
        action: 'search',
        data: { searchTerm, results }
      };
    }
    
    return {
      success: true,
      message: `Searching for emails: ${searchTerm}`,
      action: 'search',
      data: { searchTerm }
    };
  }

  extractEmailData(command) {
    const emailData = {
      recipient: null,
      subject: null,
      body: null
    };
    
    // Extract recipient (basic pattern matching)
    const recipientMatch = command.match(/(?:to|email)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (recipientMatch) {
      emailData.recipient = recipientMatch[1];
    }
    
    // Extract subject (basic pattern matching)
    const subjectMatch = command.match(/subject\s+(.+?)(?:\s+body|$)/i);
    if (subjectMatch) {
      emailData.subject = subjectMatch[1];
    }
    
    // Extract body (basic pattern matching)
    const bodyMatch = command.match(/body\s+(.+)$/i);
    if (bodyMatch) {
      emailData.body = bodyMatch[1];
    }
    
    return emailData;
  }

  extractSearchTerm(command) {
    // Remove search keywords and extract the search term
    const searchTerm = command
      .replace(/search email|find email|look for email/gi, '')
      .trim();
    
    return searchTerm || 'recent emails';
  }

  /**
   * Get available email commands
   */
  getAvailableCommands() {
    return [
      {
        command: 'go to email',
        description: 'Navigate to the email page',
        examples: ['go to email', 'open email', 'show email page']
      },
      {
        command: 'create new email',
        description: 'Create a new email draft',
        examples: ['create email', 'new email', 'compose email']
      },
      {
        command: 'send email to [recipient]',
        description: 'Send an email to a specific recipient',
        examples: ['send email to john@example.com', 'email to client@company.com']
      },
      {
        command: 'search emails',
        description: 'Search through emails',
        examples: ['search email', 'find email about project', 'look for email from client']
      }
    ];
  }
}

/**
 * React component wrapper for EmailCommandHandler
 */
const EmailCommandHandlerComponent = ({ 
  emailService, 
  onCommandProcessed,
  className = '',
  ...props 
}) => {
  const navigate = useNavigate();
  const [handler] = useState(() => new EmailCommandHandler(emailService, navigate));
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const processCommand = async (command, context) => {
    setIsProcessing(true);
    try {
      const result = await handler.processCommand(command, context);
      setLastResult(result);
      onCommandProcessed?.(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  // Expose the handler methods
  useEffect(() => {
    if (props.onHandlerReady) {
      props.onHandlerReady({ processCommand });
    }
  }, []);

  return (
    <div 
      className={`email-command-handler ${className}`}
      data-testid="email-command-handler"
      {...props}
    >
      {isProcessing && (
        <div className="processing-indicator">
          Processing email command...
        </div>
      )}
      
      {lastResult && (
        <div className={`result ${lastResult.success ? 'success' : 'error'}`}>
          {lastResult.message}
        </div>
      )}
    </div>
  );
};

// Export both the class and component
export default EmailCommandHandler;
export { EmailCommandHandlerComponent };