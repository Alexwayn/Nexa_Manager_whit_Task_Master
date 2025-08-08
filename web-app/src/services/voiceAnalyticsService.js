/**
 * Voice Command Analytics Service
 * Tracks voice command usage, recognition failures, and provides analytics data
 */

import Logger from '@/utils/Logger';

class VoiceAnalyticsService {
  constructor() {
    this.storageKey = 'voice_analytics_data';
    this.sessionKey = 'voice_session_data';
    this.maxStorageEntries = 1000; // Limit storage to prevent excessive data
    this.currentSession = this.initializeSession();
    
    // Initialize analytics data structure
    this.initializeAnalyticsData();
    
    // Bind methods to preserve context
    this.trackCommand = this.trackCommand.bind(this);
    this.trackRecognitionFailure = this.trackRecognitionFailure.bind(this);
    this.trackSessionStart = this.trackSessionStart.bind(this);
    this.trackSessionEnd = this.trackSessionEnd.bind(this);
  }

  /**
   * Initialize analytics data structure
   */
  initializeAnalyticsData() {
    const defaultData = {
      commands: [],
      failures: [],
      sessions: [],
      summary: {
        totalCommands: 0,
        totalFailures: 0,
        totalSessions: 0,
        successRate: 100,
        mostUsedCommands: {},
        commonFailures: {},
        averageSessionDuration: 0,
        lastUpdated: new Date().toISOString()
      }
    };

    const existingData = this.getStoredData();
    if (!existingData) {
      this.saveData(defaultData);
    }
  }

