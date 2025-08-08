// Mock useVoiceAssistant hook
const mockActivateVoice = jest.fn();
const mockDeactivateVoice = jest.fn();

// Create a mock state object that we can modify in tests
const mockVoiceAssistantState = {
  isListening: false,
  isProcessing: false,
  isEnabled: true,
  microphonePermission: 'granted',
  activateVoice: mockActivateVoice,
  deactivateVoice: mockDeactivateVoice,
  error: null,
  command: '',
  response: ''
};

// Make mock functions globally accessible for the testing library mock
global.mockVoiceAssistantFunctions = {
  activateVoice: mockActivateVoice,
  deactivateVoice: mockDeactivateVoice,
  getState: () => mockVoiceAssistantState
};

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockVoiceAssistantState,
}));

import React from 'react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import the actual VoiceActivationButton component
import VoiceActivationButton from '../../../components/voice/VoiceActivationButton';

// Import the actual testing library functions directly to bypass the mock
const { render, screen } = jest.requireActual('@testing-library/react');

describe('VoiceActivationButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state to defaults
    Object.assign(mockVoiceAssistantState, {
      isListening: false,
      isProcessing: false,
      isEnabled: true,
      microphonePermission: 'granted',
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      error: null,
      command: '',
      response: ''
    });
    
    // Set up global mock functions that the component expects
    global.mockVoiceAssistantFunctions = {
      activateVoice: mockActivateVoice,
      deactivateVoice: mockDeactivateVoice,
      getState: () => mockVoiceAssistantState
    };
  });

  afterEach(() => {
    delete global.mockVoiceAssistantFunctions;
  });

  it('mock functions work correctly', () => {
    console.log('🔧 Test: Testing mock functions directly');
    
    // Test that mock functions exist and can be called
    expect(mockActivateVoice).toBeDefined();
    expect(mockDeactivateVoice).toBeDefined();
    
    // Call the functions directly
    mockActivateVoice();
    mockDeactivateVoice();
    
    // Verify they were called
    expect(mockActivateVoice).toHaveBeenCalledTimes(1);
    expect(mockDeactivateVoice).toHaveBeenCalledTimes(1);
    
    console.log('🔧 Test: Mock functions work correctly');
  });

  it('button click event works', async () => {
    console.log('🔧 Test: Testing basic button click');
    
    let clickCount = 0;
    const TestButton = () => {
      const handleClick = () => {
        clickCount++;
        console.log('🔧 Test: Button was clicked! Count:', clickCount);
      };
      
      return <button onClick={handleClick}>Test Button</button>;
    };
    
    const user = userEvent.setup();
    render(<TestButton />);
    const button = screen.getByRole('button');
    
    await user.click(button);
    
    expect(clickCount).toBe(1);
    console.log('🔧 Test: Basic button click works');
  });

  it('calls activateVoice when clicked and not listening', async () => {
    console.log('🔧 Test: Starting activateVoice test');
    mockActivateVoice.mockClear();
    
    const user = userEvent.setup();
    const { container } = render(<VoiceActivationButton />);
    
    console.log('🔧 Test: Container HTML:', container.innerHTML);

    const button = screen.getByTestId('voice-activation-button');
    console.log('🔧 Test: Button found:', !!button);
    console.log('🔧 Test: Button tagName:', button.tagName);
    console.log('🔧 Test: Button disabled:', button.disabled);
    console.log('🔧 Test: Button className:', button.className);
    console.log('🔧 Test: Button attributes:', Array.from(button.attributes).map(attr => `${attr.name}="${attr.value}"`));
    
    // Verify button exists and is not disabled
    expect(button).toBeInTheDocument();
    expect(button.disabled).toBe(false);
    
    console.log('🔧 Test: About to click button');
    // Click the button using userEvent
    await user.click(button);
    console.log('🔧 Test: Button clicked');
    
    console.log('🔧 Test: mockActivateVoice call count:', mockActivateVoice.mock.calls.length);
    
    // The VoiceActivationButton should call activateVoice directly
    expect(mockActivateVoice).toHaveBeenCalledTimes(1);
  });

  it('calls deactivateVoice when clicked and listening', async () => {
    console.log('🔧 Test: Starting deactivateVoice test');
    mockDeactivateVoice.mockClear();
    
    // Set up the state to be listening
    Object.assign(mockVoiceAssistantState, { isListening: true });
    
    const user = userEvent.setup();
    render(<VoiceActivationButton />);

    const button = screen.getByTestId('voice-activation-button');
    
    // Click the button using userEvent
    await user.click(button);
    
    // The VoiceActivationButton should call deactivateVoice directly
    expect(mockDeactivateVoice).toHaveBeenCalledTimes(1);
  });
});