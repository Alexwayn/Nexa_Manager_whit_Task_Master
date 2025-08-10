import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import VoiceAssistantProvider from '@/providers/VoiceAssistantProvider';
import Voice from '@/components/voice/Voice';
import FloatingMicrophone from '@/components/voice/FloatingMicrophone';
import VoiceActivationButton from '@/components/voice/VoiceActivationButton';
import VoiceIndicator from '@/components/voice/VoiceIndicator';
import VoiceCommandHelp from '@/components/voice/VoiceCommandHelp';
import VoiceFeedbackButton from '@/components/voice/VoiceFeedbackButton';
import voiceAnalyticsService from '@/services/voiceAnalyticsService';
import voiceFeedbackService from '@/services/voiceFeedbackService';
import helpService from '@/services/helpService';
import { processVoiceCommand, executeVoiceCommand } from '@/utils/voiceCommands';

// Mock services
jest.mock('@/services/voiceAnalyticsService');
jest.mock('@/services/voiceFeedbackService');
jest.mock('@/services/helpService');
jest.mock('@/features/email/services/emailAttachmentService');
jest.mock('@/utils/logger');
jest.mock('@/utils/voiceCommands', () => ({
  processVoiceCommand: jest.fn(),
  executeVoiceCommand: jest.fn()
}));

// Mock both FloatingMicrophone components to avoid conflicts with speech recognition
jest.mock('@/components/voice/FloatingMicrophone', () => {
  return function MockVoiceFloatingMicrophone() {
    return <div data-testid="voice-floating-microphone">Mocked Voice FloatingMicrophone</div>;
  };
});

jest.mock('@/components/shared/FloatingMicrophone', () => {
  return function MockSharedFloatingMicrophone() {
    return <div data-testid="shared-floating-microphone">Mocked Shared FloatingMicrophone</div>;
  };
});

// Mock jsPDF to prevent import errors
jest.mock('jspdf', () => ({
  default: jest.fn(() => ({
    text: jest.fn(),
    save: jest.fn(),
    addPage: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    autoTable: jest.fn()
  })),
  jsPDF: jest.fn(() => ({
    text: jest.fn(),
    save: jest.fn(),
    addPage: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    autoTable: jest.fn()
  }))
}));

jest.mock('jspdf-autotable', () => jest.fn());

// Mock SpeechRecognition with custom getters/setters for event handlers
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  
  // Use private properties to store the actual handlers
  _onstart: null,
  _onresult: null,
  _onerror: null,
  _onend: null,
  _providerHandlerSet: false, // Track if provider has set its handler
  
  // Custom getters and setters that log when handlers are assigned
  get onstart() { return this._onstart; },
  set onstart(handler) { 
    console.log('Setting onstart handler:', typeof handler);
    this._onstart = handler; 
  },
  
  get onresult() { 
    console.log('Getting onresult handler:', typeof this._onresult);
    return this._onresult; 
  },
  set onresult(handler) { 
    console.log('Setting onresult handler:', typeof handler);
    console.log('Handler function:', handler ? handler.toString().substring(0, 200) : 'null');
    
    // Only allow the first handler to be set (should be the provider's)
    // or if it's explicitly from the provider (contains debug messages)
    const isProviderHandler = handler && handler.toString().includes('DEBUG: onresult handler called with event');
    
    if (!this._providerHandlerSet || isProviderHandler) {
      this._onresult = handler;
      if (isProviderHandler) {
        this._providerHandlerSet = true;
        console.log('Provider onresult handler set and locked');
      }
    } else {
      console.log('Ignoring onresult handler - provider handler already set');
    }
  },
  
  get onerror() { return this._onerror; },
  set onerror(handler) { 
    console.log('Setting onerror handler:', typeof handler);
    this._onerror = handler; 
  },
  
  get onend() { return this._onend; },
  set onend(handler) { 
    console.log('Setting onend handler:', typeof handler);
    this._onend = handler; 
  }
};

// Mock SpeechRecognition constructor to always return the same instance
global.SpeechRecognition = jest.fn(() => {
  console.log('SpeechRecognition constructor called');
  return mockSpeechRecognition;
});
window.SpeechRecognition = global.SpeechRecognition;
global.webkitSpeechRecognition = jest.fn(() => {
  console.log('webkitSpeechRecognition constructor called');
  return mockSpeechRecognition;
});
window.webkitSpeechRecognition = global.webkitSpeechRecognition;

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn()
  }
});

