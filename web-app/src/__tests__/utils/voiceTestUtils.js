import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import VoiceAssistantProvider from '@/components/voice/VoiceAssistantProvider';
import { mockSpeechRecognition } from './voiceTestSetup';

/**
 * Custom render function for voice assistant components
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with additional voice utilities
 */
export const renderWithVoiceProvider = (ui, options = {}) => {
  const {
    initialVoiceState = {},
    mockServices = true,
    ...renderOptions
  } = options;

  // Setup service mocks if requested
  if (mockServices) {
    setupVoiceServiceMocks();
  }

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <VoiceAssistantProvider initialState={initialVoiceState}>
          {children}
        </VoiceAssistantProvider>
      </I18nextProvider>
    </BrowserRouter>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    voiceUtils: {
      simulateVoiceStart: () => simulateVoiceRecognitionStart(),
      simulateVoiceResult: (transcript, confidence = 0.9, isFinal = true) =>
        simulateVoiceRecognitionResult(transcript, confidence, isFinal),
      simulateVoiceError: (error) => simulateVoiceRecognitionError(error),
      simulateVoiceEnd: () => simulateVoiceRecognitionEnd(),
      simulatePermissionDenied: () => simulatePermissionDenied(),
      simulatePermissionGranted: () => simulatePermissionGranted(),
      getMockRecognition: () => mockSpeechRecognition
    }
  };
};

/**
 * Setup default mocks for voice services
 */
export const setupVoiceServiceMocks = () => {
  // Mock voice analytics service
  jest.doMock('@/services/voiceAnalyticsService', () => ({
    voiceAnalyticsService: {
      trackCommand: jest.fn().mockResolvedValue(),
      trackError: jest.fn().mockResolvedValue(),
      trackSession: jest.fn().mockResolvedValue(),
      getAnalytics: jest.fn().mockResolvedValue({
        totalCommands: 0,
        successfulCommands: 0,
        failedCommands: 0,
        averageResponseTime: 0,
        commandHistory: []
      }),
      getAnalyticsSummary: jest.fn().mockResolvedValue({
        totalCommands: 0,
        successRate: 0,
        averageResponseTime: 0,
        topCommands: [],
        errorRate: 0
      }),
      clearAnalytics: jest.fn().mockResolvedValue(),
      exportAnalytics: jest.fn().mockResolvedValue(''),
      importAnalytics: jest.fn().mockResolvedValue()
    }
  }));

  // Mock voice feedback service
  jest.doMock('@/services/voiceFeedbackService', () => ({
    voiceFeedbackService: {
      submitFeedback: jest.fn().mockResolvedValue({ success: true }),
      getFeedbackBySession: jest.fn().mockResolvedValue([]),
      getCommandSuggestions: jest.fn().mockResolvedValue([]),
      getFeedbackAnalytics: jest.fn().mockResolvedValue({
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: {},
        commonIssues: []
      }),
      syncQueuedFeedback: jest.fn().mockResolvedValue({ synced: 0, failed: 0 }),
      getQueuedFeedbackCount: jest.fn().mockReturnValue(0),
      categorizeFeedback: jest.fn().mockResolvedValue([]),
      exportFeedback: jest.fn().mockResolvedValue(''),
      clearFeedback: jest.fn().mockResolvedValue()
    }
  }));

  // Mock help service
  jest.doMock('@/services/helpService', () => ({
    default: {
      getVoiceCommands: jest.fn().mockResolvedValue({
        success: true,
        data: createMockVoiceCommands()
      }),
      searchVoiceCommands: jest.fn().mockResolvedValue({
        success: true,
        data: []
      }),
      getCommandCategories: jest.fn().mockResolvedValue({
        success: true,
        data: ['navigation', 'action', 'help', 'system']
      }),
      getPopularCommands: jest.fn().mockResolvedValue({
        success: true,
        data: []
      }),
      updateCommandUsage: jest.fn().mockResolvedValue({ success: true }),
      getCommandSuggestions: jest.fn().mockResolvedValue({
        success: true,
        data: []
      }),
      exportCommands: jest.fn().mockResolvedValue({
        success: true,
        data: '',
        mimeType: 'application/json'
      }),
      importCommands: jest.fn().mockResolvedValue({
        success: true,
        imported: 0
      }),
      clearCache: jest.fn().mockResolvedValue({ success: true }),
      getHelpTopics: jest.fn().mockResolvedValue({
        success: true,
        data: createMockHelpTopics()
      }),
      getCommandHistory: jest.fn().mockResolvedValue({
        success: true,
        data: []
      }),
      addToCommandHistory: jest.fn().mockResolvedValue({ success: true })
    }
  }));
};

/**
 * Create mock voice commands for testing
 */