  /**
   * Initialize a new session
   */
  initializeSession() {
    return {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      endTime: null,
      commands: [],
      failures: [],
      duration: 0,
      userAgent: navigator.userAgent,
      language: navigator.language,
      isActive: true
    };
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stored analytics data
   */
  getStoredData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      Logger.error('Error reading analytics data from storage:', error);
      return null;
    }
  }

  /**
   * Save analytics data to storage
   */
  saveData(data) {
    try {
      // Limit the number of stored entries to prevent excessive storage usage
      if (data.commands && data.commands.length > this.maxStorageEntries) {
        data.commands = data.commands.slice(-this.maxStorageEntries);
      }
      if (data.failures && data.failures.length > this.maxStorageEntries) {
        data.failures = data.failures.slice(-this.maxStorageEntries);
      }
      if (data.sessions && data.sessions.length > 100) {
        data.sessions = data.sessions.slice(-100); // Keep last 100 sessions
      }

      localStorage.setItem(this.storageKey, JSON.stringify(data));
      Logger.debug('Analytics data saved to storage');
    } catch (error) {
      Logger.error('Error saving analytics data to storage:', error);
    }
  }

  /**
   * Track a successful voice command
   */
  trackCommand(commandData) {
    try {
      const timestamp = new Date().toISOString();
      const commandEntry = {
        id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        sessionId: this.currentSession.id,
        originalCommand: commandData.originalCommand || '',
        normalizedCommand: commandData.normalizedCommand || '',
        action: commandData.action || '',
        actionType: commandData.actionType || '',
        executionTime: commandData.executionTime || 0,
        success: commandData.success !== false, // Default to true unless explicitly false
        response: commandData.response || '',
        context: {
          currentPath: commandData.currentPath || '',
          userAgent: navigator.userAgent,
          language: navigator.language,
          timestamp
        }
      };

      // Add to current session
      this.currentSession.commands.push(commandEntry);

      // Add to persistent storage
      const data = this.getStoredData();
      if (data) {
        data.commands.push(commandEntry);
        this.updateSummaryStats(data);
        this.saveData(data);
      }

      Logger.debug('Voice command tracked:', commandEntry);
    } catch (error) {
      Logger.error('Error tracking voice command:', error);
    }
  }

  /**
   * Track a voice recognition failure
   */
  trackRecognitionFailure(failureData) {
    try {
      const timestamp = new Date().toISOString();
      const failureEntry = {
        id: `fail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        sessionId: this.currentSession.id,
        recognizedText: failureData.recognizedText || '',
        errorType: failureData.errorType || 'unknown',
        errorMessage: failureData.errorMessage || '',
        confidence: failureData.confidence || 0,
        audioQuality: failureData.audioQuality || 'unknown',
        context: {
          currentPath: failureData.currentPath || '',
          userAgent: navigator.userAgent,
          language: navigator.language,
          timestamp
        }
      };

      // Add to current session
      this.currentSession.failures.push(failureEntry);

      // Add to persistent storage
      const data = this.getStoredData();
      if (data) {
        data.failures.push(failureEntry);
        this.updateSummaryStats(data);
        this.saveData(data);
      }

      Logger.debug('Voice recognition failure tracked:', failureEntry);
    } catch (error) {
      Logger.error('Error tracking voice recognition failure:', error);
    }
  }

  /**
   * Track session start
   */
  trackSessionStart(sessionData = {}) {
    try {
      this.currentSession = this.initializeSession();
      this.currentSession.startContext = {
        currentPath: sessionData.currentPath || '',
        userAgent: navigator.userAgent,
        language: navigator.language,
        microphonePermission: sessionData.microphonePermission || 'unknown',
        speechSynthesisSupport: 'speechSynthesis' in window,
        speechRecognitionSupport: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      };

      Logger.info('Voice session started:', this.currentSession.id);
    } catch (error) {
      Logger.error('Error tracking session start:', error);
    }
  }

  /**
   * Track session end
   */
  trackSessionEnd(sessionData = {}) {
    try {
      if (!this.currentSession.isActive) {
        return;
      }

      const endTime = new Date().toISOString();
      const startTime = new Date(this.currentSession.startTime);
      const duration = new Date(endTime) - startTime;

      this.currentSession.endTime = endTime;
      this.currentSession.duration = duration;
      this.currentSession.isActive = false;
      this.currentSession.endContext = {
        currentPath: sessionData.currentPath || '',
        reason: sessionData.reason || 'manual',
        totalCommands: this.currentSession.commands.length,
        totalFailures: this.currentSession.failures.length
      };

      // Save session to persistent storage
      const data = this.getStoredData();
      if (data) {
        data.sessions.push({ ...this.currentSession });
        this.updateSummaryStats(data);
        this.saveData(data);
      }

      Logger.info('Voice session ended:', {
        sessionId: this.currentSession.id,
        duration: duration,
        commands: this.currentSession.commands.length,
        failures: this.currentSession.failures.length
      });
    } catch (error) {
      Logger.error('Error tracking session end:', error);
    }
  }

  /**
   * Update summary statistics
   */
  updateSummaryStats(data) {
    try {
      const summary = data.summary;
      
      // Basic counts
      summary.totalCommands = data.commands.length;
      summary.totalFailures = data.failures.length;
      summary.totalSessions = data.sessions.length;
      
      // Success rate
      const totalAttempts = summary.totalCommands + summary.totalFailures;
      summary.successRate = totalAttempts > 0 ? 
        Math.round((summary.totalCommands / totalAttempts) * 100) : 100;

      // Most used commands
      summary.mostUsedCommands = this.calculateMostUsedCommands(data.commands);
      
      // Common failures
      summary.commonFailures = this.calculateCommonFailures(data.failures);
      
      // Average session duration
      summary.averageSessionDuration = this.calculateAverageSessionDuration(data.sessions);
      
      // Last updated
      summary.lastUpdated = new Date().toISOString();

    } catch (error) {
      Logger.error('Error updating summary stats:', error);
    }
  }

  /**
   * Calculate most used commands
   */
  calculateMostUsedCommands(commands) {
    const commandCounts = {};
    
    commands.forEach(cmd => {
      const key = cmd.normalizedCommand || cmd.originalCommand || 'unknown';
      commandCounts[key] = (commandCounts[key] || 0) + 1;
    });

    // Sort by usage count and return top 10
    return Object.entries(commandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  }

  /**
   * Calculate common failures
   */
  calculateCommonFailures(failures) {
    const failureCounts = {};
    
    failures.forEach(failure => {
      const key = failure.errorType || 'unknown';
      failureCounts[key] = (failureCounts[key] || 0) + 1;
    });

    // Sort by failure count and return top 10
    return Object.entries(failureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  }

  /**
   * Calculate average session duration
   */
  calculateAverageSessionDuration(sessions) {
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (session.duration || 0);
    }, 0);
    
    return Math.round(totalDuration / sessions.length);
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    try {
      const data = this.getStoredData();
      return data ? data.summary : null;
    } catch (error) {
      Logger.error('Error getting analytics summary:', error);
      return null;
    }
  }

  /**
   * Get detailed analytics data
   */
  getDetailedAnalytics(options = {}) {
    try {
      const data = this.getStoredData();
      if (!data) return null;

      const {
        startDate,
        endDate,
        limit = 100,
        includeCommands = true,
        includeFailures = true,
        includeSessions = true
      } = options;

      const result = {
        summary: data.summary
      };

      // Filter by date range if provided
      const filterByDate = (items) => {
        if (!startDate && !endDate) return items;
        
        return items.filter(item => {
          const itemDate = new Date(item.timestamp);
          if (startDate && itemDate < new Date(startDate)) return false;
          if (endDate && itemDate > new Date(endDate)) return false;
          return true;
        });
      };

      if (includeCommands) {
        result.commands = filterByDate(data.commands).slice(-limit);
      }

      if (includeFailures) {
        result.failures = filterByDate(data.failures).slice(-limit);
      }

      if (includeSessions) {
        result.sessions = data.sessions.slice(-limit);
      }

      return result;
    } catch (error) {
      Logger.error('Error getting detailed analytics:', error);
      return null;
    }
  }

  /**
   * Get current session data
   */
  getCurrentSession() {
    return { ...this.currentSession };
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format = 'json') {
    try {
      const data = this.getStoredData();
      if (!data) return null;

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }

      if (format === 'csv') {
        return this.convertToCSV(data);
      }

      return data;
    } catch (error) {
      Logger.error('Error exporting analytics:', error);
      return null;
    }
  }

  /**
   * Convert analytics data to CSV format
   */
  convertToCSV(data) {
    try {
      const csvSections = [];

      // Commands CSV
      if (data.commands && data.commands.length > 0) {
        const commandHeaders = ['Timestamp', 'Session ID', 'Original Command', 'Normalized Command', 'Action', 'Success', 'Execution Time', 'Response'];
        const commandRows = data.commands.map(cmd => [
          cmd.timestamp,
          cmd.sessionId,
          cmd.originalCommand,
          cmd.normalizedCommand,
          cmd.action,
          cmd.success,
          cmd.executionTime,
          cmd.response
        ]);
        
        csvSections.push('COMMANDS');
        csvSections.push(commandHeaders.join(','));
        csvSections.push(...commandRows.map(row => row.join(',')));
        csvSections.push('');
      }

      // Failures CSV
      if (data.failures && data.failures.length > 0) {
        const failureHeaders = ['Timestamp', 'Session ID', 'Recognized Text', 'Error Type', 'Error Message', 'Confidence'];
        const failureRows = data.failures.map(failure => [
          failure.timestamp,
          failure.sessionId,
          failure.recognizedText,
          failure.errorType,
          failure.errorMessage,
          failure.confidence
        ]);
        
        csvSections.push('FAILURES');
        csvSections.push(failureHeaders.join(','));
        csvSections.push(...failureRows.map(row => row.join(',')));
        csvSections.push('');
      }

      return csvSections.join('\n');
    } catch (error) {
      Logger.error('Error converting to CSV:', error);
      return '';
    }
  }

  /**
   * Clear analytics data
   */
  clearAnalytics() {
    try {
      localStorage.removeItem(this.storageKey);
      this.initializeAnalyticsData();
      Logger.info('Analytics data cleared');
    } catch (error) {
      Logger.error('Error clearing analytics data:', error);
    }
  }

  /**
   * Get analytics for a specific time period
   */
  getAnalyticsForPeriod(period = 'week') {
    try {
      const data = this.getStoredData();
      if (!data) return null;

      const now = new Date();
      let startDate;

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      return this.getDetailedAnalytics({
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      });
    } catch (error) {
      Logger.error('Error getting analytics for period:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const voiceAnalyticsService = new VoiceAnalyticsService();

export default voiceAnalyticsService;

// Export class for testing
export { VoiceAnalyticsService };
