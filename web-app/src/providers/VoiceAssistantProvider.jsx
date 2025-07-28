import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Logger from '@/shared/utils/logger';
import { processVoiceCommand, executeVoiceCommand } from '@/utils/voiceCommands';
import WakeWordDetectionService from '@/services/wakeWordDetection';
import VoiceActivationTimeoutService from '@/services/voiceActivationTimeout';
import voiceAnalyticsService from '@/services/voiceAnalyticsService';
import voiceFeedbackService from '@/services/voiceFeedbackService';

/**
 * Voice Assistant Context - Global voice assistant state management
 * Provides centralized state management for voice assistant functionality
 */

// Voice Assistant State
const initialState = {
  isListening: false,
  isProcessing: false,
  isEnabled: true,
  lastCommand: null,
  lastResponse: null,
  currentLanguage: 'en-US',
  supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
  aiService: 'browser', // 'browser', 'openai', 'azure', 'local'
  wakeWord: 'hey nexa',
  listeningTimeout: 10000, // 10 seconds
  feedbackVolume: 0.8,
  enabledCommandTypes: ['navigation', 'document', 'client', 'settings', 'general'],
  customCommands: [],
  sessionId: null,
  error: null,
  microphonePermission: 'prompt', // 'granted', 'denied', 'prompt'
  recognition: null,
  synthesis: null,
  // Wake word detection
  wakeWordEnabled: true,
  wakeWordSensitivity: 0.7,
  wakeWordDetected: false,
  wakeWordConfidence: 0,
  // Voice activation timeout
  timeoutActive: false,
  timeoutRemaining: 0,
  timeoutPercentage: 100,
  showTimeoutCountdown: true,
  // Visual feedback
  showWakeWordFeedback: true,
  wakeWordFeedbackPosition: 'top-center',
  timeoutCountdownPosition: 'bottom-right'
};

// Action Types
const VOICE_ACTIONS = {
  SET_LISTENING: 'SET_LISTENING',
  SET_PROCESSING: 'SET_PROCESSING',
  SET_ENABLED: 'SET_ENABLED',
  SET_COMMAND: 'SET_COMMAND',
  SET_RESPONSE: 'SET_RESPONSE',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_AI_SERVICE: 'SET_AI_SERVICE',
  SET_WAKE_WORD: 'SET_WAKE_WORD',
  SET_TIMEOUT: 'SET_TIMEOUT',
  SET_VOLUME: 'SET_VOLUME',
  SET_ENABLED_COMMANDS: 'SET_ENABLED_COMMANDS',
  ADD_CUSTOM_COMMAND: 'ADD_CUSTOM_COMMAND',
  REMOVE_CUSTOM_COMMAND: 'REMOVE_CUSTOM_COMMAND',
  SET_SESSION_ID: 'SET_SESSION_ID',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_MICROPHONE_PERMISSION: 'SET_MICROPHONE_PERMISSION',
  SET_RECOGNITION: 'SET_RECOGNITION',
  SET_SYNTHESIS: 'SET_SYNTHESIS',
  RESET_STATE: 'RESET_STATE',
  // Wake word actions
  SET_WAKE_WORD_ENABLED: 'SET_WAKE_WORD_ENABLED',
  SET_WAKE_WORD_SENSITIVITY: 'SET_WAKE_WORD_SENSITIVITY',
  SET_WAKE_WORD_DETECTED: 'SET_WAKE_WORD_DETECTED',
  SET_WAKE_WORD_CONFIDENCE: 'SET_WAKE_WORD_CONFIDENCE',
  // Timeout actions
  SET_TIMEOUT_ACTIVE: 'SET_TIMEOUT_ACTIVE',
  SET_TIMEOUT_REMAINING: 'SET_TIMEOUT_REMAINING',
  SET_TIMEOUT_PERCENTAGE: 'SET_TIMEOUT_PERCENTAGE',
  SET_SHOW_TIMEOUT_COUNTDOWN: 'SET_SHOW_TIMEOUT_COUNTDOWN',
  // Visual feedback actions
  SET_SHOW_WAKE_WORD_FEEDBACK: 'SET_SHOW_WAKE_WORD_FEEDBACK',
  SET_WAKE_WORD_FEEDBACK_POSITION: 'SET_WAKE_WORD_FEEDBACK_POSITION',
  SET_TIMEOUT_COUNTDOWN_POSITION: 'SET_TIMEOUT_COUNTDOWN_POSITION'
};

