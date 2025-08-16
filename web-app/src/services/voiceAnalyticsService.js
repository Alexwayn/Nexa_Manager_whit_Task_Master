/**
 * Voice Command Analytics Service
 * Tracks voice command usage, recognition failures, and provides analytics data
 */

import Logger from '@/shared/utils/logger';

class VoiceAnalyticsService {
  constructor() {
    this.storageKey = 'voice_analytics';
    this.sessionKey = 'voice_session_data';
    this.maxStorageEntries = 500; // Limit storage to prevent excessive data
    this.currentSession = this.initializeSession();
    this.dataCache = null; // In-memory cache to ensure accumulation when storage mocks return null
    
    // Initialize analytics data structure
    this.initializeAnalyticsData();
    
    // Bind methods to preserve context
    this.trackCommand = this.trackCommand.bind(this);
    this.trackError = this.trackError.bind(this);
    this.trackSession = this.trackSession.bind(this);
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
      errors: [],
      sessions: []
    };

    const existingData = this.getStoredData();
    if (!existingData) {
      // Initialize cache with default data structure
      this.dataCache = defaultData;
      this.saveData(defaultData);
    } else {
      // Prime cache with existing data
      this.dataCache = existingData;
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
      if (data) {
        const parsed = JSON.parse(data);
        this.dataCache = parsed; // keep cache in sync with storage
        return parsed;
      }
      // Fall back to cache if storage is empty (useful in tests with mocked storage)
      // Return cache or initialize with empty structure if cache is also null
      return this.dataCache || { commands: [], errors: [], sessions: [] };
    } catch (error) {
      Logger.error('Error reading analytics data from storage:', error);
      // On parse error, prefer cache or empty baseline rather than crashing
      return this.dataCache || { commands: [], errors: [], sessions: [] };
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
      if (data.errors && data.errors.length > this.maxStorageEntries) {
        data.errors = data.errors.slice(-this.maxStorageEntries);
      }
      if (data.sessions && data.sessions.length > 100) {
        data.sessions = data.sessions.slice(-100); // Keep last 100 sessions
      }

      // Update in-memory cache first
      this.dataCache = { ...data };

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
      const timestamp = Date.now();
      const commandEntry = {
        command: commandData.command || commandData.originalCommand || '',
        originalCommand: commandData.originalCommand || commandData.command || '',
        normalizedCommand: commandData.normalizedCommand || commandData.command || '',
        action: commandData.action || '',
        actionType: commandData.actionType || '',
        executionTime: commandData.executionTime || 0,
        responseTime: commandData.responseTime !== undefined ? commandData.responseTime : (commandData.executionTime || 0),
        success: commandData.success !== false, // Default to true unless explicitly false
        confidence: commandData.confidence || 0,
        response: commandData.response || '',
        error: commandData.error || null,
        sessionId: commandData.sessionId || this.currentSession.id,
        timestamp,
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
      const existing = this.getStoredData() || { commands: [], errors: [], sessions: [] };
      const data = {
        ...existing,
        commands: [...(existing.commands || []), commandEntry]
      };
      this.saveData(data);

      Logger.debug('Voice command tracked:', commandEntry);
    } catch (error) {
      Logger.error('Error tracking voice command:', error);
    }
  }

  /**
   * Track errors (general purpose)
   */
  trackError(errorData) {
    try {
      const timestamp = Date.now();
      const errorEntry = {
        type: errorData.type || 'unknown',
        error: errorData.error || errorData.message || '',
        command: errorData.command || '',
        sessionId: errorData.sessionId || this.currentSession.id,
        timestamp,
        context: {
          currentPath: errorData.currentPath || '',
          userAgent: navigator.userAgent,
          language: navigator.language,
          timestamp
        }
      };

      // Add to current session
      this.currentSession.failures.push(errorEntry);

      // Add to persistent storage
      const existing = this.getStoredData() || { commands: [], errors: [], sessions: [] };
      const data = {
        ...existing,
        errors: [...(existing.errors || []), errorEntry]
      };
      this.saveData(data);

      Logger.debug('Voice error tracked:', errorEntry);
    } catch (error) {
      Logger.error('Error tracking voice error:', error);
    }
  }

  /**
   * Track a voice recognition failure
   */
  trackRecognitionFailure(failureData) {
    return this.trackError({
      type: 'recognition_error',
      error: failureData.error || failureData.errorMessage || '',
      recognizedText: failureData.recognizedText || '',
      confidence: failureData.confidence || 0,
      audioQuality: failureData.audioQuality || 'unknown',
      sessionId: failureData.sessionId,
      currentPath: failureData.currentPath
    });
  }

