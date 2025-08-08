import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/shared/utils/testUtils';
import { VoiceAssistantProvider, useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('@/utils/voiceCommands', () => ({
  processVoiceCommand: jest.fn(),
  executeVoiceCommand: jest.fn()
}));

jest.mock('@/services/wakeWordDetection', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    isSupported: jest.fn(() => true),
    isInitialized: jest.fn(() => true)
  }
}));

jest.mock('@/services/voiceActivationTimeout', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn()
  }
}));

jest.mock('@/services/voiceAnalyticsService', () => ({
  __esModule: true,
  default: {
    trackCommand: jest.fn(),
    trackError: jest.fn(),
    trackSession: jest.fn()
  }
}));

jest.mock('@/services/voiceFeedbackService', () => ({
  __esModule: true,
  default: {
    submitFeedback: jest.fn()
  }
}));

jest.mock('@/shared/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Setup global mocks
global.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.speechSynthesis = mockSpeechSynthesis;

// Test component to access provider context
const TestComponent = () => {
  const voiceAssistant = useVoiceAssistant();
  
  return (
    <div>
      <div data-testid="is-enabled">{voiceAssistant.isEnabled.toString()}</div>
      <div data-testid="is-listening">{voiceAssistant.isListening.toString()}</div>
      <div data-testid="is-processing">{voiceAssistant.isProcessing.toString()}</div>
      <div data-testid="has-permission">{voiceAssistant.hasPermission.toString()}</div>
      <div data-testid="command">{voiceAssistant.command}</div>
      <div data-testid="response">{voiceAssistant.response}</div>
      <div data-testid="error">{voiceAssistant.error || 'null'}</div>
      <button onClick={voiceAssistant.startListening} data-testid="start-listening">
        Start Listening
      </button>
      <button onClick={voiceAssistant.stopListening} data-testid="stop-listening">
        Stop Listening
      </button>
      <button onClick={voiceAssistant.toggleEnabled} data-testid="toggle-enabled">
        Toggle Enabled
      </button>
    </div>
  );
};

const renderWithProvider = (component = <TestComponent />) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('VoiceAssistantProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockSpeechRecognition.start.mockClear();
    mockSpeechRecognition.stop.mockClear();
    mockSpeechRecognition.addEventListener.mockClear();
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
    
    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      },
      writable: true
    });
  });

  describe('Initial State', () => {
    it('provides correct initial state', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('is-listening')).toHaveTextContent('false');
      expect(screen.getByTestId('is-processing')).toHaveTextContent('false');
      expect(screen.getByTestId('has-permission')).toHaveTextContent('false');
      expect(screen.getByTestId('command')).toHaveTextContent('');
      expect(screen.getByTestId('response')).toHaveTextContent('');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('initializes with browser support detection', () => {
      renderWithProvider();
      
      // Should detect if speech recognition is supported
      expect(global.SpeechRecognition || global.webkitSpeechRecognition).toBeDefined();
    });
  });

  describe('Permission Handling', () => {
    it('requests microphone permission when starting listening', async () => {
      renderWithProvider();
      
      const startButton = screen.getByTestId('start-listening');
      
      await act(async () => {
        fireEvent.click(startButton);
      });
      
      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      });
    });

    it('handles permission denied gracefully', async () => {
      navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));
      
      renderWithProvider();
      
      const startButton = screen.getByTestId('start-listening');
      
      await act(async () => {
        fireEvent.click(startButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('null');
      });
    });
  });

  describe('Voice Recognition', () => {
    it('starts speech recognition when startListening is called', async () => {
      navigator.mediaDevices.getUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }]
      });
      
      renderWithProvider();
      
      const startButton = screen.getByTestId('start-listening');
      
      await act(async () => {
        fireEvent.click(startButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('has-permission')).toHaveTextContent('true');
      });
      
      await waitFor(() => {
        expect(mockSpeechRecognition.start).toHaveBeenCalled();
      });
    });

    it('stops speech recognition when stopListening is called', async () => {
      // First start listening
      navigator.mediaDevices.getUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }]
      });
      
      renderWithProvider();
      
      const startButton = screen.getByTestId('start-listening');
      const stopButton = screen.getByTestId('stop-listening');
      
      await act(async () => {
        fireEvent.click(startButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('is-listening')).toHaveTextContent('true');
      });
      
      await act(async () => {
        fireEvent.click(stopButton);
      });
      
      await waitFor(() => {
        expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      });
    });

    it('processes voice commands when recognition result is received', async () => {
      const { processVoiceCommand, executeVoiceCommand } = require('@/utils/voiceCommands');
      
      processVoiceCommand.mockReturnValue({
        action: 'navigate',
        target: '/dashboard',
        confidence: 0.9
      });
      
      executeVoiceCommand.mockResolvedValue({
        success: true,
        message: 'Navigated to dashboard'
      });
      
      renderWithProvider();
      
      // Simulate speech recognition result
      const resultEvent = {
        results: [[{
          transcript: 'go to dashboard',
          confidence: 0.9
        }]]
      };
      
      // Get the onresult callback that was registered
      const onResultCallback = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];
      
      if (onResultCallback) {
        await act(async () => {
          onResultCallback(resultEvent);
        });
        
        await waitFor(() => {
          expect(processVoiceCommand).toHaveBeenCalledWith('go to dashboard');
          expect(executeVoiceCommand).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('handles speech recognition errors', async () => {
      renderWithProvider();
      
      // Simulate speech recognition error
      const errorEvent = {
        error: 'no-speech'
      };
      
      const onErrorCallback = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];
      
      if (onErrorCallback) {
        await act(async () => {
          onErrorCallback(errorEvent);
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('error')).not.toHaveTextContent('null');
        });
      }
    });

    it('clears errors when starting new session', async () => {
      renderWithProvider();
      
      // First set an error
      const errorEvent = { error: 'no-speech' };
      const onErrorCallback = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];
      
      if (onErrorCallback) {
        await act(async () => {
          onErrorCallback(errorEvent);
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('error')).not.toHaveTextContent('null');
        });
        
        // Then start listening again
        navigator.mediaDevices.getUserMedia.mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        });
        
        const startButton = screen.getByTestId('start-listening');
        
        await act(async () => {
          fireEvent.click(startButton);
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent('null');
        });
      }
    });
  });

  describe('State Management', () => {
    it('toggles enabled state correctly', async () => {
      renderWithProvider();
      
      const toggleButton = screen.getByTestId('toggle-enabled');
      
      // Initially disabled
      expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
      
      await act(async () => {
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
      });
      
      await act(async () => {
        fireEvent.click(toggleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
      });
    });

    it('updates command state when voice input is received', async () => {
      renderWithProvider();
      
      const resultEvent = {
        results: [[{
          transcript: 'test command',
          confidence: 0.8
        }]]
      };
      
      const onResultCallback = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];
      
      if (onResultCallback) {
        await act(async () => {
          onResultCallback(resultEvent);
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('command')).toHaveTextContent('test command');
        });
      }
    });
  });

  describe('Cleanup', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = renderWithProvider();
      
      unmount();
      
      // Should have stopped any ongoing recognition
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });
  });

  describe('Integration with Services', () => {
    it('integrates with analytics service', async () => {
      const voiceAnalyticsService = require('@/services/voiceAnalyticsService').default;
      
      renderWithProvider();
      
      const resultEvent = {
        results: [[{
          transcript: 'test command',
          confidence: 0.8
        }]]
      };
      
      const onResultCallback = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];
      
      if (onResultCallback) {
        await act(async () => {
          onResultCallback(resultEvent);
        });
        
        await waitFor(() => {
          expect(voiceAnalyticsService.trackCommand).toHaveBeenCalled();
        });
      }
    });

    it('integrates with feedback service for automatic feedback', async () => {
      const voiceFeedbackService = require('@/services/voiceFeedbackService').default;
      const { executeVoiceCommand } = require('@/utils/voiceCommands');
      
      executeVoiceCommand.mockResolvedValue({
        success: true,
        message: 'Command executed successfully'
      });
      
      renderWithProvider();
      
      const resultEvent = {
        results: [[{
          transcript: 'test command',
          confidence: 0.9
        }]]
      };
      
      const onResultCallback = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];
      
      if (onResultCallback) {
        await act(async () => {
          onResultCallback(resultEvent);
        });
        
        await waitFor(() => {
          expect(voiceFeedbackService.submitFeedback).toHaveBeenCalled();
        });
      }
    });
  });
});
