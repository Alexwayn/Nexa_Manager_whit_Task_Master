import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/shared/utils/testUtils';
import VoiceActivationButton from '@/components/voice/VoiceActivationButton';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';

// Mock the VoiceAssistantProvider
const mockVoiceAssistant = {
  isListening: false,
  isProcessing: false,
  isEnabled: true,
  microphonePermission: 'granted',
  activateVoice: jest.fn(),
  deactivateVoice: jest.fn(),
  error: null,
  command: '',
  response: ''
};

jest.mock('@/providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: () => mockVoiceAssistant
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }) => <div data-testid="microphone-icon" className={className} />,
  StopIcon: ({ className }) => <div data-testid="stop-icon" className={className} />
}));

describe('VoiceActivationButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVoiceAssistant.isListening = false;
    mockVoiceAssistant.isProcessing = false;
    mockVoiceAssistant.isEnabled = true;
    mockVoiceAssistant.microphonePermission = 'granted';
    mockVoiceAssistant.error = null;
  });

  describe('Rendering', () => {
    it('renders microphone icon when not listening', () => {
      render(<VoiceActivationButton />);
      expect(screen.getByTestId('microphone-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('stop-icon')).not.toBeInTheDocument();
    });

    it('renders stop icon when listening', () => {
      mockVoiceAssistant.isListening = true;
      render(<VoiceActivationButton />);
      expect(screen.getByTestId('stop-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('microphone-icon')).not.toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const { rerender } = render(<VoiceActivationButton size="sm" />);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('w-8', 'h-8');

      rerender(<VoiceActivationButton size="lg" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('w-16', 'h-16');
    });

    it('applies custom className', () => {
      render(<VoiceActivationButton className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('shows disabled state when voice assistant is disabled', () => {
      mockVoiceAssistant.isEnabled = false;
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('shows disabled state when no microphone permission', () => {
      mockVoiceAssistant.microphonePermission = 'denied';
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows processing state', () => {
      mockVoiceAssistant.isProcessing = true;
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-yellow-500');
    });

    it('shows listening state with pulsing animation', () => {
      mockVoiceAssistant.isListening = true;
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500', 'animate-pulse');
    });
  });

  describe('Interactions', () => {
    it('starts listening when clicked and not listening', async () => {
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockVoiceAssistant.activateVoice).toHaveBeenCalledTimes(1);
      });
    });

    it('stops listening when clicked and currently listening', async () => {
      mockVoiceAssistant.isListening = true;
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockVoiceAssistant.deactivateVoice).toHaveBeenCalledTimes(1);
      });
    });

    it('does not trigger action when disabled', () => {
      mockVoiceAssistant.isEnabled = false;
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      expect(mockVoiceAssistant.activateVoice).not.toHaveBeenCalled();
      expect(mockVoiceAssistant.deactivateVoice).not.toHaveBeenCalled();
    });

    it('handles keyboard activation with Enter key', async () => {
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(mockVoiceAssistant.activateVoice).toHaveBeenCalledTimes(1);
      });
    });

    it('handles keyboard activation with Space key', async () => {
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      await waitFor(() => {
        expect(mockVoiceAssistant.activateVoice).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Start voice command - Click to speak');
      expect(button).toHaveAttribute('title', 'Start voice command - Click to speak');
    });

    it('updates aria-label when listening', () => {
      mockVoiceAssistant.isListening = true;
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Stop listening - Click to stop voice recognition');
    });

    it('has proper focus styles', () => {
      render(<VoiceActivationButton />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('Integration with VoiceAssistantProvider', () => {
    it('responds to provider state changes', () => {
      const { rerender } = render(<VoiceActivationButton />);
      
      // Initially not listening
      expect(screen.getByTestId('microphone-icon')).toBeInTheDocument();
      
      // Update to listening state
      mockVoiceAssistant.isListening = true;
      rerender(<VoiceActivationButton />);
      
      expect(screen.getByTestId('stop-icon')).toBeInTheDocument();
    });
  });
});