export const createMockVoiceCommands = () => [
  {
    id: 'nav-dashboard',
    category: 'navigation',
    command: 'go to dashboard',
    description: 'Navigate to the main dashboard',
    examples: ['go to dashboard', 'show dashboard', 'open dashboard'],
    confidence: 0.95,
    usageCount: 10
  },
  {
    id: 'nav-clients',
    category: 'navigation',
    command: 'show clients',
    description: 'Navigate to the clients page',
    examples: ['show clients', 'view clients', 'go to clients'],
    confidence: 0.92,
    usageCount: 8
  },
  {
    id: 'create-invoice',
    category: 'action',
    command: 'create invoice',
    description: 'Create a new invoice',
    examples: ['create invoice', 'new invoice', 'add invoice'],
    confidence: 0.90,
    usageCount: 15
  },
  {
    id: 'help',
    category: 'help',
    command: 'help',
    description: 'Show available voice commands',
    examples: ['help', 'what can I say', 'show commands'],
    confidence: 0.98,
    usageCount: 5
  }
];

/**
 * Create mock help topics for testing
 */
export const createMockHelpTopics = () => [
  {
    id: 'voice-getting-started',
    title: 'Getting Started with Voice Commands',
    category: 'voice',
    content: 'Learn how to use voice commands effectively...',
    tags: ['voice', 'tutorial', 'beginner']
  },
  {
    id: 'voice-troubleshooting',
    title: 'Voice Recognition Troubleshooting',
    category: 'voice',
    content: 'Common issues and solutions for voice recognition...',
    tags: ['voice', 'troubleshooting', 'help']
  }
];

/**
 * Create mock feedback data for testing
 */
export const createMockFeedbackData = () => [
  {
    id: 'feedback-1',
    sessionId: 'session-1',
    command: 'go to dashboard',
    rating: 5,
    comment: 'Worked perfectly!',
    timestamp: Date.now() - 3600000,
    category: 'navigation',
    confidence: 0.95
  },
  {
    id: 'feedback-2',
    sessionId: 'session-2',
    command: 'create invoice',
    rating: 3,
    comment: 'Sometimes doesn\'t recognize correctly',
    timestamp: Date.now() - 7200000,
    category: 'action',
    confidence: 0.75
  }
];

/**
 * Create mock analytics data for testing
 */
export const createMockAnalyticsData = () => ({
  totalCommands: 25,
  successfulCommands: 20,
  failedCommands: 5,
  averageResponseTime: 1200,
  commandHistory: [
    {
      command: 'go to dashboard',
      timestamp: Date.now() - 1000,
      success: true,
      responseTime: 800,
      confidence: 0.95
    },
    {
      command: 'create invoice',
      timestamp: Date.now() - 2000,
      success: true,
      responseTime: 1200,
      confidence: 0.88
    },
    {
      command: 'unknown command',
      timestamp: Date.now() - 3000,
      success: false,
      responseTime: 500,
      confidence: 0.3
    }
  ],
  errorHistory: [
    {
      type: 'recognition',
      error: 'no-speech',
      timestamp: Date.now() - 4000,
      context: { command: null }
    }
  ],
  sessionData: {
    startTime: Date.now() - 300000,
    endTime: Date.now(),
    duration: 300000,
    commandCount: 25
  }
});

/**
 * Simulate voice recognition start
 */
export const simulateVoiceRecognitionStart = () => {
  if (mockSpeechRecognition.onstart) {
    mockSpeechRecognition.onstart();
  }
};

/**
 * Simulate voice recognition result
 */
export const simulateVoiceRecognitionResult = (transcript, confidence = 0.9, isFinal = true) => {
  const event = {
    results: [{
      0: { transcript, confidence },
      isFinal,
      length: 1
    }],
    resultIndex: 0
  };

  if (mockSpeechRecognition.onresult) {
    mockSpeechRecognition.onresult(event);
  }
};

/**
 * Simulate voice recognition error
 */
export const simulateVoiceRecognitionError = (error = 'no-speech') => {
  const event = { error };

  if (mockSpeechRecognition.onerror) {
    mockSpeechRecognition.onerror(event);
  }
};

/**
 * Simulate voice recognition end
 */
export const simulateVoiceRecognitionEnd = () => {
  if (mockSpeechRecognition.onend) {
    mockSpeechRecognition.onend();
  }
};

/**
 * Simulate microphone permission denied
 */
export const simulatePermissionDenied = () => {
  navigator.mediaDevices.getUserMedia.mockRejectedValue(
    new Error('Permission denied')
  );
  
  navigator.permissions.query.mockResolvedValue({ state: 'denied' });
};

/**
 * Simulate microphone permission granted
 */
export const simulatePermissionGranted = () => {
  navigator.mediaDevices.getUserMedia.mockResolvedValue({
    getTracks: () => [{
      stop: jest.fn(),
      getSettings: () => ({ deviceId: 'default' })
    }]
  });
  
  navigator.permissions.query.mockResolvedValue({ state: 'granted' });
};

