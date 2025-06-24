// Logger mock for comprehensive testing
// This file provides detailed mocks for all logging functionality

import { jest } from '@jest/globals';

// Log levels enum
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

// Mock log entry structure
export const createLogEntry = (level, message, meta = {}, timestamp = new Date()) => ({
  level,
  message,
  meta,
  timestamp: timestamp.toISOString(),
  id: Math.random().toString(36).substr(2, 9),
});

// Mock Logger class
export class MockLogger {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.INFO;
    this.context = options.context || 'test';
    this.logs = [];
    this.transports = options.transports || [];
    this.silent = options.silent || false;
    
    // Bind methods to preserve context
    this.error = this.error.bind(this);
    this.warn = this.warn.bind(this);
    this.info = this.info.bind(this);
    this.debug = this.debug.bind(this);
    this.trace = this.trace.bind(this);
    this.log = this.log.bind(this);
  }
  
  // Core logging method
  log(level, message, meta = {}) {
    if (this.silent || level > this.level) {
      return;
    }
    
    const logEntry = createLogEntry(level, message, {
      context: this.context,
      ...meta,
    });
    
    this.logs.push(logEntry);
    
    // Simulate transport behavior
    this.transports.forEach(transport => {
      if (transport.log) {
        transport.log(logEntry);
      }
    });
    
    return logEntry;
  }
  
  // Level-specific methods
  error(message, meta = {}) {
    return this.log(LOG_LEVELS.ERROR, message, meta);
  }
  
  warn(message, meta = {}) {
    return this.log(LOG_LEVELS.WARN, message, meta);
  }
  
  info(message, meta = {}) {
    return this.log(LOG_LEVELS.INFO, message, meta);
  }
  
  debug(message, meta = {}) {
    return this.log(LOG_LEVELS.DEBUG, message, meta);
  }
  
  trace(message, meta = {}) {
    return this.log(LOG_LEVELS.TRACE, message, meta);
  }
  
  // Utility methods
  setLevel(level) {
    this.level = level;
  }
  
  setContext(context) {
    this.context = context;
  }
  
  setSilent(silent) {
    this.silent = silent;
  }
  
  // Child logger creation
  child(options = {}) {
    return new MockLogger({
      level: this.level,
      context: options.context || this.context,
      transports: this.transports,
      silent: this.silent,
      ...options,
    });
  }
  
  // Performance logging
  time(label) {
    const startTime = Date.now();
    this.debug(`Timer started: ${label}`);
    
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.debug(`Timer ended: ${label}`, { duration });
        return duration;
      },
    };
  }
  
  // Profiling
  profile(label) {
    const startTime = process.hrtime ? process.hrtime() : [0, Date.now() * 1000000];
    this.debug(`Profile started: ${label}`);
    
    return {
      done: () => {
        const diff = process.hrtime ? process.hrtime(startTime) : [0, (Date.now() * 1000000) - startTime[1]];
        const duration = diff[0] * 1000 + diff[1] * 1e-6;
        this.debug(`Profile completed: ${label}`, { duration });
        return duration;
      },
    };
  }
  
  // Query methods for testing
  getLogs(level = null) {
    if (level === null) {
      return [...this.logs];
    }
    return this.logs.filter(log => log.level === level);
  }
  
  getErrorLogs() {
    return this.getLogs(LOG_LEVELS.ERROR);
  }
  
  getWarnLogs() {
    return this.getLogs(LOG_LEVELS.WARN);
  }
  
  getInfoLogs() {
    return this.getLogs(LOG_LEVELS.INFO);
  }
  
  getDebugLogs() {
    return this.getLogs(LOG_LEVELS.DEBUG);
  }
  
  getTraceLogs() {
    return this.getLogs(LOG_LEVELS.TRACE);
  }
  
  // Search methods
  findLogs(predicate) {
    return this.logs.filter(predicate);
  }
  
  findLogsByMessage(message) {
    return this.logs.filter(log => 
      log.message.includes(message)
    );
  }
  
  findLogsByContext(context) {
    return this.logs.filter(log => 
      log.meta.context === context
    );
  }
  
  // Statistics
  getLogCount(level = null) {
    return this.getLogs(level).length;
  }
  
  getLogStats() {
    return {
      total: this.logs.length,
      error: this.getLogCount(LOG_LEVELS.ERROR),
      warn: this.getLogCount(LOG_LEVELS.WARN),
      info: this.getLogCount(LOG_LEVELS.INFO),
      debug: this.getLogCount(LOG_LEVELS.DEBUG),
      trace: this.getLogCount(LOG_LEVELS.TRACE),
    };
  }
  
  // Test utilities
  clear() {
    this.logs = [];
  }
  
  hasLogs(level = null) {
    return this.getLogCount(level) > 0;
  }
  
  hasErrorLogs() {
    return this.hasLogs(LOG_LEVELS.ERROR);
  }
  
  hasWarnLogs() {
    return this.hasLogs(LOG_LEVELS.WARN);
  }
  
  getLastLog(level = null) {
    const logs = this.getLogs(level);
    return logs.length > 0 ? logs[logs.length - 1] : null;
  }
  
  getFirstLog(level = null) {
    const logs = this.getLogs(level);
    return logs.length > 0 ? logs[0] : null;
  }
  
  // Assertion helpers
  expectLog(level, message, meta = {}) {
    const logs = this.getLogs(level);
    const matchingLog = logs.find(log => {
      if (log.message !== message) return false;
      
      // Check meta properties
      for (const [key, value] of Object.entries(meta)) {
        if (log.meta[key] !== value) return false;
      }
      
      return true;
    });
    
    return {
      found: !!matchingLog,
      log: matchingLog,
      allLogs: logs,
    };
  }
  
  expectError(message, meta = {}) {
    return this.expectLog(LOG_LEVELS.ERROR, message, meta);
  }
  
  expectWarn(message, meta = {}) {
    return this.expectLog(LOG_LEVELS.WARN, message, meta);
  }
  
  expectInfo(message, meta = {}) {
    return this.expectLog(LOG_LEVELS.INFO, message, meta);
  }
  
  expectDebug(message, meta = {}) {
    return this.expectLog(LOG_LEVELS.DEBUG, message, meta);
  }
}

