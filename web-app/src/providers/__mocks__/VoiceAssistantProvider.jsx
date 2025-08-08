// Manual mock for VoiceAssistantProvider
const mockUseVoiceAssistant = jest.fn();

// Default mock values
const defaultMockValues = {
  isEnabled: false,
  isListening: false,
  isProcessing: false,
  microphonePermission: 'denied',
  error: null,
  startListening: jest.fn(),
  stopListening: jest.fn(),
  isRecording: false,
  transcript: '',
  confidence: 0,
  lastCommand: null,
  isCommandExecuting: false,
  commandHistory: [],
  settings: {
    language: 'en-US',
    autoStart: false,
    continuousMode: false,
    noiseReduction: true,
    echoCancellation: true
  },
  initializeVoiceAssistant: jest.fn(),
  cleanup: jest.fn(),
  executeCommand: jest.fn(),
  updateSettings: jest.fn(),
  clearTranscript: jest.fn(),
  clearError: jest.fn()
};

// Set default return value
mockUseVoiceAssistant.mockReturnValue(defaultMockValues);

// Mock provider component
const VoiceAssistantProvider = ({ children }) => children;

// Export the mock
export { mockUseVoiceAssistant as useVoiceAssistant };
export default VoiceAssistantProvider;
export { VoiceAssistantProvider };