// Mock audio context
global.AudioContext = jest.fn(() => ({
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: jest.fn()
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  close: jest.fn(),
  state: 'running'
}));

// Test wrapper component with mock provider
const TestWrapper = ({ children, mockState = {} }) => {
  const defaultMockState = {
    isListening: false,
    isProcessing: false,
    isEnabled: true,
    lastCommand: null,
    lastResponse: null,
    currentLanguage: 'en-US',
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
    aiService: 'browser',
    wakeWord: 'hey nexa',
    listeningTimeout: 10000,
    feedbackVolume: 0.8,
    enabledCommandTypes: ['navigation', 'document', 'client', 'settings', 'general'],
    customCommands: [],
    sessionId: null,
    error: null,
    microphonePermission: 'granted',
    recognition: mockSpeechRecognition, // Use the same mock instance
    synthesis: null,
    wakeWordEnabled: true,
    wakeWordSensitivity: 0.7,
    wakeWordDetected: false,
    wakeWordConfidence: 0,
    timeoutActive: false,
    timeoutRemaining: 0,
    timeoutPercentage: 100,
    showTimeoutCountdown: true,
    showWakeWordFeedback: true,
    wakeWordFeedbackPosition: 'top-center',
    timeoutCountdownPosition: 'bottom-right',
    ...mockState
  };

  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <VoiceAssistantProvider initialState={defaultMockState}>
          {children}
        </VoiceAssistantProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};



