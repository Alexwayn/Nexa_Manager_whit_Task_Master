// Simple module resolution test
const mockUseVoiceAssistant = jest.fn();

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: mockUseVoiceAssistant,
  VoiceAssistantProvider: ({ children }) => children
}));

describe('Module Resolution Test', () => {
  it('should properly mock the module', () => {
    // Import after mocking
    const { useVoiceAssistant } = require('@/providers/VoiceAssistantProvider');
    
    // Check if the mock is applied
    expect(useVoiceAssistant).toBe(mockUseVoiceAssistant);
    
    // Call the mock
    useVoiceAssistant();
    
    // Verify it was called
    expect(mockUseVoiceAssistant).toHaveBeenCalled();
  });
});
