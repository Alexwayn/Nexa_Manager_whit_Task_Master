/**
 * Voice Activation Timeout Service
 * Handles voice activation timeout, cancellation, and visual countdown
 */

import Logger from '@/shared/utils/logger';

class VoiceActivationTimeoutService {
  constructor() {
    this.timeoutId = null;
    this.countdownId = null;
    this.isActive = false;
    this.timeoutDuration = 10000; // 10 seconds default
    this.countdownInterval = 1000; // 1 second
    this.remainingTime = 0;
    this.onTimeout = null;
    this.onCountdownUpdate = null;
    this.onCancelled = null;
    this.startTime = 0;
  }

  /**
   * Initialize the timeout service
   * @param {Object} options - Configuration options
   * @param {number} options.timeoutDuration - Timeout duration in milliseconds
   * @param {Function} options.onTimeout - Callback when timeout occurs
   * @param {Function} options.onCountdownUpdate - Callback for countdown updates
   * @param {Function} options.onCancelled - Callback when manually cancelled
   */
  initialize(options = {}) {
    this.timeoutDuration = options.timeoutDuration || this.timeoutDuration;
    this.onTimeout = options.onTimeout;
    this.onCountdownUpdate = options.onCountdownUpdate;
    this.onCancelled = options.onCancelled;

    Logger.info('Voice activation timeout service initialized', {
      timeoutDuration: this.timeoutDuration
    });
  }

  /**
   * Start the timeout countdown
   * @param {number} customTimeout - Optional custom timeout duration
   */
  start(customTimeout = null) {
    try {
      // Clear any existing timers
      this.clear();

      const timeout = customTimeout || this.timeoutDuration;
      this.remainingTime = timeout;
      this.startTime = Date.now();
      this.isActive = true;

      Logger.info('Voice activation timeout started', { timeout });

      // Start main timeout
      this.timeoutId = setTimeout(() => {
        this.handleTimeout();
      }, timeout);

      // Start countdown updates
      this.startCountdown();

      return true;
    } catch (error) {
      Logger.error('Error starting voice activation timeout:', error);
      return false;
    }
  }

  /**
   * Start the visual countdown
   */
  startCountdown() {
    const updateCountdown = () => {
      if (!this.isActive) return;

      const elapsed = Date.now() - this.startTime;
      this.remainingTime = Math.max(0, this.timeoutDuration - elapsed);

      // Notify countdown update
      if (this.onCountdownUpdate) {
        this.onCountdownUpdate({
          remainingTime: this.remainingTime,
          totalTime: this.timeoutDuration,
          percentage: (this.remainingTime / this.timeoutDuration) * 100,
          secondsLeft: Math.ceil(this.remainingTime / 1000)
        });
      }

      // Continue countdown if time remaining
      if (this.remainingTime > 0) {
        this.countdownId = setTimeout(updateCountdown, this.countdownInterval);
      }
    };

    // Start first update immediately
    updateCountdown();
  }

  /**
   * Handle timeout occurrence
   */
  handleTimeout() {
    Logger.info('Voice activation timeout occurred');
    
    this.isActive = false;
    this.clear();

    if (this.onTimeout) {
      this.onTimeout({
        reason: 'timeout',
        duration: this.timeoutDuration,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Cancel the timeout manually
   * @param {string} reason - Reason for cancellation
   */
  cancel(reason = 'manual') {
    try {
      if (!this.isActive) {
        return false;
      }

      Logger.info('Voice activation timeout cancelled', { reason });

      this.isActive = false;
      this.clear();

      if (this.onCancelled) {
        this.onCancelled({
          reason,
          remainingTime: this.remainingTime,
          timestamp: Date.now()
        });
      }

      return true;
    } catch (error) {
      Logger.error('Error cancelling voice activation timeout:', error);
      return false;
    }
  }

  /**
   * Extend the timeout duration
   * @param {number} additionalTime - Additional time in milliseconds
   */
  extend(additionalTime) {
    try {
      if (!this.isActive) {
        return false;
      }

      // Clear existing timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Calculate new remaining time
      const elapsed = Date.now() - this.startTime;
      const currentRemaining = Math.max(0, this.timeoutDuration - elapsed);
      const newRemaining = currentRemaining + additionalTime;

      // Update timeout duration and start time
      this.timeoutDuration = elapsed + newRemaining;
      this.remainingTime = newRemaining;

      // Set new timeout
      this.timeoutId = setTimeout(() => {
        this.handleTimeout();
      }, newRemaining);

      Logger.info('Voice activation timeout extended', { 
        additionalTime, 
        newRemaining 
      });

      return true;
    } catch (error) {
      Logger.error('Error extending voice activation timeout:', error);
      return false;
    }
  }

  /**
   * Reset the timeout to full duration
   */
  reset() {
    try {
      if (!this.isActive) {
        return this.start();
      }

      // Clear existing timers
      this.clear();

      // Restart with original duration
      return this.start(this.timeoutDuration);
    } catch (error) {
      Logger.error('Error resetting voice activation timeout:', error);
      return false;
    }
  }

  /**
   * Clear all timers
   */
  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.countdownId) {
      clearTimeout(this.countdownId);
      this.countdownId = null;
    }
  }

  /**
   * Update timeout duration
   * @param {number} duration - New timeout duration in milliseconds
   */
  setTimeoutDuration(duration) {
    this.timeoutDuration = Math.max(1000, duration); // Minimum 1 second
    Logger.info('Timeout duration updated to:', this.timeoutDuration);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      remainingTime: this.remainingTime,
      totalTime: this.timeoutDuration,
      percentage: this.isActive ? (this.remainingTime / this.timeoutDuration) * 100 : 0,
      secondsLeft: this.isActive ? Math.ceil(this.remainingTime / 1000) : 0
    };
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingSeconds() {
    return this.isActive ? Math.ceil(this.remainingTime / 1000) : 0;
  }

  /**
   * Check if timeout is active
   */
  isTimeoutActive() {
    return this.isActive;
  }

  /**
   * Cleanup the service
   */
  cleanup() {
    try {
      this.clear();
      this.isActive = false;
      this.onTimeout = null;
      this.onCountdownUpdate = null;
      this.onCancelled = null;

      Logger.info('Voice activation timeout service cleaned up');
    } catch (error) {
      Logger.error('Error during timeout service cleanup:', error);
    }
  }
}

export default VoiceActivationTimeoutService;
