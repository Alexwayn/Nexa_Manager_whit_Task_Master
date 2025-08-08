import React from 'react';

// Mock the VoiceAssistantProvider module BEFORE importing the component
const mockUseVoiceAssistant = jest.fn();

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: mockUseVoiceAssistant,
  VoiceAssistantProvider: ({ children }) => children,
}));

// Mock Heroicons BEFORE importing the component
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: () => <div data-testid="microphone-icon-outline">MicrophoneIcon</div>,
  StopIcon: () => <div data-testid="stop-icon-outline">StopIcon</div>,
}));

jest.mock('@heroicons/react/24/solid', () => ({
  MicrophoneIcon: () => <div data-testid="microphone-icon-solid">MicrophoneIcon</div>,
  StopIcon: () => <div data-testid="stop-icon-solid">StopIcon</div>,
}));

describe('FloatingMicrophone Import Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock return value
    mockUseVoiceAssistant.mockReturnValue({
      isListening: false,
      isEnabled: true,
      isProcessing: false,
      microphonePermission: 'granted',
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
    });
  });

  it('should import the component without errors', async () => {
    // Try to import the component
    let FloatingMicrophone;
    let importError = null;
    
    try {
      const module = await import('@/features/voice/components/FloatingMicrophone');
      FloatingMicrophone = module.FloatingMicrophone;
    } catch (error) {
      importError = error;
    }
    
    // Check if import was successful
    expect(importError).toBeNull();
    expect(FloatingMicrophone).toBeDefined();
    expect(typeof FloatingMicrophone).toBe('function');
  });

  it('should render the component and call the hook', async () => {
    // Import the component
    const { FloatingMicrophone } = await import('@/features/voice/components/FloatingMicrophone');
    const { render } = await import('@testing-library/react');
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    let renderError = null;
    let container = null;
    
    try {
      const result = render(<FloatingMicrophone />);
      container = result.container;
    } catch (error) {
      renderError = error;
    }
    
    // Check if render was successful
    expect(renderError).toBeNull();
    expect(container).toBeDefined();
    
    // Check if the mock was called
    expect(mockUseVoiceAssistant).toHaveBeenCalled();
    
    // Check if we have any content
    expect(container.innerHTML).not.toBe('');
    
    // Log the actual content for debugging
    if (container) {
      const buttons = container.querySelectorAll('button');
      const report = {
        mockCalls: mockUseVoiceAssistant.mock.calls.length,
        mockReturnValue: mockUseVoiceAssistant.mock.results[0]?.value,
        buttonCount: buttons.length,
        buttons: Array.from(buttons).map(btn => ({
          className: btn.className,
          disabled: btn.disabled,
          testId: btn.getAttribute('data-testid'),
          textContent: btn.textContent,
        })),
        fullHTML: container.innerHTML,
      };
      
      // Use the report in an assertion to make it visible
      expect(report.mockCalls).toBeGreaterThan(0);
      expect(report.buttonCount).toBeGreaterThan(0);
    }
  });
});
