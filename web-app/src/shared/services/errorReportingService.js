/**
 * Error Reporting Service
 * Handles error reporting and user feedback collection
 */

import { errorMonitor } from '@utils/ErrorMonitor';
import Logger from '@utils/Logger';

class ErrorReportingService {
  /**
   * Report an error to the monitoring system
   * @param {Error} error - The error to report
   * @param {Object} context - Additional context information
   * @returns {Promise<Object>} Report result
   */
  async reportError(error, context = {}) {
    try {
      const errorId = errorMonitor.captureError({
        message: error.message || 'Unknown error',
        stack: error.stack,
        type: this.determineErrorType(error, context),
        severity: this.determineSeverity(error, context),
        additionalData: {
          context,
          timestamp: new Date().toISOString(),
        },
      });

      Logger.error('Error reported:', { errorId, error: error.message, context });

      return {
        success: true,
        errorId,
      };
    } catch (reportingError) {
      Logger.error('Failed to report error:', reportingError);
      return {
        success: false,
        error: reportingError.message,
      };
    }
  }

  /**
   * Report user feedback about an error
   * @param {Object} feedback - User feedback data
   * @returns {Promise<Object>} Feedback submission result
   */
  async reportUserFeedback(feedback) {
    try {
      const { errorId, message, userEmail, severity, category } = feedback;

      // Log the feedback
      Logger.info('User feedback received:', {
        errorId,
        message: message?.substring(0, 100), // Truncate for logging
        userEmail,
        severity,
        category,
        timestamp: new Date().toISOString(),
      });

      // In a real implementation, this would send to an external service
      // For now, we'll just simulate success
      return {
        success: true,
        feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      Logger.error('Failed to submit user feedback:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Determine error type based on error and context
   * @private
   */
  determineErrorType(error, context) {
    if (context.component) return 'component';
    if (error.message?.includes('network') || error.message?.includes('fetch')) return 'network';
    if (error.message?.includes('permission')) return 'permission';
    if (error.message?.includes('validation')) return 'validation';
    return 'javascript';
  }

  /**
   * Determine error severity
   * @private
   */
  determineSeverity(error, context) {
    if (error.message?.includes('critical') || context.severity === 'critical') return 'critical';
    if (error.message?.includes('network') || error.message?.includes('permission')) return 'high';
    if (context.component) return 'medium';
    return 'low';
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return errorMonitor.getErrorStatistics();
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    errorMonitor.clearErrors();
  }
}

export default new ErrorReportingService();