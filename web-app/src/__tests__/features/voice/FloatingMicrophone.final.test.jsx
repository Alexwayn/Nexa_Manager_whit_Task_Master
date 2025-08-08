import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create the mock function before the jest.mock call
const mockUseVoiceAssistant = jest.fn();

// Mock the VoiceAssistantProvider module
jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockUseVoiceAssistant(),
  VoiceAssistantProvider: ({ children }) => children,
}));

import { FloatingMicrophone } from '@/features/voice/components/FloatingMicrophone';

// Mock Heroicons
jest.mock('@heroicons/react/24/solid', () => ({
  MicrophoneIcon: () => <div data-testid="microphone-icon">MicrophoneIcon</div>,
  StopIcon: () => <div data-testid="stop-icon">StopIcon</div>,
}));

jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: () => <div data-testid="microphone-icon-outline">MicrophoneIcon</div>,
}));

describe('FloatingMicrophone Final Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    // Set up default mock return value
    mockUseVoiceAssistant.mockReturnValue({
      isListening: false,
      isEnabled: true,
      microphonePermission: 'granted',
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening: jest.fn(),
    });
  });

  it('should call useVoiceAssistant hook and render correctly when enabled', () => {
    // Render the component
    const { container } = render(<FloatingMicrophone />);
    
    // Check if the mock was called
    expect(mockUseVoiceAssistant).toHaveBeenCalled();
    
    // Get the call arguments to see what was returned
    const mockCallCount = mockUseVoiceAssistant.mock.calls.length;
    const mockReturnValue = mockUseVoiceAssistant.mock.results[0]?.value;
    
    // Log the actual HTML structure
    const htmlContent = container.innerHTML;
    
    // Try to find the button by different selectors
    let button = container.querySelector('[data-testid="floating-microphone"]');
    if (!button) {
      button = container.querySelector('button');
    }
    
    // Create a detailed report
    const report = {
      mockCallCount,
      mockReturnValue,
      htmlContent,
      buttonFound: !!button,
      buttonClassName: button?.className,
      buttonDisabled: button?.disabled,
      containerChildrenCount: container.children.length,
      allButtons: Array.from(container.querySelectorAll('button')).map(btn => ({
        className: btn.className,
        disabled: btn.disabled,
        testId: btn.getAttribute('data-testid'),
        innerHTML: btn.innerHTML,
      })),
    };
    
    // Use the report in assertions to make it visible in test output
    expect(report.mockCallCount).toBeGreaterThan(0);
    
    // If we found a button, test its properties
    if (button) {
      expect(button).toBeInTheDocument();
      // Don't assert specific classes yet, just check if it's enabled
      expect(button.disabled).toBe(false);
    } else {
      // If no button found, fail with detailed info
      throw new Error(`No button found. Report: ${JSON.stringify(report, null, 2)}`);
    }
  });

  it('should render disabled when voice assistant is disabled', () => {
    // Mock disabled state
    mockUseVoiceAssistant.mockReturnValue({
      isListening: false,
      isEnabled: false,
      microphonePermission: 'denied',
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening: jest.fn(),
    });
    
    const { container } = render(<FloatingMicrophone />);
    
    // Check if the mock was called
    expect(mockUseVoiceAssistant).toHaveBeenCalled();
    
    // Try to find the button
    let button = container.querySelector('[data-testid="floating-microphone"]');
    if (!button) {
      button = container.querySelector('button');
    }
    
    if (button) {
      expect(button).toBeInTheDocument();
      expect(button.disabled).toBe(true);
    } else {
      // Create detailed report for debugging
      const report = {
        htmlContent: container.innerHTML,
        mockReturnValue: mockUseVoiceAssistant.mock.results[0]?.value,
        allElements: Array.from(container.querySelectorAll('*')).map(el => ({
          tagName: el.tagName,
          className: el.className,
          testId: el.getAttribute('data-testid'),
        })),
      };
      throw new Error(`No button found in disabled state. Report: ${JSON.stringify(report, null, 2)}`);
    }
  });
});