// Reducer
function voiceAssistantReducer(state, action) {
  switch (action.type) {
    case VOICE_ACTIONS.SET_LISTENING:
      return { ...state, isListening: action.payload };
    case VOICE_ACTIONS.SET_PROCESSING:
      return { ...state, isProcessing: action.payload };
    case VOICE_ACTIONS.SET_ENABLED:
      return { ...state, isEnabled: action.payload };
    case VOICE_ACTIONS.SET_COMMAND:
      return { ...state, lastCommand: action.payload };
    case VOICE_ACTIONS.SET_RESPONSE:
      return { ...state, lastResponse: action.payload };
    case VOICE_ACTIONS.SET_LANGUAGE:
      return { ...state, currentLanguage: action.payload };
    case VOICE_ACTIONS.SET_AI_SERVICE:
      return { ...state, aiService: action.payload };
    case VOICE_ACTIONS.SET_WAKE_WORD:
      return { ...state, wakeWord: action.payload };
    case VOICE_ACTIONS.SET_TIMEOUT:
      return { ...state, listeningTimeout: action.payload };
    case VOICE_ACTIONS.SET_VOLUME:
      return { ...state, feedbackVolume: action.payload };
    case VOICE_ACTIONS.SET_ENABLED_COMMANDS:
      return { ...state, enabledCommandTypes: action.payload };
    case VOICE_ACTIONS.ADD_CUSTOM_COMMAND:
      return { 
        ...state, 
        customCommands: [...state.customCommands, action.payload] 
      };
    case VOICE_ACTIONS.REMOVE_CUSTOM_COMMAND:
      return { 
        ...state, 
        customCommands: state.customCommands.filter(cmd => cmd.id !== action.payload) 
      };
    case VOICE_ACTIONS.SET_SESSION_ID:
      return { ...state, sessionId: action.payload };
    case VOICE_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case VOICE_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case VOICE_ACTIONS.SET_MICROPHONE_PERMISSION:
      return { ...state, microphonePermission: action.payload };
    case VOICE_ACTIONS.SET_RECOGNITION:
      return { ...state, recognition: action.payload };
    case VOICE_ACTIONS.SET_SYNTHESIS:
      return { ...state, synthesis: action.payload };
    case VOICE_ACTIONS.RESET_STATE:
      return { ...initialState, ...action.payload };
    // Wake word cases
    case VOICE_ACTIONS.SET_WAKE_WORD_ENABLED:
      return { ...state, wakeWordEnabled: action.payload };
    case VOICE_ACTIONS.SET_WAKE_WORD_SENSITIVITY:
      return { ...state, wakeWordSensitivity: action.payload };
    case VOICE_ACTIONS.SET_WAKE_WORD_DETECTED:
      return { ...state, wakeWordDetected: action.payload };
    case VOICE_ACTIONS.SET_WAKE_WORD_CONFIDENCE:
      return { ...state, wakeWordConfidence: action.payload };
    // Timeout cases
    case VOICE_ACTIONS.SET_TIMEOUT_ACTIVE:
      return { ...state, timeoutActive: action.payload };
    case VOICE_ACTIONS.SET_TIMEOUT_REMAINING:
      return { ...state, timeoutRemaining: action.payload };
    case VOICE_ACTIONS.SET_TIMEOUT_PERCENTAGE:
      return { ...state, timeoutPercentage: action.payload };
    case VOICE_ACTIONS.SET_SHOW_TIMEOUT_COUNTDOWN:
      return { ...state, showTimeoutCountdown: action.payload };
    // Visual feedback cases
    case VOICE_ACTIONS.SET_SHOW_WAKE_WORD_FEEDBACK:
      return { ...state, showWakeWordFeedback: action.payload };
    case VOICE_ACTIONS.SET_WAKE_WORD_FEEDBACK_POSITION:
      return { ...state, wakeWordFeedbackPosition: action.payload };
    case VOICE_ACTIONS.SET_TIMEOUT_COUNTDOWN_POSITION:
      return { ...state, timeoutCountdownPosition: action.payload };
    default:
      return state;
  }
}

// Context
const VoiceAssistantContext = createContext(null);

