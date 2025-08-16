import Logger from '@/utils/Logger';
import { errorMonitor, ErrorType, ErrorSeverity } from '@utils/ErrorMonitor';
import { notify } from '@shared/utils'; // Fixed import path

/**
 * Email Error Handler - Comprehensive error handling and recovery for email operations
 * Implements retry logic, user-friendly error messages, and recovery mechanisms
 */
class EmailErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      retryableErrors: [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'RATE_LIMIT_ERROR',
        'TEMPORARY_SERVER_ERROR',
        'CONNECTION_ERROR',
        'QUOTA_EXCEEDED',
        'SERVICE_UNAVAILABLE'
      ]
    };

    this.errorMessages = {
      // Network and connectivity errors
      NETWORK_ERROR: 'Connection issue detected. Please check your internet connection.',
      CONNECTION_ERROR: 'Unable to connect to email server. Retrying...',
      TIMEOUT_ERROR: 'Request timed out. Please try again.',
      
      // Authentication errors
      AUTH_ERROR: 'Email authentication failed. Please check your credentials.',
      TOKEN_EXPIRED: 'Your email session has expired. Please sign in again.',
      INVALID_CREDENTIALS: 'Invalid email credentials. Please update your settings.',
      
      // Provider-specific errors
      RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment before trying again.',
      QUOTA_EXCEEDED: 'Email quota exceeded. Please try again later.',
      SERVICE_UNAVAILABLE: 'Email service is temporarily unavailable.',
      
      // Email-specific errors
      INVALID_EMAIL_FORMAT: 'Invalid email address format.',
      ATTACHMENT_TOO_LARGE: 'Attachment size exceeds the limit.',
      RECIPIENT_NOT_FOUND: 'Recipient email address not found.',
      SPAM_DETECTED: 'Email flagged as spam. Please review content.',
      
      // Storage errors
      STORAGE_ERROR: 'Error saving email. Please try again.',
      SYNC_ERROR: 'Email synchronization failed. Retrying in background.',
      
      // Generic errors
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
      VALIDATION_ERROR: 'Invalid email data provided.'
    };

    this.recoveryStrategies = new Map();
    this.setupRecoveryStrategies();
  }

  /**
   * Setup recovery strategies for different error types
   */
  setupRecoveryStrategies() {
    // Network recovery
    this.recoveryStrategies.set('NETWORK_ERROR', {
      immediate: () => this.checkNetworkConnection(),
      delayed: () => this.scheduleRetry(),
      fallback: () => this.enableOfflineMode()
    });

    // Authentication recovery
    this.recoveryStrategies.set('AUTH_ERROR', {
      immediate: () => this.refreshAuthToken(),
      delayed: () => this.promptReauthentication(),
      fallback: () => this.disableAccount()
    });

    // Rate limiting recovery
    this.recoveryStrategies.set('RATE_LIMIT_ERROR', {
      immediate: () => this.calculateBackoffDelay(),
      delayed: () => this.scheduleRetryWithBackoff(),
      fallback: () => this.queueForLater()
    });

    // Storage recovery
    this.recoveryStrategies.set('STORAGE_ERROR', {
      immediate: () => this.retryWithDifferentStorage(),
      delayed: () => this.clearCacheAndRetry(),
      fallback: () => this.saveToLocalStorage()
    });
  }

  /**
   * Handle email operation errors with comprehensive recovery
   */
  async handleEmailError(error, context = {}) {
    const errorType = this.classifyError(error);
    const errorId = this.generateErrorId();
    
    // Log error with context
    const errorReport = {
      id: errorId,
      type: errorType,
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: {
        operation: context.operation || 'unknown',
        userId: context.userId,
        emailId: context.emailId,
        provider: context.provider,
        attempt: context.attempt || 1,
        timestamp: new Date().toISOString()
      },
      severity: this.determineSeverity(errorType)
    };

    // Capture error in monitoring system
    errorMonitor.captureError({
      message: errorReport.message,
      type: ErrorType.API,
      severity: errorReport.severity,
      additionalData: errorReport.context
    });

    Logger.error(`Email operation error [${errorId}]:`, errorReport);

    // Determine if error is retryable
    const isRetryable = this.isRetryableError(errorType);
    const shouldRetry = isRetryable && (context.attempt || 1) <= this.retryConfig.maxRetries;

    if (shouldRetry) {
      return await this.handleRetryableError(errorReport, context);
    } else {
      return await this.handleNonRetryableError(errorReport, context);
    }
  }

  /**
   * Handle retryable errors with exponential backoff
   */
  async handleRetryableError(errorReport, context) {
    const attempt = context.attempt || 1;
    const delay = this.calculateRetryDelay(attempt);
    
    // Show user-friendly message for first retry
    if (attempt === 1) {
      notify.warning(this.getUserFriendlyMessage(errorReport.type), {
        duration: 3000
      });
    }

    // Execute immediate recovery strategy
    const recoveryStrategy = this.recoveryStrategies.get(errorReport.type);
    if (recoveryStrategy?.immediate) {
      try {
        await recoveryStrategy.immediate();
      } catch (recoveryError) {
        Logger.warn('Immediate recovery failed:', recoveryError);
      }
    }

    // Schedule retry with delay
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // Execute delayed recovery strategy
          if (recoveryStrategy?.delayed) {
            await recoveryStrategy.delayed();
          }

          resolve({
            shouldRetry: true,
            delay,
            attempt: attempt + 1,
            errorId: errorReport.id,
            recoveryApplied: true
          });
        } catch (recoveryError) {
          Logger.error('Delayed recovery failed:', recoveryError);
          resolve({
            shouldRetry: false,
            error: recoveryError,
            errorId: errorReport.id,
            recoveryFailed: true
          });
        }
      }, delay);
    });
  }

  /**
   * Handle non-retryable errors with fallback strategies
   */
  async handleNonRetryableError(errorReport, context) {
    // Show user-friendly error message
    const userMessage = this.getUserFriendlyMessage(errorReport.type);
    notify.error(userMessage, { duration: 5000 });

    // Execute fallback recovery strategy
    const recoveryStrategy = this.recoveryStrategies.get(errorReport.type);
    if (recoveryStrategy?.fallback) {
      try {
        await recoveryStrategy.fallback();
        Logger.info('Fallback recovery applied for error:', errorReport.id);
      } catch (recoveryError) {
        Logger.error('Fallback recovery failed:', recoveryError);
      }
    }

    // Log final error state
    Logger.error('Email operation failed permanently:', {
      errorId: errorReport.id,
      type: errorReport.type,
      context: errorReport.context
    });

    return {
      shouldRetry: false,
      error: errorReport,
      userMessage,
      fallbackApplied: !!recoveryStrategy?.fallback
    };
  }

  /**
   * Classify error type based on error object
   */
  classifyError(error) {
    const message = (error.message || '').toLowerCase();
    const code = error.code || error.status;

    // Network errors
    if (message.includes('network') || message.includes('connection') || code === 'NETWORK_ERROR') {
      return 'NETWORK_ERROR';
    }
    if (message.includes('timeout') || code === 'TIMEOUT') {
      return 'TIMEOUT_ERROR';
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication') || code === 401) {
      return 'AUTH_ERROR';
    }
    if (message.includes('token') && message.includes('expired') || code === 'TOKEN_EXPIRED') {
      return 'TOKEN_EXPIRED';
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests') || code === 429) {
      return 'RATE_LIMIT_ERROR';
    }

    // Server errors
    if (code >= 500 && code < 600) {
      return 'TEMPORARY_SERVER_ERROR';
    }
    if (message.includes('service unavailable') || code === 503) {
      return 'SERVICE_UNAVAILABLE';
    }

    // Email-specific errors
    if (message.includes('invalid email') || message.includes('email format')) {
      return 'INVALID_EMAIL_FORMAT';
    }
    if (message.includes('attachment') && message.includes('size')) {
      return 'ATTACHMENT_TOO_LARGE';
    }
    if (message.includes('recipient not found') || code === 'RECIPIENT_NOT_FOUND') {
      return 'RECIPIENT_NOT_FOUND';
    }

    // Storage errors
    if (message.includes('storage') || message.includes('database')) {
      return 'STORAGE_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine if error type is retryable
   */
  isRetryableError(errorType) {
    return this.retryConfig.retryableErrors.includes(errorType);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
      this.retryConfig.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(errorType) {
    return this.errorMessages[errorType] || this.errorMessages.UNKNOWN_ERROR;
  }

  /**
   * Determine error severity
   */
  determineSeverity(errorType) {
    const criticalErrors = ['AUTH_ERROR', 'STORAGE_ERROR'];
    const highErrors = ['NETWORK_ERROR', 'SERVICE_UNAVAILABLE'];
    const mediumErrors = ['RATE_LIMIT_ERROR', 'TIMEOUT_ERROR'];

    if (criticalErrors.includes(errorType)) return ErrorSeverity.CRITICAL;
    if (highErrors.includes(errorType)) return ErrorSeverity.HIGH;
    if (mediumErrors.includes(errorType)) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `email_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Recovery strategy implementations

  async checkNetworkConnection() {
    return navigator.onLine;
  }

  async scheduleRetry() {
    // Implementation depends on specific retry mechanism
    Logger.info('Scheduling retry for failed operation');
  }

  async enableOfflineMode() {
    // Trigger offline mode in email sync service
    Logger.info('Enabling offline mode due to network error');
  }

  async refreshAuthToken() {
    // Implementation depends on auth system
    Logger.info('Attempting to refresh authentication token');
  }

  async promptReauthentication() {
    // Show reauthentication UI
    notify.warning('Please sign in again to continue using email features.');
  }

  async disableAccount() {
    // Temporarily disable problematic email account
    Logger.warn('Disabling email account due to authentication failure');
  }

  async calculateBackoffDelay() {
    // Calculate appropriate backoff delay for rate limiting
    return this.retryConfig.baseDelay * 2;
  }

  async scheduleRetryWithBackoff() {
    // Schedule retry with calculated backoff
    Logger.info('Scheduling retry with backoff for rate limited operation');
  }

  async queueForLater() {
    // Queue operation for later execution
    Logger.info('Queueing operation for later execution');
  }

  async retryWithDifferentStorage() {
    // Try alternative storage method
    Logger.info('Retrying with alternative storage method');
  }

  async clearCacheAndRetry() {
    // Clear relevant caches and retry
    Logger.info('Clearing cache and retrying operation');
  }

  async saveToLocalStorage() {
    // Save to local storage as fallback
    Logger.info('Saving to local storage as fallback');
  }

  /**
   * Wrap email operations with error handling
   */
  async withErrorHandling(operation, context = {}) {
    let attempt = 1;
    
    while (attempt <= this.retryConfig.maxRetries + 1) {
      try {
        const result = await operation();
        
        // Log successful operation after retries
        if (attempt > 1) {
          Logger.info(`Email operation succeeded after ${attempt - 1} retries:`, context);
        }
        
        return { success: true, data: result };
      } catch (error) {
        const errorContext = { ...context, attempt };
        const errorResult = await this.handleEmailError(error, errorContext);
        
        if (!errorResult.shouldRetry) {
          return {
            success: false,
            error: errorResult.error,
            userMessage: errorResult.userMessage,
            errorId: errorResult.error?.id
          };
        }
        
        // Wait for retry delay
        if (errorResult.delay) {
          await new Promise(resolve => setTimeout(resolve, errorResult.delay));
        }
        
        attempt++;
      }
    }
    
    // Should not reach here, but handle just in case
    return {
      success: false,
      error: { message: 'Maximum retries exceeded' },
      userMessage: 'Operation failed after multiple attempts. Please try again later.'
    };
  }
}

// Export singleton instance with lazy initialization
let emailErrorHandlerInstance = null;

export const getEmailErrorHandler = () => {
  if (!emailErrorHandlerInstance) {
    emailErrorHandlerInstance = new EmailErrorHandler();
  }
  return emailErrorHandlerInstance;
};

// Export default instance for backward compatibility
const emailErrorHandler = getEmailErrorHandler();
export default emailErrorHandler;
