// Error recovery service for scanner operations
import type { OCRError, OCRProvider } from '@/types/scanner';
import { captureError, addBreadcrumb } from '@/lib/sentry';
import Logger from '@/utils/Logger';

export enum ErrorType {
  CAMERA_ACCESS = 'camera_access',
  FILE_UPLOAD = 'file_upload',
  IMAGE_PROCESSING = 'image_processing',
  OCR_EXTRACTION = 'ocr_extraction',
  NETWORK = 'network',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  QUOTA = 'quota',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export enum RecoveryAction {
  RETRY = 'retry',
  FALLBACK_PROVIDER = 'fallback_provider',
  REDUCE_QUALITY = 'reduce_quality',
  SIMPLIFY_REQUEST = 'simplify_request',
  MANUAL_INPUT = 'manual_input',
  SWITCH_METHOD = 'switch_method',
  WAIT_AND_RETRY = 'wait_and_retry',
  CLEAR_CACHE = 'clear_cache',
  REQUEST_PERMISSION = 'request_permission',
  NONE = 'none'
}

export interface ErrorRecoveryStrategy {
  errorType: ErrorType;
  maxRetries: number;
  retryDelay: number;
  actions: RecoveryAction[];
  userMessage: string;
  technicalMessage?: string;
  isRecoverable: boolean;
}

export interface RecoveryResult {
  success: boolean;
  action: RecoveryAction;
  message: string;
  data?: any;
  shouldRetry: boolean;
  retryDelay?: number;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private recoveryStrategies: Map<ErrorType, ErrorRecoveryStrategy>;
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {
    this.recoveryStrategies = this.initializeRecoveryStrategies();
  }

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  private initializeRecoveryStrategies(): Map<ErrorType, ErrorRecoveryStrategy> {
    const strategies = new Map<ErrorType, ErrorRecoveryStrategy>();

    strategies.set(ErrorType.CAMERA_ACCESS, {
      errorType: ErrorType.CAMERA_ACCESS,
      maxRetries: 2,
      retryDelay: 1000,
      actions: [RecoveryAction.REQUEST_PERMISSION, RecoveryAction.SWITCH_METHOD],
      userMessage: 'Camera access denied. Please enable camera permissions or use file upload instead.',
      technicalMessage: 'getUserMedia failed - permission denied or camera unavailable',
      isRecoverable: true
    });

    strategies.set(ErrorType.FILE_UPLOAD, {
      errorType: ErrorType.FILE_UPLOAD,
      maxRetries: 3,
      retryDelay: 500,
      actions: [RecoveryAction.REDUCE_QUALITY, RecoveryAction.RETRY],
      userMessage: 'File upload failed. Please try a smaller file or different format.',
      technicalMessage: 'File upload error - size, format, or network issue',
      isRecoverable: true
    });

    strategies.set(ErrorType.IMAGE_PROCESSING, {
      errorType: ErrorType.IMAGE_PROCESSING,
      maxRetries: 2,
      retryDelay: 1000,
      actions: [RecoveryAction.REDUCE_QUALITY, RecoveryAction.SIMPLIFY_REQUEST, RecoveryAction.RETRY],
      userMessage: 'Image processing failed. Trying with reduced quality.',
      technicalMessage: 'Image processing pipeline error',
      isRecoverable: true
    });

    strategies.set(ErrorType.OCR_EXTRACTION, {
      errorType: ErrorType.OCR_EXTRACTION,
      maxRetries: 3,
      retryDelay: 2000,
      actions: [RecoveryAction.FALLBACK_PROVIDER, RecoveryAction.REDUCE_QUALITY, RecoveryAction.MANUAL_INPUT],
      userMessage: 'Text extraction failed. Trying alternative method.',
      technicalMessage: 'OCR service error - provider failure or image quality issue',
      isRecoverable: true
    });

    strategies.set(ErrorType.NETWORK, {
      errorType: ErrorType.NETWORK,
      maxRetries: 5,
      retryDelay: 3000,
      actions: [RecoveryAction.WAIT_AND_RETRY, RecoveryAction.FALLBACK_PROVIDER],
      userMessage: 'Network connection issue. Retrying...',
      technicalMessage: 'Network request failed - connectivity or server issue',
      isRecoverable: true
    });

    strategies.set(ErrorType.RATE_LIMIT, {
      errorType: ErrorType.RATE_LIMIT,
      maxRetries: 3,
      retryDelay: 60000, // 1 minute
      actions: [RecoveryAction.WAIT_AND_RETRY, RecoveryAction.FALLBACK_PROVIDER],
      userMessage: 'Service temporarily busy. Please wait a moment.',
      technicalMessage: 'Rate limit exceeded - need to wait or switch provider',
      isRecoverable: true
    });

    strategies.set(ErrorType.QUOTA, {
      errorType: ErrorType.QUOTA,
      maxRetries: 1,
      retryDelay: 0,
      actions: [RecoveryAction.FALLBACK_PROVIDER, RecoveryAction.MANUAL_INPUT],
      userMessage: 'Service quota exceeded. Switching to alternative method.',
      technicalMessage: 'API quota exceeded - need fallback provider',
      isRecoverable: true
    });

    strategies.set(ErrorType.TIMEOUT, {
      errorType: ErrorType.TIMEOUT,
      maxRetries: 2,
      retryDelay: 5000,
      actions: [RecoveryAction.SIMPLIFY_REQUEST, RecoveryAction.REDUCE_QUALITY, RecoveryAction.RETRY],
      userMessage: 'Request timed out. Trying with simplified processing.',
      technicalMessage: 'Request timeout - reduce complexity or retry',
      isRecoverable: true
    });

    strategies.set(ErrorType.STORAGE, {
      errorType: ErrorType.STORAGE,
      maxRetries: 3,
      retryDelay: 1000,
      actions: [RecoveryAction.CLEAR_CACHE, RecoveryAction.RETRY],
      userMessage: 'Storage error. Clearing cache and retrying.',
      technicalMessage: 'Storage operation failed - cache or database issue',
      isRecoverable: true
    });

    strategies.set(ErrorType.PERMISSION, {
      errorType: ErrorType.PERMISSION,
      maxRetries: 1,
      retryDelay: 0,
      actions: [RecoveryAction.REQUEST_PERMISSION, RecoveryAction.SWITCH_METHOD],
      userMessage: 'Permission required. Please grant access or use alternative method.',
      technicalMessage: 'Permission denied - need user authorization',
      isRecoverable: true
    });

    strategies.set(ErrorType.UNKNOWN, {
      errorType: ErrorType.UNKNOWN,
      maxRetries: 2,
      retryDelay: 2000,
      actions: [RecoveryAction.RETRY, RecoveryAction.MANUAL_INPUT],
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: 'Unknown error - generic retry strategy',
      isRecoverable: true
    });

    return strategies;
  }

