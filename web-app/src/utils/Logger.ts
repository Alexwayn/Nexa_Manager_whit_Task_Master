/**
 * Simple Logger utility for the application
 * Provides consistent logging across the application with different log levels
 */

import { isDevelopment } from '@/utils/env';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];
type LogLevelName = keyof typeof LOG_LEVELS;

class Logger {
  private level: LogLevel;

  constructor() {
    // Default to INFO level, can be configured via environment variable
    this.level = LOG_LEVELS.INFO;

    // Use environment utility for cross-environment compatibility
    if (isDevelopment()) {
      this.level = LOG_LEVELS.DEBUG;
    }
  }

  /**
   * Log an error message
   * @param message - The error message
   * @param args - Additional arguments to log
   */
  error(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   * @param message - The warning message
   * @param args - Additional arguments to log
   */
  warn(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   * @param message - The info message
   * @param args - Additional arguments to log
   */
  info(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log a debug message
   * @param message - The debug message
   * @param args - Additional arguments to log
   */
  debug(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Set the logging level
   * @param level - The logging level (ERROR, WARN, INFO, DEBUG)
   */
  setLevel(level: string): void {
    const upperLevel = level.toUpperCase() as LogLevelName;
    if (LOG_LEVELS[upperLevel] !== undefined) {
      this.level = LOG_LEVELS[upperLevel];
    } else {
      this.warn(`Invalid log level: ${level}. Using current level.`);
    }
  }
}

// Export a singleton instance
const logger = new Logger();
export default logger;