describe('Voice Assistant Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock permissions API
    Object.defineProperty(navigator, 'permissions', {
      writable: true,
      value: {
        query: jest.fn(() => Promise.resolve({ state: 'granted' }))
      }
    });

    // Setup service mocks
    voiceAnalyticsService.getAnalytics = jest.fn().mockResolvedValue({
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      averageResponseTime: 0,
      commandHistory: []
    });
    voiceAnalyticsService.trackCommand = jest.fn().mockResolvedValue();
    voiceAnalyticsService.trackError = jest.fn().mockResolvedValue();
    voiceAnalyticsService.trackFailure = jest.fn().mockResolvedValue();
    voiceAnalyticsService.trackRecognitionFailure = jest.fn().mockResolvedValue();
    voiceAnalyticsService.trackSessionStart = jest.fn().mockResolvedValue();
    voiceAnalyticsService.trackSessionEnd = jest.fn().mockResolvedValue();
    voiceAnalyticsService.getAnalyticsSummary = jest.fn().mockResolvedValue({});
    voiceAnalyticsService.getDetailedAnalytics = jest.fn().mockResolvedValue({});
    voiceAnalyticsService.getCurrentSession = jest.fn().mockReturnValue({});
    voiceAnalyticsService.exportAnalytics = jest.fn().mockReturnValue('{}');
    voiceAnalyticsService.clearAnalytics = jest.fn().mockResolvedValue();
    voiceAnalyticsService.getAnalyticsForPeriod = jest.fn().mockResolvedValue({});

    voiceFeedbackService.submitFeedback = jest.fn().mockResolvedValue({ success: true });
    voiceFeedbackService.collectFeedback = jest.fn().mockResolvedValue({ success: true });
    voiceFeedbackService.getFeedbackBySession = jest.fn().mockResolvedValue([]);
    voiceFeedbackService.getCommandSuggestions = jest.fn().mockResolvedValue([]);

    helpService.getVoiceCommands = jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'nav-dashboard',
          category: 'navigation',
          command: 'go to dashboard',
          description: 'Navigate to the main dashboard',
          examples: ['go to dashboard', 'show dashboard']
        }
      ]
    });

    // Mock voice command processing
    processVoiceCommand.mockImplementation((...args) => {
      console.log('processVoiceCommand called with:', args);
      return Promise.resolve({
        type: 'navigation',
        target: 'dashboard',
        confidence: 0.9
      });
    });
    
    executeVoiceCommand.mockImplementation((...args) => {
      console.log('executeVoiceCommand called with:', args);
      return Promise.resolve('Navigating to dashboard');
    });
  });

  describe('Complete Voice Assistant Workflow', () => {
    it('handles complete voice command workflow from activation to execution', async () => {
      const user = userEvent.setup();
      
      console.log('=== Starting test ===');
      console.log('mockSpeechRecognition:', mockSpeechRecognition);
      console.log('window.SpeechRecognition:', window.SpeechRecognition);
      console.log('global.SpeechRecognition:', global.SpeechRecognition);
      
      render(
        <TestWrapper>
          <Voice />
          <VoiceIndicator />
        </TestWrapper>
      );

      console.log('=== Components rendered ===');

      // 1. Activate voice assistant
      const activationButton = screen.getByRole('button', { name: /start voice command/i });
      console.log('=== Clicking activation button ===');
      await user.click(activationButton);

      // 2. Verify microphone permission request
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // 3. Wait for provider to initialize and set up handlers
      await waitFor(() => {
        console.log('DEBUG: Checking handlers - _onstart:', !!mockSpeechRecognition._onstart, '_onresult:', !!mockSpeechRecognition._onresult);
        expect(mockSpeechRecognition._onstart).toBeTruthy();
        expect(mockSpeechRecognition._onresult).toBeTruthy();
      });

      // 4. Simulate voice recognition start
      act(() => {
        console.log('Triggering onstart handler');
        if (mockSpeechRecognition._onstart) {
          mockSpeechRecognition._onstart();
        }
      });

      // 5. Verify listening state
      expect(screen.getByText(/listening/i)).toBeInTheDocument();

      // 6. Simulate voice command result
      const mockEvent = {
        results: [
          [
            { transcript: 'go to dashboard', confidence: 0.9 }
          ]
        ]
      };

      act(() => {
        console.log('Triggering onresult with:', mockEvent);
        console.log('Event structure:', JSON.stringify(mockEvent, null, 2));
        console.log('Event.results[0]:', mockEvent.results[0]);
        console.log('Event.results[0][0]:', mockEvent.results[0][0]);
        console.log('_onresult handler type:', typeof mockSpeechRecognition._onresult);
        if (mockSpeechRecognition._onresult) {
          console.log('DEBUG: About to call _onresult handler');
          try {
            mockSpeechRecognition._onresult(mockEvent);
            console.log('DEBUG: _onresult handler called successfully');
          } catch (error) {
            console.log('DEBUG: Error in _onresult handler:', error);
          }
        } else {
          console.log('No _onresult handler found!');
        }
      });

      // 7. Verify command processing
      await waitFor(() => {
        expect(voiceAnalyticsService.trackCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'go to dashboard',
            confidence: 0.9,
            success: true,
            action: 'navigation'
          })
        );
      });

      // 8. Verify recognition stops
      act(() => {
        console.log('Triggering onend handler');
        if (mockSpeechRecognition._onend) {
          mockSpeechRecognition._onend();
        }
      });

      expect(screen.getByText(/ready/i)).toBeInTheDocument();
    });

    it('handles voice command errors and provides feedback', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Voice />
          <VoiceIndicator />
        </TestWrapper>
      );

      // Activate voice assistant
      const activationButton = screen.getByRole('button', { name: /start voice command/i });
      await user.click(activationButton);

      // Wait for provider to initialize
      await waitFor(() => {
        expect(mockSpeechRecognition._onerror).toBeTruthy();
      });

      // Simulate recognition error
      const mockError = { error: 'no-speech' };
      
      act(() => {
        if (mockSpeechRecognition._onerror) {
          mockSpeechRecognition._onerror(mockError);
        }
      });

      // Verify error handling
      await waitFor(() => {
        expect(voiceAnalyticsService.trackError).toHaveBeenCalledWith(
          'recognition',
          'no-speech',
          expect.any(Object)
        );
      });

      expect(screen.getByText(/no speech detected/i)).toBeInTheDocument();
    });

    it('integrates voice activation button with main voice component', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper mockState={{ isListening: true }}>
          <VoiceActivationButton />
          <VoiceIndicator />
        </TestWrapper>
      );

      // Verify indicator shows listening state
      expect(screen.getByText(/listening/i)).toBeInTheDocument();
    });

    it('synchronizes state between floating microphone and main voice component', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper mockState={{ isListening: true }}>
          <FloatingMicrophone />
          <Voice />
        </TestWrapper>
      );

      // Verify both components show active state
      const indicators = screen.getAllByText(/listening/i);
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  describe('Voice Command Help Integration', () => {
    it('displays available commands and allows execution', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VoiceCommandHelp />
          <Voice />
        </TestWrapper>
      );

      // Wait for commands to load
      await waitFor(() => {
        expect(screen.getByText('go to dashboard')).toBeInTheDocument();
      });

      // Click try command button
      const tryButton = screen.getByRole('button', { name: /try this command/i });
      await user.click(tryButton);

      // Verify command execution
      await waitFor(() => {
        expect(voiceAnalyticsService.trackCommand).toHaveBeenCalled();
      });
    });

    it('updates command usage statistics', async () => {
      const user = userEvent.setup();
      
      helpService.updateCommandUsage.mockResolvedValue({ success: true });
      
      render(
        <TestWrapper>
          <VoiceCommandHelp />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('go to dashboard')).toBeInTheDocument();
      });

      const tryButton = screen.getByRole('button', { name: /try this command/i });
      await user.click(tryButton);

      await waitFor(() => {
        expect(helpService.updateCommandUsage).toHaveBeenCalledWith('nav-dashboard');
      });
    });
  });

  describe('Voice Feedback Integration', () => {
    it('collects and displays feedback analytics', async () => {
      voiceFeedbackService.getFeedbackAnalytics.mockResolvedValue({
        totalFeedback: 10,
        averageRating: 4.2,
        ratingDistribution: { 5: 6, 4: 2, 3: 1, 2: 1, 1: 0 },
        commonIssues: ['Recognition accuracy', 'Response time']
      });

      render(
        <TestWrapper>
          <VoiceFeedbackButton />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('4.2')).toBeInTheDocument();
        expect(screen.getByText('Recognition accuracy')).toBeInTheDocument();
      });
    });

    it('submits feedback and updates analytics', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VoiceFeedbackButton />
        </TestWrapper>
      );

      // Open feedback modal
      const feedbackButton = screen.getByRole('button', { name: /give feedback/i });
      await user.click(feedbackButton);

      // Submit feedback
      const rating5 = screen.getByRole('button', { name: /5 stars/i });
      await user.click(rating5);

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(voiceFeedbackService.submitFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: 5,
            sessionId: expect.any(String)
          })
        );
      });
    });
  });

  describe('Multi-Component State Synchronization', () => {
    it('synchronizes voice state across all components', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper mockState={{ isListening: true }}>
          <VoiceActivationButton />
          <VoiceIndicator />
          <FloatingMicrophone />
          <Voice />
        </TestWrapper>
      );

      // Verify all components show listening state
      const listeningElements = screen.getAllByText(/listening/i);
      expect(listeningElements.length).toBeGreaterThan(1);
    });

    it('handles permission changes across components', async () => {
      render(
        <TestWrapper>
          <VoiceActivationButton />
          <VoiceIndicator />
        </TestWrapper>
      );

      const user = userEvent.setup();
      const activationButton = screen.getByRole('button', { name: /start voice command/i });
      await user.click(activationButton);

      // Simulate speech recognition permission denied error
      act(() => {
        if (mockSpeechRecognition.onerror) {
          mockSpeechRecognition.onerror({ error: 'not-allowed' });
        }
      });

      // Verify error state in all components
      await waitFor(() => {
        expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Resource Management', () => {
    it('properly cleans up resources when components unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <Voice />
        </TestWrapper>
      );

      const user = userEvent.setup();
      const activationButton = screen.getByRole('button', { name: /start voice command/i });
      await user.click(activationButton);

      // Unmount component
      unmount();

      // Verify cleanup
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('handles multiple rapid voice activations gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Voice />
        </TestWrapper>
      );

      const activationButton = screen.getByRole('button', { name: /start voice command/i });

      // Rapid clicks
      await user.click(activationButton);
      await user.click(activationButton);
      await user.click(activationButton);

      // Should handle gracefully without errors
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });
  });

  describe('Accessibility Integration', () => {
    it('provides proper ARIA labels and screen reader support', async () => {
      render(
        <TestWrapper>
          <Voice />
          <VoiceIndicator />
        </TestWrapper>
      );

      // Check ARIA attributes
      const voiceButton = screen.getByRole('button', { name: /start voice command/i });
      expect(voiceButton).toHaveAttribute('aria-label');

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('supports keyboard navigation across voice components', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VoiceActivationButton />
          <VoiceCommandHelp />
        </TestWrapper>
      );

      // Tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /start voice command/i })).toHaveFocus();

      await user.tab();
      // Should move to next focusable element in help component
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('recovers from service failures gracefully', async () => {
      // Mock service failure - but don't let it throw unhandled errors
      voiceAnalyticsService.trackCommand = jest.fn().mockImplementation((...args) => {
        console.log('trackCommand called with:', args);
        return Promise.reject(new Error('Service unavailable'));
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Voice />
          <VoiceIndicator />
        </TestWrapper>
      );

      const activationButton = screen.getByRole('button', { name: /start voice command/i });
      await user.click(activationButton);

      // Manually trigger the onstart event to simulate speech recognition starting
      act(() => {
        console.log('Triggering onstart, handler exists:', !!mockSpeechRecognition.onstart);
        if (mockSpeechRecognition.onstart) {
          mockSpeechRecognition.onstart();
        }
      });

      // Wait for activation to complete
      await waitFor(() => {
        expect(screen.getByText(/listening/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Simulate successful voice command
      const mockEvent = {
        results: [{
          0: { transcript: 'go to dashboard', confidence: 0.9 },
          isFinal: true
        }]
      };

      act(() => {
        console.log('Triggering onresult, handler exists:', !!mockSpeechRecognition.onresult);
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult(mockEvent);
        }
      });

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // End the recognition
      act(() => {
        console.log('Triggering onend, handler exists:', !!mockSpeechRecognition.onend);
        if (mockSpeechRecognition.onend) {
          mockSpeechRecognition.onend();
        }
      });

      // Verify trackCommand was called (even though it fails)
      expect(voiceAnalyticsService.trackCommand).toHaveBeenCalled();
    }, 10000);

    it('handles network connectivity issues', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      voiceFeedbackService.collectFeedback.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      
      // Mock initial state for VoiceAssistantProvider
      const mockInitialState = {
        lastCommand: 'test command',
        lastConfidence: 0.9,
        isEnabled: true,
        isListening: false,
        isProcessing: false,
        lastResponse: null,
        currentLanguage: 'en-US',
        supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
        aiService: 'browser',
        wakeWord: 'hey nexa',
        listeningTimeout: 10000,
        feedbackVolume: 0.8,
        enabledCommandTypes: ['navigation', 'document', 'client', 'settings', 'general'],
        customCommands: [],
        sessionId: null,
        error: null,
        microphonePermission: 'granted',
        recognition: null,
        synthesis: null,
        wakeWordEnabled: true,
        wakeWordSensitivity: 0.7,
        wakeWordDetected: false,
        wakeWordConfidence: 0,
        timeoutActive: false,
        timeoutRemaining: 0,
        timeoutPercentage: 100,
        showTimeoutCountdown: true,
        showWakeWordFeedback: true,
        wakeWordFeedbackPosition: 'top-center',
        timeoutCountdownPosition: 'bottom-right',
        feedbackCount: 0
      };
      
      render(
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <VoiceAssistantProvider initialState={mockInitialState}>
              <VoiceFeedbackButton />
            </VoiceAssistantProvider>
          </I18nextProvider>
        </BrowserRouter>
      );

      const feedbackButton = screen.getByRole('button', { name: /give feedback/i });
      await user.click(feedbackButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
      });

      // Select feedback type first (required)
      const positiveButton = screen.getByText('Positive');
      await user.click(positiveButton);

      // Click the 5th star (rating buttons are in order 1-5)
      const starButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.type === 'button' && 
        button.className.includes('text-yellow')
      );
      await user.click(starButtons[4]); // 5th star (0-indexed)

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should show offline message
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates and Notifications', () => {
    it('updates UI in real-time during voice recognition', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Voice />
          <VoiceIndicator />
        </TestWrapper>
      );

      const activationButton = screen.getByRole('button', { name: /start voice command/i });
       await user.click(activationButton);

      // Start recognition
      act(() => {
        mockSpeechRecognition.onstart();
      });

      expect(screen.getByText(/listening/i)).toBeInTheDocument();

      // Interim results
      act(() => {
        mockSpeechRecognition.onresult({
          results: [{
            0: { transcript: 'go to', confidence: 0.7 },
            isFinal: false
          }]
        });
      });

      expect(screen.getAllByText(/go to/i).length).toBeGreaterThan(0);

      // Final result
      act(() => {
        mockSpeechRecognition.onresult({
          results: [{
            0: { transcript: 'go to dashboard', confidence: 0.9 },
            isFinal: true
          }]
        });
      });

      expect(screen.getAllByText(/go to dashboard/i).length).toBeGreaterThan(0);
    });
  });
});
