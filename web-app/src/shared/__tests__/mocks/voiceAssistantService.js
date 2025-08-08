// Mock for voice assistant service
const mockVoiceAssistant = {
  // Voice state
  isListening: false,
  isProcessing: false,
  isEnabled: true,
  hasMicrophonePermission: true,

  // Voice control methods
  activateVoice: jest.fn(() => {
    mockVoiceAssistant.isListening = true;
    return Promise.resolve({ success: true });
  }),

  deactivateVoice: jest.fn(() => {
    mockVoiceAssistant.isListening = false;
    return Promise.resolve({ success: true });
  }),

  startListening: jest.fn(() => {
    mockVoiceAssistant.isListening = true;
    return Promise.resolve({ success: true });
  }),

  stopListening: jest.fn(() => {
    mockVoiceAssistant.isListening = false;
    return Promise.resolve({ success: true });
  }),

  // Permission methods
  requestMicrophonePermission: jest.fn(() => Promise.resolve(true)),
  checkMicrophonePermission: jest.fn(() => Promise.resolve(true)),

  // Processing methods
  processVoiceCommand: jest.fn(() => Promise.resolve({
    success: true,
    command: 'test command',
    response: 'Command processed successfully'
  })),

  // Configuration
  isVoiceEnabled: jest.fn(() => true),
  setVoiceEnabled: jest.fn(),

  // Event handlers
  onVoiceStart: jest.fn(),
  onVoiceEnd: jest.fn(),
  onVoiceError: jest.fn(),
  onVoiceResult: jest.fn(),
};

// Hook mock
export const useVoiceAssistant = jest.fn(() => mockVoiceAssistant);

export default mockVoiceAssistant;