  /**
   * Classify error type based on error message and context
   */
  classifyError(error: Error | OCRError, context?: Record<string, any>): ErrorType {
    const message = error.message.toLowerCase();
    
    // Check OCR-specific error codes first
    if ('code' in error) {
      const ocrError = error as OCRError;
      switch (ocrError.code) {
        case 'RATE_LIMITED':
          return ErrorType.RATE_LIMIT;
        case 'QUOTA_EXCEEDED':
          return ErrorType.QUOTA;
        case 'TIMEOUT':
          return ErrorType.TIMEOUT;
        case 'PROVIDER_UNAVAILABLE':
        case 'EXTRACTION_FAILED':
          return ErrorType.OCR_EXTRACTION;
        case 'NETWORK_ERROR':
          return ErrorType.NETWORK;
      }
    }

    // Classify based on error message
    if (message.includes('camera') || message.includes('getusermedia') || message.includes('notallowederror')) {
      return ErrorType.CAMERA_ACCESS;
    }
    
    if (message.includes('file') || message.includes('upload') || message.includes('size')) {
      return ErrorType.FILE_UPLOAD;
    }
    
    if (message.includes('processing') || message.includes('canvas') || message.includes('image')) {
      return ErrorType.IMAGE_PROCESSING;
    }
    
    if (message.includes('ocr') || message.includes('extract') || message.includes('text')) {
      return ErrorType.OCR_EXTRACTION;
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorType.NETWORK;
    }
    
    if (message.includes('storage') || message.includes('database') || message.includes('save')) {
      return ErrorType.STORAGE;
    }
    
    if (message.includes('permission') || message.includes('denied') || message.includes('unauthorized')) {
      return ErrorType.PERMISSION;
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.TIMEOUT;
    }
    
    if (message.includes('quota') || message.includes('limit exceeded')) {
      return ErrorType.QUOTA;
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorType.RATE_LIMIT;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Get recovery strategy for error type
   */
  getRecoveryStrategy(errorType: ErrorType): ErrorRecoveryStrategy | null {
    return this.recoveryStrategies.get(errorType) || null;
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(
    error: Error | OCRError,
    context: Record<string, any> = {}
  ): Promise<RecoveryResult> {
    const errorType = this.classifyError(error, context);
    const strategy = this.getRecoveryStrategy(errorType);
    
    if (!strategy || !strategy.isRecoverable) {
      return {
        success: false,
        action: RecoveryAction.NONE,
        message: 'Error is not recoverable',
        shouldRetry: false
      };
    }

    const errorKey = `${errorType}_${context.operation || 'unknown'}`;
    const currentAttempts = this.retryAttempts.get(errorKey) || 0;

    if (currentAttempts >= strategy.maxRetries) {
      this.retryAttempts.delete(errorKey);
      return {
        success: false,
        action: RecoveryAction.NONE,
        message: 'Maximum retry attempts exceeded',
        shouldRetry: false
      };
    }

    // Increment retry count
    this.retryAttempts.set(errorKey, currentAttempts + 1);

    // Log recovery attempt
    this.logRecoveryAttempt(error, errorType, strategy, currentAttempts + 1);

    // Try each recovery action in order
    for (const action of strategy.actions) {
      try {
        const result = await this.executeRecoveryAction(action, error, context, strategy);
        
        if (result.success) {
          // Reset retry count on success
          this.retryAttempts.delete(errorKey);
          return result;
        }
      } catch (recoveryError) {
        Logger.warn('Recovery action failed', action, recoveryError);
        continue; // Try next action
      }
    }

    // All recovery actions failed
    return {
      success: false,
      action: RecoveryAction.RETRY,
      message: strategy.userMessage,
      shouldRetry: currentAttempts < strategy.maxRetries,
      retryDelay: strategy.retryDelay
    };
  }

  /**
   * Execute specific recovery action
   */
  private async executeRecoveryAction(
    action: RecoveryAction,
    error: Error | OCRError,
    context: Record<string, any>,
    strategy: ErrorRecoveryStrategy
  ): Promise<RecoveryResult> {
    switch (action) {
      case RecoveryAction.RETRY:
        return {
          success: true,
          action,
          message: 'Retrying operation...',
          shouldRetry: true,
          retryDelay: strategy.retryDelay
        };

      case RecoveryAction.FALLBACK_PROVIDER:
        return await this.handleFallbackProvider(context);

      case RecoveryAction.REDUCE_QUALITY:
        return await this.handleReduceQuality(context);

      case RecoveryAction.SIMPLIFY_REQUEST:
        return await this.handleSimplifyRequest(context);

      case RecoveryAction.MANUAL_INPUT:
        return {
          success: true,
          action,
          message: 'Switching to manual text input',
          data: { useManualInput: true },
          shouldRetry: false
        };

      case RecoveryAction.SWITCH_METHOD:
        return {
          success: true,
          action,
          message: 'Switching to alternative input method',
          data: { switchToUpload: true },
          shouldRetry: false
        };

      case RecoveryAction.WAIT_AND_RETRY:
        return {
          success: true,
          action,
          message: `Waiting ${strategy.retryDelay / 1000} seconds before retry...`,
          shouldRetry: true,
          retryDelay: strategy.retryDelay
        };

      case RecoveryAction.CLEAR_CACHE:
        return await this.handleClearCache(context);

      case RecoveryAction.REQUEST_PERMISSION:
        return await this.handleRequestPermission(context);

      default:
        return {
          success: false,
          action,
          message: 'Recovery action not implemented',
          shouldRetry: false
        };
    }
  }

  private async handleFallbackProvider(context: Record<string, any>): Promise<RecoveryResult> {
    // This would integrate with the OCR provider factory to switch providers
    return {
      success: true,
      action: RecoveryAction.FALLBACK_PROVIDER,
      message: 'Switching to alternative text extraction service',
      data: { useFallbackProvider: true },
      shouldRetry: true
    };
  }

  private async handleReduceQuality(context: Record<string, any>): Promise<RecoveryResult> {
    return {
      success: true,
      action: RecoveryAction.REDUCE_QUALITY,
      message: 'Reducing image quality for faster processing',
      data: { reduceQuality: true, qualityReduction: 0.3 },
      shouldRetry: true
    };
  }

  private async handleSimplifyRequest(context: Record<string, any>): Promise<RecoveryResult> {
    return {
      success: true,
      action: RecoveryAction.SIMPLIFY_REQUEST,
      message: 'Simplifying processing options',
      data: { 
        simplifyRequest: true, 
        disableTableDetection: true,
        reduceTimeout: true 
      },
      shouldRetry: true
    };
  }

  private async handleClearCache(context: Record<string, any>): Promise<RecoveryResult> {
    try {
      // Clear relevant caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.includes('scanner') || name.includes('ocr'))
            .map(name => caches.delete(name))
        );
      }

      // Clear localStorage items related to scanner
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('scanner') || key.includes('ocr'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      return {
        success: true,
        action: RecoveryAction.CLEAR_CACHE,
        message: 'Cache cleared successfully',
        shouldRetry: true
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.CLEAR_CACHE,
        message: 'Failed to clear cache',
        shouldRetry: false
      };
    }
  }

  private async handleRequestPermission(context: Record<string, any>): Promise<RecoveryResult> {
    try {
      if (context.permissionType === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, just testing permission
        
        return {
          success: true,
          action: RecoveryAction.REQUEST_PERMISSION,
          message: 'Camera permission granted',
          shouldRetry: true
        };
      }

      return {
        success: false,
        action: RecoveryAction.REQUEST_PERMISSION,
        message: 'Unknown permission type',
        shouldRetry: false
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.REQUEST_PERMISSION,
        message: 'Permission denied',
        shouldRetry: false
      };
    }
  }

  private logRecoveryAttempt(
    error: Error | OCRError,
    errorType: ErrorType,
    strategy: ErrorRecoveryStrategy,
    attempt: number
  ): void {
    const logData = {
      errorType,
      errorMessage: error.message,
      attempt,
      maxRetries: strategy.maxRetries,
      actions: strategy.actions,
      timestamp: new Date().toISOString()
    };

    Logger.info('Error recovery attempt', JSON.stringify(logData));

    // Add breadcrumb for Sentry
    addBreadcrumb(
      'Error recovery attempt',
      'info',
      {
        errorType,
        attempt,
        maxRetries: strategy.maxRetries,
        errorMessage: error.message
      },
      'info'
    );

    // Capture error context in Sentry
    if (attempt === 1) {
      const errorToCapture = error instanceof Error ? error : new Error(error.message || 'Unknown OCR error');
      captureError(errorToCapture, {
        component: 'ErrorRecoveryService',
        action: 'error_recovery_initiated',
        extra: {
          errorType,
          strategy: strategy.actions,
          isRecoverable: strategy.isRecoverable
        }
      });
    }
  }

  /**
   * Reset retry attempts for a specific operation
   */
  resetRetryAttempts(operation: string): void {
    const keysToDelete = Array.from(this.retryAttempts.keys())
      .filter(key => key.includes(operation));
    
    keysToDelete.forEach(key => this.retryAttempts.delete(key));
  }

  /**
   * Get current retry count for an operation
   */
  getRetryCount(errorType: ErrorType, operation: string): number {
    const errorKey = `${errorType}_${operation}`;
    return this.retryAttempts.get(errorKey) || 0;
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: Error | OCRError, context?: Record<string, any>): boolean {
    const errorType = this.classifyError(error, context);
    const strategy = this.getRecoveryStrategy(errorType);
    return strategy?.isRecoverable ?? false;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: Error | OCRError, context?: Record<string, any>): string {
    const errorType = this.classifyError(error, context);
    const strategy = this.getRecoveryStrategy(errorType);
    return strategy?.userMessage || 'An unexpected error occurred. Please try again.';
  }
}

export default ErrorRecoveryService;