// Provider Component
export function VoiceAssistantProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(voiceAssistantReducer, initialState);
  const timeoutRef = useRef(null);
  const wakeWordDetectionRef = useRef(null);
  const wakeWordServiceRef = useRef(null);
  const timeoutServiceRef = useRef(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    initializeSpeechAPIs();
    checkMicrophonePermission();
    initializeServices();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize Speech APIs
  const initializeSpeechAPIs = useCallback(() => {
    try {
      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = state.currentLanguage;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          Logger.info('Voice recognition started');
          dispatch({ type: VOICE_ACTIONS.SET_LISTENING, payload: true });
          dispatch({ type: VOICE_ACTIONS.CLEAR_ERROR });
        };

        recognition.onresult = (event) => {
          const command = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          
          Logger.info('Voice command received:', { command, confidence });
          dispatch({ type: VOICE_ACTIONS.SET_COMMAND, payload: command });
          
          // Process the command
          processVoiceCommandInternal(command, confidence);
        };

        recognition.onerror = (event) => {
          Logger.error('Speech recognition error:', event.error);
          
          // Track recognition failure
          voiceAnalyticsService.trackFailure({
            recognizedText: '',
            confidence: 0,
            errorType: 'recognition-error',
            errorMessage: event.error,
            sessionId: state.sessionId,
            context: {
              currentPath: location.pathname,
              userAgent: navigator.userAgent,
              recognitionError: event.error
            }
          });
          
          dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: event.error });
          dispatch({ type: VOICE_ACTIONS.SET_LISTENING, payload: false });
          
          if (event.error === 'not-allowed') {
            dispatch({ type: VOICE_ACTIONS.SET_MICROPHONE_PERMISSION, payload: 'denied' });
            toast.error('Microphone access denied. Please enable microphone permissions.');
          }
        };

        recognition.onend = () => {
          Logger.info('Voice recognition ended');
          dispatch({ type: VOICE_ACTIONS.SET_LISTENING, payload: false });
          clearTimeout(timeoutRef.current);
        };

        dispatch({ type: VOICE_ACTIONS.SET_RECOGNITION, payload: recognition });
      } else {
        Logger.warn('Speech recognition not supported in this browser');
        dispatch({ 
          type: VOICE_ACTIONS.SET_ERROR, 
          payload: 'Speech recognition not supported in this browser' 
        });
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        dispatch({ type: VOICE_ACTIONS.SET_SYNTHESIS, payload: window.speechSynthesis });
      } else {
        Logger.warn('Speech synthesis not supported in this browser');
      }

    } catch (error) {
      Logger.error('Error initializing speech APIs:', error);
      dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [state.currentLanguage]);

  // Initialize wake word detection and timeout services
  const initializeServices = useCallback(() => {
    try {
      // Initialize Wake Word Detection Service
      wakeWordServiceRef.current = new WakeWordDetectionService();
      wakeWordServiceRef.current.initialize({
        wakeWord: state.wakeWord,
        sensitivity: state.wakeWordSensitivity,
        onWakeWordDetected: (data) => {
          Logger.info('Wake word detected:', data);
          dispatch({ type: VOICE_ACTIONS.SET_WAKE_WORD_DETECTED, payload: true });
          dispatch({ type: VOICE_ACTIONS.SET_WAKE_WORD_CONFIDENCE, payload: data.confidence });
          
          // Auto-activate voice assistant
          if (state.wakeWordEnabled) {
            activateVoiceFromWakeWord();
          }
          
          // Reset wake word detection after a delay
          setTimeout(() => {
            dispatch({ type: VOICE_ACTIONS.SET_WAKE_WORD_DETECTED, payload: false });
            dispatch({ type: VOICE_ACTIONS.SET_WAKE_WORD_CONFIDENCE, payload: 0 });
          }, 3000);
        },
        onError: (error) => {
          Logger.error('Wake word detection error:', error);
          dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: error.message });
        }
      });

      // Initialize Voice Activation Timeout Service
      timeoutServiceRef.current = new VoiceActivationTimeoutService();
      timeoutServiceRef.current.initialize({
        timeoutDuration: state.listeningTimeout,
        onTimeout: (data) => {
          Logger.info('Voice activation timeout:', data);
          dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_ACTIVE, payload: false });
          deactivateVoice();
          toast.info('Voice assistant timed out');
        },
        onCountdownUpdate: (data) => {
          dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_REMAINING, payload: data.remainingTime });
          dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_PERCENTAGE, payload: data.percentage });
        },
        onCancelled: (data) => {
          Logger.info('Voice activation cancelled:', data);
          dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_ACTIVE, payload: false });
          deactivateVoice();
        }
      });

      Logger.info('Voice assistant services initialized');
    } catch (error) {
      Logger.error('Error initializing voice assistant services:', error);
      dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [state.wakeWord, state.wakeWordSensitivity, state.wakeWordEnabled, state.listeningTimeout]);

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        dispatch({ 
          type: VOICE_ACTIONS.SET_MICROPHONE_PERMISSION, 
          payload: permission.state 
        });
        
        permission.onchange = () => {
          dispatch({ 
            type: VOICE_ACTIONS.SET_MICROPHONE_PERMISSION, 
            payload: permission.state 
          });
        };
      }
    } catch (error) {
      Logger.warn('Could not check microphone permission:', error);
    }
  }, []);

  // Process voice command (placeholder - will be expanded with command handlers)
  const processVoiceCommandInternal = useCallback(async (command, confidence = 1) => {
    dispatch({ type: VOICE_ACTIONS.SET_PROCESSING, payload: true });
    
    try {
      // Process the command using the voice command system
      const action = processVoiceCommand(command, {
        currentPath: location.pathname,
        navigate,
      });

      // Execute the command
      const context = {
        navigate,
        currentPath: location.pathname,
        onSearch: (query) => {
          // Implement search functionality
          console.log('Search for:', query);
        },
        onExport: (type) => {
          // Implement export functionality
          console.log('Export:', type);
        },
        onOpenVoiceSettings: () => {
          // Implement voice settings opening
          console.log('Open voice settings');
        },
        onStopListening: () => {
          deactivateVoice();
        },
        lastResponse: state.lastResponse,
      };

      const response = await executeVoiceCommand(action, context);
      
      // Track successful command
      voiceAnalyticsService.trackCommand({
        command: command.toLowerCase().trim(),
        action: action?.type || 'unknown',
        confidence,
        sessionId: state.sessionId,
        success: true,
        responseTime: Date.now() - (state.commandStartTime || Date.now()),
        context: {
          currentPath: location.pathname,
          userAgent: navigator.userAgent
        }
      });

      // Auto-collect positive feedback for successful commands with high confidence
      if (confidence > 0.8 && action?.type !== 'unknown') {
        voiceFeedbackService.collectFeedback({
          command: command.toLowerCase().trim(),
          action: action?.type,
          type: 'success',
          rating: 5,
          confidence,
          sessionId: state.sessionId,
          autoGenerated: true,
          context: {
            currentPath: location.pathname,
            responseTime: Date.now() - (state.commandStartTime || Date.now())
          }
        });
      }
      
      dispatch({ type: VOICE_ACTIONS.SET_RESPONSE, payload: response });
      
      // Provide audio feedback
      if (state.synthesis && state.feedbackVolume > 0 && response) {
        speak(response);
      }
      
      toast.success(`Voice command: ${command}`);
      
    } catch (error) {
      Logger.error('Error processing voice command:', error);
      const errorMessage = 'Sorry, I had trouble processing that command.';
      
      // Track failed command
      voiceAnalyticsService.trackFailure({
        recognizedText: command,
        confidence,
        errorType: 'processing-error',
        errorMessage: error.message || errorMessage,
        sessionId: state.sessionId,
        context: {
          currentPath: location.pathname,
          userAgent: navigator.userAgent
        }
      });

      // Auto-collect negative feedback for failed commands
      voiceFeedbackService.collectFeedback({
        command: command.toLowerCase().trim(),
        type: 'error',
        rating: 1,
        confidence,
        sessionId: state.sessionId,
        autoGenerated: true,
        comments: error.message || errorMessage,
        context: {
          currentPath: location.pathname,
          errorType: 'processing-error'
        }
      });
      
      dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: errorMessage });
      
      if (state.synthesis && state.feedbackVolume > 0) {
        speak(errorMessage);
      }
      
      toast.error('Failed to process voice command');
    } finally {
      dispatch({ type: VOICE_ACTIONS.SET_PROCESSING, payload: false });
    }
  }, [state.synthesis, state.feedbackVolume, state.lastResponse, state.sessionId, location.pathname, navigate]);

  // Speak text using speech synthesis
  const speak = useCallback((text, options = {}) => {
    if (!state.synthesis || state.feedbackVolume === 0) return;

    try {
      // Cancel any ongoing speech
      state.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = state.currentLanguage;
      utterance.volume = state.feedbackVolume;
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;

      utterance.onend = () => {
        Logger.info('Speech synthesis completed');
      };

      utterance.onerror = (event) => {
        Logger.error('Speech synthesis error:', event.error);
      };

      state.synthesis.speak(utterance);
    } catch (error) {
      Logger.error('Error in speech synthesis:', error);
    }
  }, [state.synthesis, state.currentLanguage, state.feedbackVolume]);

  // Activate voice assistant
  const activateVoice = useCallback(() => {
    if (!state.isEnabled || !state.recognition) {
      toast.error('Voice assistant is not available');
      return;
    }

    if (state.microphonePermission === 'denied') {
      toast.error('Microphone access denied. Please enable microphone permissions.');
      return;
    }

    try {
      // Generate session ID
      const sessionId = `voice_session_${Date.now()}`;
      dispatch({ type: VOICE_ACTIONS.SET_SESSION_ID, payload: sessionId });

      // Track session start
      voiceAnalyticsService.trackSessionStart({
        sessionId,
        trigger: 'manual',
        userAgent: navigator.userAgent,
        currentPath: location.pathname
      });

      // Start recognition
      state.recognition.start();

      // Start timeout service
      if (timeoutServiceRef.current) {
        timeoutServiceRef.current.start();
        dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_ACTIVE, payload: true });
      } else {
        // Fallback to old timeout method
        timeoutRef.current = setTimeout(() => {
          deactivateVoice();
          toast.info('Voice assistant timed out');
        }, state.listeningTimeout);
      }

      Logger.info('Voice assistant activated', { sessionId });
      
    } catch (error) {
      Logger.error('Error activating voice assistant:', error);
      dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to activate voice assistant');
    }
  }, [state.isEnabled, state.recognition, state.microphonePermission, state.listeningTimeout, location.pathname]);

  // Activate voice assistant from wake word detection
  const activateVoiceFromWakeWord = useCallback(() => {
    if (!state.isEnabled || !state.recognition) {
      Logger.warn('Voice assistant not available for wake word activation');
      return;
    }

    if (state.microphonePermission === 'denied') {
      Logger.warn('Microphone access denied for wake word activation');
      return;
    }

    try {
      // Generate session ID
      const sessionId = `wake_word_session_${Date.now()}`;
      dispatch({ type: VOICE_ACTIONS.SET_SESSION_ID, payload: sessionId });

      // Track session start
      voiceAnalyticsService.trackSessionStart({
        sessionId,
        trigger: 'wake-word',
        userAgent: navigator.userAgent,
        currentPath: location.pathname
      });

      // Start recognition
      state.recognition.start();

      // Start timeout service
      if (timeoutServiceRef.current) {
        timeoutServiceRef.current.start();
        dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_ACTIVE, payload: true });
      }

      // Provide audio feedback
      if (state.synthesis && state.feedbackVolume > 0) {
        speak('Yes?', { rate: 1.2 });
      }

      Logger.info('Voice assistant activated from wake word', { sessionId });
      
    } catch (error) {
      Logger.error('Error activating voice assistant from wake word:', error);
      dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [state.isEnabled, state.recognition, state.microphonePermission, state.synthesis, state.feedbackVolume, location.pathname]);

  // Start wake word detection
  const startWakeWordDetection = useCallback(() => {
    if (!state.wakeWordEnabled || !wakeWordServiceRef.current) {
      return;
    }

    try {
      wakeWordServiceRef.current.startDetection();
      Logger.info('Wake word detection started');
    } catch (error) {
      Logger.error('Error starting wake word detection:', error);
      dispatch({ type: VOICE_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [state.wakeWordEnabled]);

  // Stop wake word detection
  const stopWakeWordDetection = useCallback(() => {
    if (!wakeWordServiceRef.current) {
      return;
    }

    try {
      wakeWordServiceRef.current.stopDetection();
      Logger.info('Wake word detection stopped');
    } catch (error) {
      Logger.error('Error stopping wake word detection:', error);
    }
  }, []);

  // Cancel voice activation timeout
  const cancelVoiceTimeout = useCallback((reason = 'manual') => {
    if (timeoutServiceRef.current && state.timeoutActive) {
      timeoutServiceRef.current.cancel(reason);
      dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_ACTIVE, payload: false });
    }
  }, [state.timeoutActive]);

  // Deactivate voice assistant
  const deactivateVoice = useCallback(() => {
    try {
      // Track session end if we have a session ID
      if (state.sessionId) {
        voiceAnalyticsService.trackSessionEnd({
          sessionId: state.sessionId,
          reason: 'manual',
          userAgent: navigator.userAgent
        });
      }

      if (state.recognition) {
        state.recognition.stop();
      }
      
      clearTimeout(timeoutRef.current);
      dispatch({ type: VOICE_ACTIONS.SET_LISTENING, payload: false });
      dispatch({ type: VOICE_ACTIONS.SET_SESSION_ID, payload: null });
      
      // Stop timeout service
      if (timeoutServiceRef.current && state.timeoutActive) {
        timeoutServiceRef.current.stop();
        dispatch({ type: VOICE_ACTIONS.SET_TIMEOUT_ACTIVE, payload: false });
      }

      // Reset wake word detection state
      dispatch({ type: VOICE_ACTIONS.SET_WAKE_WORD_DETECTED, payload: false });
      dispatch({ type: VOICE_ACTIONS.SET_WAKE_WORD_CONFIDENCE, payload: 0 });

      // Hide visual feedback
      dispatch({ type: VOICE_ACTIONS.SET_SHOW_WAKE_WORD_FEEDBACK, payload: false });
      dispatch({ type: VOICE_ACTIONS.SET_SHOW_TIMEOUT_COUNTDOWN, payload: false });
      
      Logger.info('Voice assistant deactivated');
      
    } catch (error) {
      Logger.error('Error deactivating voice assistant:', error);
    }
  }, [state.recognition, state.timeoutActive, state.sessionId]);

  // Set AI service
  const setAIService = useCallback((service) => {
    dispatch({ type: VOICE_ACTIONS.SET_AI_SERVICE, payload: service });
    Logger.info('AI service changed to:', service);
  }, []);

  // Set language
  const setLanguage = useCallback((language) => {
    dispatch({ type: VOICE_ACTIONS.SET_LANGUAGE, payload: language });
    
    // Update recognition language
    if (state.recognition) {
      state.recognition.lang = language;
    }
    
    Logger.info('Language changed to:', language);
  }, [state.recognition]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (wakeWordDetectionRef.current) {
      clearInterval(wakeWordDetectionRef.current);
    }

    // Cleanup wake word detection service
    if (wakeWordServiceRef.current) {
      wakeWordServiceRef.current.cleanup();
    }

    // Cleanup timeout service
    if (timeoutServiceRef.current) {
      timeoutServiceRef.current.cleanup();
    }
    
    if (state.recognition) {
      state.recognition.stop();
    }
    
    if (state.synthesis) {
      state.synthesis.cancel();
    }
  }, [state.recognition, state.synthesis]);

  // Collect user feedback
  const collectFeedback = useCallback((feedbackData) => {
    return voiceFeedbackService.collectFeedback({
      ...feedbackData,
      sessionId: state.sessionId,
      context: {
        currentPath: location.pathname,
        userAgent: navigator.userAgent,
        ...feedbackData.context
      }
    });
  }, [state.sessionId, location.pathname]);

  // Submit command suggestion
  const submitSuggestion = useCallback((suggestionData) => {
    return voiceFeedbackService.submitSuggestion({
      ...suggestionData,
      sessionId: state.sessionId,
      context: {
        currentPath: location.pathname,
        userAgent: navigator.userAgent,
        ...suggestionData.context
      }
    });
  }, [state.sessionId, location.pathname]);

  // Vote on suggestion
  const voteOnSuggestion = useCallback((suggestionId, voteType) => {
    return voiceFeedbackService.voteOnSuggestion(suggestionId, voteType);
  }, []);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    activateVoice,
    activateVoiceFromWakeWord,
    deactivateVoice,
    setAIService,
    setLanguage,
    speak,
    
    // Wake word detection
    startWakeWordDetection,
    stopWakeWordDetection,
    
    // Voice activation timeout
    cancelVoiceTimeout,
    
    // Feedback collection
    collectFeedback,
    submitSuggestion,
    voteOnSuggestion,
    
    // Utilities
    processVoiceCommand: processVoiceCommandInternal,
    
    // Internal actions for settings
    dispatch,
    VOICE_ACTIONS
  };

  return (
    <VoiceAssistantContext.Provider value={contextValue}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

// Hook to use voice assistant context
export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
}

export default VoiceAssistantProvider;