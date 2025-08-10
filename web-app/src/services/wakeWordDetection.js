/**
 * Wake Word Detection Service
 * Implements client-side wake word detection using WebAudio API and Speech Recognition
 */

import Logger from '@/shared/utils/logger';

class WakeWordDetectionService {
  constructor() {
    this.isActive = false;
    this.isListening = false;
    this.wakeWord = 'hey nexa';
    this.sensitivity = 0.7; // Confidence threshold for wake word detection
    this.audioContext = null;
    this.mediaStream = null;
    this.recognition = null;
    this.onWakeWordDetected = null;
    this.onError = null;
    this.onStatusChange = null;
    this.continuousRecognition = null;
    this.lastDetectionTime = 0;
    this.detectionCooldown = 2000; // 2 seconds cooldown between detections
  }

  /**
   * Initialize wake word detection
   * @param {Object} options - Configuration options
   * @param {string} options.wakeWord - The wake word to detect
   * @param {number} options.sensitivity - Detection sensitivity (0-1)
   * @param {Function} options.onWakeWordDetected - Callback when wake word is detected
   * @param {Function} options.onError - Error callback
   * @param {Function} options.onStatusChange - Status change callback
   */
  async initialize(options = {}) {
    try {
      this.wakeWord = options.wakeWord || this.wakeWord;
      this.sensitivity = options.sensitivity || this.sensitivity;
      this.onWakeWordDetected = options.onWakeWordDetected;
      this.onError = options.onError;
      this.onStatusChange = options.onStatusChange;

      // Check browser support
      if (!this.checkBrowserSupport()) {
        throw new Error('Wake word detection not supported in this browser');
      }

      // Request microphone permission
      await this.requestMicrophonePermission();

      // Initialize audio context
      await this.initializeAudioContext();

      // Initialize speech recognition for wake word detection
      this.initializeSpeechRecognition();

      Logger.info('Wake word detection service initialized', {
        wakeWord: this.wakeWord,
        sensitivity: this.sensitivity
      });

      return true;
    } catch (error) {
      Logger.error('Failed to initialize wake word detection:', error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Check if browser supports required APIs
   */
  checkBrowserSupport() {
    const hasWebAudio = !!(
      (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
      (typeof globalThis !== 'undefined' && globalThis.AudioContext)
    );
    const hasSpeechRecognition = !!(
      (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
      (typeof globalThis !== 'undefined' && (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition))
    );
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    return hasWebAudio && hasSpeechRecognition && hasMediaDevices;
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      return true;
    } catch (error) {
      throw new Error(`Microphone permission denied: ${error.message}`);
    }
  }

  /**
   * Initialize Web Audio API context
   */
  async initializeAudioContext() {
    try {
      const AudioContext = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
        || (typeof globalThis !== 'undefined' && globalThis.AudioContext);
      this.audioContext = new AudioContext();

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to initialize audio context: ${error.message}`);
    }
  }

  /**
   * Initialize speech recognition for continuous wake word detection
   */
  initializeSpeechRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.continuousRecognition = new SpeechRecognition();

      // Configure for continuous listening
      this.continuousRecognition.continuous = true;
      this.continuousRecognition.interimResults = true;
      this.continuousRecognition.lang = 'en-US';
      this.continuousRecognition.maxAlternatives = 1;

      // Handle recognition results
      this.continuousRecognition.onresult = (event) => {
        this.handleRecognitionResult(event);
      };

      // Handle recognition errors
      this.continuousRecognition.onerror = (event) => {
        Logger.warn('Wake word recognition error:', event.error);
        
        // Restart recognition if it stops due to error (except for permission errors)
        if (event.error !== 'not-allowed' && this.isActive) {
          setTimeout(() => {
            if (this.isActive) {
              this.startContinuousListening();
            }
          }, 1000);
        }
      };

      // Handle recognition end
      this.continuousRecognition.onend = () => {
        // Restart recognition if still active
        if (this.isActive) {
          setTimeout(() => {
            if (this.isActive) {
              this.startContinuousListening();
            }
          }, 100);
        }
      };

      return true;
    } catch (error) {
      throw new Error(`Failed to initialize speech recognition: ${error.message}`);
    }
  }

  /**
   * Handle speech recognition results
   */
  handleRecognitionResult(event) {
    try {
      const now = Date.now();
      
      // Check cooldown period
      if (now - this.lastDetectionTime < this.detectionCooldown) {
        return;
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence || 0;

        Logger.debug('Wake word detection - transcript:', transcript, 'confidence:', confidence);

        // Check if wake word is detected
        if (this.isWakeWordDetected(transcript, confidence)) {
          this.lastDetectionTime = now;
          this.handleWakeWordDetected(transcript, confidence);
          break;
        }
      }
    } catch (error) {
      Logger.error('Error handling recognition result:', error);
    }
  }

  /**
   * Check if the transcript contains the wake word
   */
  isWakeWordDetected(transcript, confidence) {
    const wakeWordLower = this.wakeWord.toLowerCase();
    const transcriptLower = transcript.toLowerCase();

    // Check exact match
    if (transcriptLower.includes(wakeWordLower)) {
      return confidence >= this.sensitivity;
    }

    // Check fuzzy match for common variations
    const wakeWordParts = wakeWordLower.split(' ');
    const transcriptWords = transcriptLower.split(' ');

    let matchCount = 0;
    for (const part of wakeWordParts) {
      if (transcriptWords.some(word => 
        word.includes(part) || 
        this.calculateSimilarity(word, part) > 0.8
      )) {
        matchCount++;
      }
    }

    const matchRatio = matchCount / wakeWordParts.length;
    return matchRatio >= 0.7 && confidence >= this.sensitivity;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Handle wake word detection
   */
  handleWakeWordDetected(transcript, confidence) {
    Logger.info('Wake word detected!', { transcript, confidence, wakeWord: this.wakeWord });

    // Notify status change
    if (this.onStatusChange) {
      this.onStatusChange('wake_word_detected', { transcript, confidence });
    }

    // Trigger wake word callback
    if (this.onWakeWordDetected) {
      this.onWakeWordDetected({
        transcript,
        confidence,
        wakeWord: this.wakeWord,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Start wake word detection
   */
  async start() {
    try {
      if (this.isActive) {
        Logger.warn('Wake word detection is already active');
        return;
      }

      this.isActive = true;
      
      // Start continuous listening
      await this.startContinuousListening();

      Logger.info('Wake word detection started');
      
      if (this.onStatusChange) {
        this.onStatusChange('started');
      }

      return true;
    } catch (error) {
      Logger.error('Failed to start wake word detection:', error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Start continuous speech recognition
   */
  async startContinuousListening() {
    try {
      if (!this.continuousRecognition || this.isListening) {
        return;
      }

      // Ensure audio context is running
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.continuousRecognition.start();
      this.isListening = true;

      Logger.debug('Continuous listening started');
    } catch (error) {
      // Ignore errors if recognition is already started
      if (error.name !== 'InvalidStateError') {
        Logger.error('Error starting continuous listening:', error);
      }
    }
  }

  /**
   * Stop wake word detection
   */
  stop() {
    try {
      this.isActive = false;
      this.isListening = false;

      if (this.continuousRecognition) {
        this.continuousRecognition.stop();
      }

      Logger.info('Wake word detection stopped');
      
      if (this.onStatusChange) {
        this.onStatusChange('stopped');
      }

      return true;
    } catch (error) {
      Logger.error('Error stopping wake word detection:', error);
      return false;
    }
  }

  /**
   * Update wake word
   */
  setWakeWord(wakeWord) {
    this.wakeWord = wakeWord.toLowerCase();
    Logger.info('Wake word updated to:', this.wakeWord);
  }

  /**
   * Update sensitivity
   */
  setSensitivity(sensitivity) {
    this.sensitivity = Math.max(0, Math.min(1, sensitivity));
    Logger.info('Wake word sensitivity updated to:', this.sensitivity);
  }

  /**
   * Handle errors
   */
  handleError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      this.stop();

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      this.continuousRecognition = null;
      this.onWakeWordDetected = null;
      this.onError = null;
      this.onStatusChange = null;

      Logger.info('Wake word detection service cleaned up');
    } catch (error) {
      Logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      isListening: this.isListening,
      wakeWord: this.wakeWord,
      sensitivity: this.sensitivity,
      isSupported: this.checkBrowserSupport()
    };
  }
}

export default WakeWordDetectionService;