// Mock transport classes
export class MockConsoleTransport {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.INFO;
    this.colorize = options.colorize || false;
    this.logs = [];
  }
  
  log(logEntry) {
    if (logEntry.level <= this.level) {
      this.logs.push(logEntry);
      
      // Simulate console output
      const levelName = Object.keys(LOG_LEVELS)[logEntry.level];
      const message = this.colorize 
        ? `\x1b[36m[${levelName}]\x1b[0m ${logEntry.message}`
        : `[${levelName}] ${logEntry.message}`;
      
      // Don't actually log to console in tests
      // console.log(message);
    }
  }
  
  getLogs() {
    return [...this.logs];
  }
  
  clear() {
    this.logs = [];
  }
}

export class MockFileTransport {
  constructor(options = {}) {
    this.filename = options.filename || 'test.log';
    this.level = options.level || LOG_LEVELS.INFO;
    this.maxSize = options.maxSize || 1024 * 1024; // 1MB
    this.logs = [];
    this.files = new Map(); // Simulate file system
  }
  
  log(logEntry) {
    if (logEntry.level <= this.level) {
      this.logs.push(logEntry);
      
      // Simulate writing to file
      const logLine = `${logEntry.timestamp} [${Object.keys(LOG_LEVELS)[logEntry.level]}] ${logEntry.message}\n`;
      
      if (!this.files.has(this.filename)) {
        this.files.set(this.filename, '');
      }
      
      let currentContent = this.files.get(this.filename);
      
      // Check file size limit
      if (currentContent.length + logLine.length > this.maxSize) {
        // Rotate file
        this.files.set(`${this.filename}.old`, currentContent);
        currentContent = '';
      }
      
      this.files.set(this.filename, currentContent + logLine);
    }
  }
  
  getLogs() {
    return [...this.logs];
  }
  
  getFileContent(filename = null) {
    return this.files.get(filename || this.filename) || '';
  }
  
  clear() {
    this.logs = [];
    this.files.clear();
  }
}

// Factory functions
export const createMockLogger = (options = {}) => {
  return new MockLogger(options);
};

export const createMockConsoleTransport = (options = {}) => {
  return new MockConsoleTransport(options);
};

export const createMockFileTransport = (options = {}) => {
  return new MockFileTransport(options);
};

// Global logger instance for testing
let globalMockLogger = null;

export const getGlobalMockLogger = () => {
  if (!globalMockLogger) {
    globalMockLogger = createMockLogger({
      level: LOG_LEVELS.DEBUG,
      context: 'global',
    });
  }
  return globalMockLogger;
};

export const setGlobalMockLogger = (logger) => {
  globalMockLogger = logger;
};

export const resetGlobalMockLogger = () => {
  globalMockLogger = null;
};

// Jest mock functions
export const mockLoggerFunctions = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  log: jest.fn(),
  child: jest.fn(() => mockLoggerFunctions),
  time: jest.fn(() => ({ end: jest.fn() })),
  profile: jest.fn(() => ({ done: jest.fn() })),
  setLevel: jest.fn(),
  setContext: jest.fn(),
  setSilent: jest.fn(),
};

// Default export - simple mock logger
export default createMockLogger();

// Helper function to create logger mock with spies
export const createLoggerWithSpies = (options = {}) => {
  const logger = createMockLogger(options);
  
  // Add Jest spies to all methods
  jest.spyOn(logger, 'error');
  jest.spyOn(logger, 'warn');
  jest.spyOn(logger, 'info');
  jest.spyOn(logger, 'debug');
  jest.spyOn(logger, 'trace');
  jest.spyOn(logger, 'log');
  jest.spyOn(logger, 'child');
  jest.spyOn(logger, 'time');
  jest.spyOn(logger, 'profile');
  
  return logger;
};

// Test utilities
export const loggerTestUtils = {
  // Create a logger that captures all logs
  createCapturingLogger: (options = {}) => {
    return createMockLogger({
      level: LOG_LEVELS.TRACE,
      silent: false,
      ...options,
    });
  },
  
  // Create a silent logger for performance tests
  createSilentLogger: (options = {}) => {
    return createMockLogger({
      silent: true,
      ...options,
    });
  },
  
  // Create a logger with specific transports
  createLoggerWithTransports: (transports = [], options = {}) => {
    return createMockLogger({
      transports,
      ...options,
    });
  },
  
  // Assertion helpers
  expectLoggerToHaveBeenCalledWith: (logger, level, message, meta = {}) => {
    const result = logger.expectLog(level, message, meta);
    return result.found;
  },
  
  expectLoggerToHaveErrors: (logger) => {
    return logger.hasErrorLogs();
  },
  
  expectLoggerToHaveWarnings: (logger) => {
    return logger.hasWarnLogs();
  },
  
  // Performance testing
  measureLoggingPerformance: (logger, iterations = 1000) => {
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      logger.info(`Test message ${i}`, { iteration: i });
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const logsPerSecond = (iterations / duration) * 1000;
    
    return {
      duration,
      iterations,
      logsPerSecond,
      averageTimePerLog: duration / iterations,
    };
  },
};