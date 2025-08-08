import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import VoiceAssistantProvider from '@/components/voice/VoiceAssistantProvider';
import Voice from '@/components/voice/Voice';
import FloatingMicrophone from '@/components/voice/FloatingMicrophone';
import VoiceActivationButton from '@/components/voice/VoiceActivationButton';
import VoiceIndicator from '@/components/voice/VoiceIndicator';
import VoiceCommandHelp from '@/components/voice/VoiceCommandHelp';
import VoiceFeedback from '@/pages/VoiceFeedback';
import voiceAnalyticsService from '@/services/voiceAnalyticsService';
import voiceFeedbackService from '@/services/voiceFeedbackService';
import helpService from '@/services/helpService';

// Mock services
jest.mock('@/services/voiceAnalyticsService');
jest.mock('@/services/voiceFeedbackService');
jest.mock('@/services/helpService');
jest.mock('@/features/email/services/emailAttachmentService');
jest.mock('@/utils/logger');

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
  maxAlternatives: 1,
  serviceURI: '',
  grammars: null,
  onstart: jest.fn(),
  onend: jest.fn(),
  onerror: jest.fn(),
  onresult: jest.fn(),
  onnomatch: jest.fn(),
  onsoundstart: jest.fn(),
  onsoundend: jest.fn(),
  onspeechstart: jest.fn(),
  onspeechend: jest.fn(),
  onaudiostart: jest.fn(),
  onaudioend: jest.fn()
};

global.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

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

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <VoiceAssistantProvider>
        {children}
      </VoiceAssistantProvider>
    </I18nextProvider>
  </BrowserRouter>
);

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
    voiceAnalyticsService.getAnalytics.mockResolvedValue({
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      averageResponseTime: 0,
      commandHistory: []
    });

    voiceFeedbackService.submitFeedback.mockResolvedValue({ success: true });
    voiceFeedbackService.getFeedbackBySession.mockResolvedValue([]);
    voiceFeedbackService.getCommandSuggestions.mockResolvedValue([]);

    helpService.getVoiceCommands.mockResolvedValue({
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
  });

  describe('Complete Voice Assistant Workflow', () => {
    it('handles complete voice command workflow from activation to execution', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Voice />
        </TestWrapper>
      );

      // 1. Activate voice assistant
      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(activationButton);

      // 2. Verify microphone permission request
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });

      // 3. Simulate voice recognition start
      act(() => {
        mockSpeechRecognition.onstart();
      });

      // 4. Verify listening state
      expect(screen.getByText(/listening/i)).toBeInTheDocument();

      // 5. Simulate voice command result
      const mockEvent = {
        results: [{
          0: { transcript: 'go to dashboard', confidence: 0.9 },
          isFinal: true
        }]
      };

      act(() => {
        mockSpeechRecognition.onresult(mockEvent);
      });

      // 6. Verify command processing
      await waitFor(() => {
        expect(voiceAnalyticsService.trackCommand).toHaveBeenCalledWith(
          'go to dashboard',
          true,
          expect.any(Number),
          0.9
        );
      });

      // 7. Verify recognition stops
      act(() => {
        mockSpeechRecognition.onend();
      });

      expect(screen.getByText(/ready/i)).toBeInTheDocument();
    });

    it('handles voice command errors and provides feedback', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Voice />
        </TestWrapper>
      );

      // Activate voice assistant
      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(activationButton);

      // Simulate recognition error
      const mockError = { error: 'no-speech' };
      
      act(() => {
        mockSpeechRecognition.onerror(mockError);
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
        <TestWrapper>
          <VoiceActivationButton />
          <VoiceIndicator />
        </TestWrapper>
      );

      // Click activation button
      const button = screen.getByRole('button');
      await user.click(button);

      // Verify indicator shows listening state
      expect(screen.getByText(/listening/i)).toBeInTheDocument();
    });

    it('synchronizes state between floating microphone and main voice component', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FloatingMicrophone />
          <Voice />
        </TestWrapper>
      );

      // Activate from floating microphone
      const floatingButton = screen.getByRole('button', { name: /toggle voice recognition/i });
      await user.click(floatingButton);

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
          <VoiceFeedback />
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
          <VoiceFeedback />
        </TestWrapper>
      );

      // Open feedback modal
      const feedbackButton = screen.getByRole('button', { name: /provide feedback/i });
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
        <TestWrapper>
          <VoiceActivationButton />
          <VoiceIndicator />
          <FloatingMicrophone />
          <Voice />
        </TestWrapper>
      );

      // Activate voice from one component
      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(activationButton);

      // Verify all components show listening state
      const listeningElements = screen.getAllByText(/listening/i);
      expect(listeningElements.length).toBeGreaterThan(1);
    });

    it('handles permission changes across components', async () => {
      // Mock permission denied
      navigator.mediaDevices.getUserMedia.mockRejectedValue(
        new Error('Permission denied')
      );

      render(
        <TestWrapper>
          <VoiceActivationButton />
          <VoiceIndicator />
        </TestWrapper>
      );

      const user = userEvent.setup();
      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(activationButton);

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
      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });
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

      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });

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
      const voiceButton = screen.getByRole('button', { name: /start voice recognition/i });
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
      expect(screen.getByRole('button', { name: /start voice recognition/i })).toHaveFocus();

      await user.tab();
      // Should move to next focusable element in help component
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('recovers from service failures gracefully', async () => {
      // Mock service failure
      voiceAnalyticsService.trackCommand.mockRejectedValue(new Error('Service unavailable'));

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Voice />
        </TestWrapper>
      );

      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });
      await user.click(activationButton);

      // Simulate successful voice command
      act(() => {
        mockSpeechRecognition.onstart();
        mockSpeechRecognition.onresult({
          results: [{
            0: { transcript: 'go to dashboard', confidence: 0.9 },
            isFinal: true
          }]
        });
      });

      // Should continue working despite analytics failure
      await waitFor(() => {
        expect(screen.getByText(/command executed/i)).toBeInTheDocument();
      });
    });

    it('handles network connectivity issues', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      voiceFeedbackService.submitFeedback.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VoiceFeedback />
        </TestWrapper>
      );

      const feedbackButton = screen.getByRole('button', { name: /provide feedback/i });
      await user.click(feedbackButton);

      const rating5 = screen.getByRole('button', { name: /5 stars/i });
      await user.click(rating5);

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
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

      const activationButton = screen.getByRole('button', { name: /start voice recognition/i });
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

      expect(screen.getByText(/go to/i)).toBeInTheDocument();

      // Final result
      act(() => {
        mockSpeechRecognition.onresult({
          results: [{
            0: { transcript: 'go to dashboard', confidence: 0.9 },
            isFinal: true
          }]
        });
      });

      expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
    });
  });
});
