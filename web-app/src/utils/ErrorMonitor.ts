/**
 * Comprehensive Error Monitoring and Reporting System
 * Captures, categorizes, and reports application errors
 */

import React from 'react';

// Environment variable access that works in both Vite and Jest
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // In test environment, use process.env
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return process.env[key] || defaultValue;
  }
  
  // Try to access import.meta.env safely
  try {
    if (typeof window !== 'undefined' && (window as any).importMeta && (window as any).importMeta.env) {
      return (window as any).importMeta.env[key] || defaultValue;
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  
  // Fallback to process.env if available
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
};

const isDev = (): boolean => {
  return getEnvVar('MODE') === 'development' || getEnvVar('NODE_ENV') === 'development';
};

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: ErrorType;
  severity: ErrorSeverity;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  componentStack?: string;
  additionalData?: Record<string, any>;
  browserInfo: BrowserInfo;
  networkInfo?: NetworkInfo;
}

export enum ErrorType {
  JAVASCRIPT = 'javascript',
  PROMISE_REJECTION = 'promise_rejection',
  NETWORK = 'network',
  API = 'api',
  COMPONENT = 'component',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screenResolution: string;
  viewport: string;
}

interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface ErrorContext {
  component?: string;
  action?: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  route?: string;
  metadata?: Record<string, any>;
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: ErrorReport[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;
  private maxErrors: number = 100;
  private reportingEndpoint?: string;
  private errorContext: ErrorContext = {};

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle uncaught JavaScript errors
    window.addEventListener('error', event => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.toString(),
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.captureError({
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
        type: ErrorType.PROMISE_REJECTION,
        severity: ErrorSeverity.HIGH,
        additionalData: { reason: event.reason },
      });
    });

    // Handle network errors (basic)
    window.addEventListener('offline', () => {
      this.captureError({
        message: 'Network connection lost',
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        additionalData: { networkStatus: 'offline' },
      });
    });
  }

  /**
   * Capture and process an error
   */
  public captureError(errorData: Partial<ErrorReport> & { message: string }): string {
    if (!this.isEnabled) return '';

    const errorId = this.generateErrorId();
    const browserInfo = this.getBrowserInfo();
    const networkInfo = this.getNetworkInfo();

    const errorReport: ErrorReport = {
      id: errorId,
      message: errorData.message,
      stack: errorData.stack || new Error().stack,
      type: errorData.type || ErrorType.UNKNOWN,
      severity: errorData.severity || this.determineSeverity(errorData),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      componentStack: errorData.componentStack,
      additionalData: {
        ...errorData,
        context: this.errorContext,
      },
      browserInfo,
      networkInfo,
    };

    this.errors.push(errorReport);

    // Keep only the most recent errors to prevent memory leaks
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (isDev()) {
      this.logErrorToConsole(errorReport);
    }

    // Report to external service if configured
    if (this.reportingEndpoint) {
      this.reportErrorToService(errorReport);
    }

    return errorId;
  }

  /**
   * Capture React component errors
   */
  public captureComponentError(
    error: Error,
    componentName: string,
    props?: Record<string, any>,
    state?: Record<string, any>,
  ): string {
    return this.captureError({
      message: `Component error in ${componentName}: ${error.message}`,
      stack: error.stack,
      type: ErrorType.COMPONENT,
      severity: ErrorSeverity.MEDIUM,
      componentStack: error.stack,
      additionalData: {
        componentName,
        props: this.sanitizeData(props),
        state: this.sanitizeData(state),
      },
    });
  }

  /**
   * Capture API errors
   */
  public captureAPIError(
    endpoint: string,
    method: string,
    status: number,
    response?: any,
    requestData?: any,
  ): string {
    const severity = status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;

    return this.captureError({
      message: `API Error: ${method} ${endpoint} (${status})`,
      type: ErrorType.API,
      severity,
      additionalData: {
        endpoint,
        method,
        status,
        response: this.sanitizeData(response),
        requestData: this.sanitizeData(requestData),
      },
    });
  }

  /**
   * Capture authentication errors
   */
  public captureAuthError(message: string, additionalData?: Record<string, any>): string {
    return this.captureError({
      message: `Authentication Error: ${message}`,
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      additionalData,
    });
  }

  /**
   * Capture validation errors
   */
  public captureValidationError(field: string, value: any, rule: string, message: string): string {
    return this.captureError({
      message: `Validation Error: ${message}`,
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      additionalData: {
        field,
        value: this.sanitizeData(value),
        rule,
      },
    });
  }

  /**
   * Set error context for enhanced reporting
   */
  public setContext(context: ErrorContext): void {
    this.errorContext = { ...this.errorContext, ...context };
  }

  /**
   * Clear error context
   */
  public clearContext(): void {
    this.errorContext = {};
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const cookieEnabled = navigator.cookieEnabled;
    const onLine = navigator.onLine;

    // Basic browser detection
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    // OS detection
    let os = 'Unknown';
    if (platform.includes('Win')) os = 'Windows';
    else if (platform.includes('Mac')) os = 'macOS';
    else if (platform.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return {
      name: browserName,
      version: browserVersion,
      os,
      platform,
      language,
      cookieEnabled,
      onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): NetworkInfo | undefined {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return undefined;
  }

  /**
   * Determine error severity based on error data
   */
  private determineSeverity(errorData: Partial<ErrorReport>): ErrorSeverity {
    if (errorData.severity === ErrorSeverity.CRITICAL) return ErrorSeverity.CRITICAL;
    if (errorData.type === ErrorType.AUTHENTICATION) return ErrorSeverity.HIGH;
    if (errorData.type === ErrorType.API && errorData.additionalData?.status >= 500) {
      return ErrorSeverity.HIGH;
    }
    if (errorData.type === ErrorType.VALIDATION) return ErrorSeverity.LOW;
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveKeys = ['password', 'token', 'api_key', 'secret', 'auth', 'credential'];

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      for (const key in sanitized) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Log error to console with formatting
   */
  private logErrorToConsole(error: ErrorReport): void {
    const style = this.getConsoleStyle(error.severity);

    console.group(`%c🚨 Error ${error.id} - ${error.severity.toUpperCase()}`, style);
    console.error('Message:', error.message);
    console.error('Type:', error.type);
    console.error('Timestamp:', new Date(error.timestamp).toISOString());
    console.error('URL:', error.url);

    if (error.stack) {
      console.error('Stack:', error.stack);
    }

    if (error.additionalData) {
      console.error('Additional Data:', error.additionalData);
    }

    console.groupEnd();
  }

  /**
   * Get console style based on severity
   */
  private getConsoleStyle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'color: white; background-color: #dc2626; font-weight: bold; padding: 2px 6px;';
      case ErrorSeverity.HIGH:
        return 'color: white; background-color: #ea580c; font-weight: bold; padding: 2px 6px;';
      case ErrorSeverity.MEDIUM:
        return 'color: white; background-color: #d97706; font-weight: bold; padding: 2px 6px;';
      case ErrorSeverity.LOW:
        return 'color: white; background-color: #65a30d; font-weight: bold; padding: 2px 6px;';
      default:
        return 'color: white; background-color: #6b7280; font-weight: bold; padding: 2px 6px;';
    }
  }

  /**
   * Report error to external service
   */
  private async reportErrorToService(error: ErrorReport): Promise<void> {
    if (!this.reportingEndpoint) return;

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (reportingError) {
      console.warn('Failed to report error to external service:', reportingError);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
    errorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentErrors = this.errors.filter(error => error.timestamp > oneHourAgo);

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: recentErrors.slice(-10),
      errorRate: recentErrors.length / 60, // errors per minute in last hour
    };
  }

  /**
   * Export errors for analysis
   */
  public exportErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors.length = 0;
  }

  /**
   * Configure reporting endpoint
   */
  public setReportingEndpoint(endpoint: string): void {
    this.reportingEndpoint = endpoint;
  }

  /**
   * Enable/disable error monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set user ID for error tracking
   */
  public setUserId(userId: string): void {
    this.errorContext.metadata = {
      ...this.errorContext.metadata,
      userId,
    };
  }
}

// Singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// React Error Boundary integration
export interface ErrorBoundaryState {
  hasError: boolean;
  errorId?: string;
}

export function createErrorBoundary(fallback: React.ComponentType<{ errorId: string }>) {
  return class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{}>,
    ErrorBoundaryState
  > {
    constructor(props: React.PropsWithChildren<{}>) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      const errorId = errorMonitor.captureComponentError(error, 'ErrorBoundary', {}, {});
      return { hasError: true, errorId };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      errorMonitor.captureComponentError(
        error,
        'ErrorBoundary',
        {},
        { componentStack: errorInfo.componentStack },
      );
    }

    render() {
      if (this.state.hasError && this.state.errorId) {
        return React.createElement(fallback, { errorId: this.state.errorId });
      }

      return this.props.children;
    }
  };
}

// Utility functions for common error scenarios
export function withErrorHandling<T extends (...args: any[]) => any>(fn: T, context?: string): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch(error => {
          errorMonitor.captureError({
            message: `Async function error in ${context || 'unknown'}: ${error.message}`,
            stack: error.stack,
            type: ErrorType.JAVASCRIPT,
            severity: ErrorSeverity.MEDIUM,
            additionalData: { context, args: args.slice(0, 2) }, // Limit args to prevent large data
          });
          throw error;
        });
      }
      return result;
    } catch (error) {
      errorMonitor.captureError({
        message: `Function error in ${context || 'unknown'}: ${(error as Error).message}`,
        stack: (error as Error).stack,
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.MEDIUM,
        additionalData: { context, args: args.slice(0, 2) },
      });
      throw error;
    }
  }) as T;
}