  /**
   * Track session data
   */
  trackSession(sessionData) {
    try {
      const existing = this.getStoredData() || { commands: [], errors: [], sessions: [] };
      
      const sessionEntry = {
        sessionId: sessionData.sessionId || this.generateSessionId(),
        startTime: sessionData.startTime || Date.now(),
        endTime: sessionData.endTime || null,
        commandCount: sessionData.commandCount || 0,
        successRate: sessionData.successRate || 0,
        averageConfidence: sessionData.averageConfidence || 0,
        userAgent: sessionData.userAgent || navigator.userAgent,
        duration: sessionData.endTime && sessionData.startTime ? 
          sessionData.endTime - sessionData.startTime : 0
      };

      const data = {
        ...existing,
        sessions: [...(existing.sessions || []), sessionEntry]
      };
      this.saveData(data);

      Logger.debug('Voice session tracked:', sessionEntry);
    } catch (error) {
      Logger.error('Error tracking voice session:', error);
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

      const endTime = Date.now();
      const startTime = new Date(this.currentSession.startTime).getTime();
      const duration = endTime - startTime;

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
      const existing = this.getStoredData() || { commands: [], errors: [], sessions: [] };
      const data = {
        ...existing,
        sessions: [...(existing.sessions || []), { ...this.currentSession }]
      };
      this.saveData(data);

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
   * Get analytics data
   */
  getAnalytics() {
    try {
      const data = this.getStoredData();
      return data || { commands: [], errors: [], sessions: [] };
    } catch (error) {
      Logger.error('Error getting analytics:', error);
      return { commands: [], errors: [], sessions: [] };
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    try {
      const data = this.getStoredData();
      if (!data) {
        return {
          totalCommands: 0,
          successfulCommands: 0,
          failedCommands: 0,
          successRate: 0,
          averageConfidence: 0,
          averageResponseTime: 0,
          totalSessions: 0,
          totalErrors: 0,
          mostCommonErrors: [],
          commandFrequency: {}
        };
      }

      const commands = data.commands || [];
      const errors = data.errors || [];
      const sessions = data.sessions || [];

      const successfulCommands = commands.filter(cmd => cmd.success).length;
      const failedCommands = commands.filter(cmd => !cmd.success).length;
      const totalCommands = commands.length;

      const successRate = totalCommands > 0 ? successfulCommands / totalCommands : 0;

      const averageConfidence = totalCommands > 0 ?
        commands.reduce((sum, cmd) => sum + (cmd.confidence || 0), 0) / totalCommands : 0;

      // Calculate average response time - include all commands with numeric responseTime
      const responseTimesArray = commands
        .map(cmd => cmd.responseTime)
        .filter(rt => typeof rt === 'number' && !Number.isNaN(rt));
      const averageResponseTime = responseTimesArray.length > 0
        ? responseTimesArray.reduce((sum, rt) => sum + rt, 0) / responseTimesArray.length
        : 0;

      // Command frequency
      const commandFrequency = {};
      commands.forEach(cmd => {
        const command = cmd.command || cmd.normalizedCommand || 'unknown';
        commandFrequency[command] = (commandFrequency[command] || 0) + 1;
      });

      // Most common errors
      const errorCounts = {};
      errors.forEach(error => {
        const errorType = error.type || 'unknown';
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      });

      const mostCommonErrors = Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => ({ type, count }));

      return {
        totalCommands,
        successfulCommands,
        failedCommands,
        successRate,
        averageConfidence,
        averageResponseTime,
        totalSessions: sessions.length,
        totalErrors: errors.length,
        mostCommonErrors,
        commandFrequency
      };
    } catch (error) {
      Logger.error('Error getting analytics summary:', error);
      return {
        totalCommands: 0,
        successfulCommands: 0,
        failedCommands: 0,
        successRate: 0,
        averageConfidence: 0,
        averageResponseTime: 0,
        totalSessions: 0,
        totalErrors: 0,
        mostCommonErrors: [],
        commandFrequency: {}
      };
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
        summary: this.getAnalyticsSummary()
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
        result.commands = filterByDate(data.commands || []).slice(-limit);
      }

      if (includeFailures) {
        result.failures = filterByDate(data.errors || []).slice(-limit);
      }

      if (includeSessions) {
        result.sessions = (data.sessions || []).slice(-limit);
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
        return data;
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
   * Import analytics data
   */
  importAnalytics(importData) {
    try {
      this.saveData(importData);
      Logger.info('Analytics data imported successfully');
    } catch (error) {
      Logger.error('Error importing analytics data:', error);
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
        const commandHeaders = ['Timestamp', 'Session ID', 'Command', 'Success', 'Confidence', 'Response Time'];
        const commandRows = data.commands.map(cmd => [
          cmd.timestamp,
          cmd.sessionId,
          cmd.command,
          cmd.success,
          cmd.confidence,
          cmd.responseTime
        ]);
        
        csvSections.push('COMMANDS');
        csvSections.push(commandHeaders.join(','));
        csvSections.push(...commandRows.map(row => row.join(',')));
        csvSections.push('');
      }

      // Errors CSV
      if (data.errors && data.errors.length > 0) {
        const errorHeaders = ['Timestamp', 'Session ID', 'Type', 'Error', 'Command'];
        const errorRows = data.errors.map(error => [
          error.timestamp,
          error.sessionId,
          error.type,
          error.error,
          error.command
        ]);
        
        csvSections.push('ERRORS');
        csvSections.push(errorHeaders.join(','));
        csvSections.push(...errorRows.map(row => row.join(',')));
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
      // Reset cache to default structure instead of null
      this.dataCache = { commands: [], errors: [], sessions: [] };
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