/**
 * Create a mock voice recognition event
 */
export const createMockVoiceEvent = (type, data = {}) => {
  const events = {
    start: () => ({ type: 'start' }),
    end: () => ({ type: 'end' }),
    error: (error = 'no-speech') => ({ type: 'error', error }),
    result: (transcript = 'test command', confidence = 0.9, isFinal = true) => ({
      type: 'result',
      results: [{
        0: { transcript, confidence },
        isFinal,
        length: 1
      }],
      resultIndex: 0
    }),
    nomatch: () => ({ type: 'nomatch' }),
    soundstart: () => ({ type: 'soundstart' }),
    soundend: () => ({ type: 'soundend' }),
    speechstart: () => ({ type: 'speechstart' }),
    speechend: () => ({ type: 'speechend' }),
    audiostart: () => ({ type: 'audiostart' }),
    audioend: () => ({ type: 'audioend' })
  };

  return events[type] ? events[type](data) : { type, ...data };
};

/**
 * Wait for voice recognition to be ready
 */
export const waitForVoiceReady = async (timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkReady = () => {
      if (mockSpeechRecognition.onstart) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Voice recognition not ready within timeout'));
      } else {
        setTimeout(checkReady, 10);
      }
    };
    
    checkReady();
  });
};

/**
 * Create a mock audio stream for testing
 */
export const createMockAudioStream = () => ({
  getTracks: () => [{
    stop: jest.fn(),
    getSettings: () => ({
      deviceId: 'default',
      groupId: 'default',
      label: 'Default Microphone'
    }),
    getCapabilities: () => ({
      deviceId: 'default',
      groupId: 'default'
    }),
    enabled: true,
    kind: 'audio',
    label: 'Default Microphone',
    muted: false,
    readyState: 'live'
  }],
  getAudioTracks: () => [{
    stop: jest.fn(),
    getSettings: () => ({ deviceId: 'default' })
  }],
  getVideoTracks: () => [],
  active: true,
  id: 'mock-stream-id'
});

/**
 * Mock browser compatibility checks
 */
export const mockBrowserCompatibility = (isSupported = true) => {
  if (isSupported) {
    global.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
    global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
  } else {
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;
  }
};

/**
 * Mock network conditions
 */
export const mockNetworkConditions = (isOnline = true, effectiveType = '4g') => {
  Object.defineProperty(navigator, 'onLine', {
    value: isOnline,
    writable: true
  });

  Object.defineProperty(navigator, 'connection', {
    value: {
      effectiveType,
      downlink: effectiveType === '4g' ? 10 : 1,
      rtt: effectiveType === '4g' ? 100 : 500,
      saveData: false,
      onchange: null
    },
    writable: true
  });
};

/**
 * Create mock user preferences
 */
export const createMockUserPreferences = () => ({
  voiceEnabled: true,
  language: 'en-US',
  sensitivity: 0.8,
  continuousListening: false,
  feedbackEnabled: true,
  analyticsEnabled: true,
  shortcuts: {
    'ctrl+shift+v': 'toggle-voice',
    'ctrl+shift+h': 'show-help'
  },
  customCommands: [
    {
      phrase: 'my custom command',
      action: 'navigate',
      target: '/custom-page'
    }
  ]
});

/**
 * Assert voice state
 */
export const assertVoiceState = (expectedState, actualState) => {
  const stateKeys = [
    'isListening',
    'isProcessing',
    'hasPermission',
    'isEnabled',
    'currentCommand',
    'error',
    'confidence'
  ];

  stateKeys.forEach(key => {
    if (expectedState.hasOwnProperty(key)) {
      expect(actualState[key]).toBe(expectedState[key]);
    }
  });
};

/**
 * Create test session data
 */
export const createTestSession = (overrides = {}) => ({
  id: 'test-session-' + Date.now(),
  startTime: Date.now() - 300000,
  endTime: Date.now(),
  commandCount: 5,
  successCount: 4,
  errorCount: 1,
  averageConfidence: 0.85,
  ...overrides
});

export default {
  renderWithVoiceProvider,
  setupVoiceServiceMocks,
  createMockVoiceCommands,
  createMockHelpTopics,
  createMockFeedbackData,
  createMockAnalyticsData,
  simulateVoiceRecognitionStart,
  simulateVoiceRecognitionResult,
  simulateVoiceRecognitionError,
  simulateVoiceRecognitionEnd,
  simulatePermissionDenied,
  simulatePermissionGranted,
  createMockVoiceEvent,
  waitForVoiceReady,
  createMockAudioStream,
  mockBrowserCompatibility,
  mockNetworkConditions,
  createMockUserPreferences,
  assertVoiceState,
  createTestSession
};
