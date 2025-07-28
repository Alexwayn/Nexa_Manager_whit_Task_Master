import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/shared/utils/testUtils';
import VoiceIndicator from '@/components/voice/VoiceIndicator';

// Mock the VoiceAssistantProvider
const mockVoiceAssistant = {
  isListening: false,
  isProcessing: false,
  isEnabled: true,
  hasPermission: true,
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
  SpeakerWaveIcon: ({ className }) => <div data-testid="speaker-icon" className={className} />,
  ExclamationTriangleIcon: ({ className }) => <div data-testid="warning-icon" className={className} />
}));

describe('VoiceIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVoiceAssistant.isListening = false;
    mockVoiceAssistant.isProcessing = false;
    mockVoiceAssistant.isEnabled = true;
    mockVoiceAssistant.hasPermission = true;
    mockVoiceAssistant.error = null;
    mockVoiceAssistant.command = '';
    mockVoiceAssistant.response = '';
  });

  describe('Rendering States', () => {
    it('renders inactive state by default', () => {
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Voice Assistant')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByTestId('microphone-icon')).toBeInTheDocument();
    });

    it('renders listening state', () => {
      mockVoiceAssistant.isListening = true;
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Listening...')).toBeInTheDocument();
      expect(screen.getByTestId('microphone-icon')).toBeInTheDocument();
      
      const indicator = screen.getByTestId('microphone-icon').closest('div');
      expect(indicator).toHaveClass('text-red-500');
    });

    it('renders processing state', () => {
      mockVoiceAssistant.isProcessing = true;
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('speaker-icon')).toBeInTheDocument();
      
      const indicator = screen.getByTestId('speaker-icon').closest('div');
      expect(indicator).toHaveClass('text-blue-500');
    });

    it('renders error state', () => {
      mockVoiceAssistant.error = 'Microphone access denied';
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
      
      const indicator = screen.getByTestId('warning-icon').closest('div');
      expect(indicator).toHaveClass('text-red-500');
    });

    it('renders disabled state when voice assistant is disabled', () => {
      mockVoiceAssistant.isEnabled = false;
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Disabled')).toBeInTheDocument();
      
      const container = screen.getByText('Voice Assistant').closest('div');
      expect(container).toHaveClass('opacity-50');
    });

    it('renders no permission state', () => {
      mockVoiceAssistant.hasPermission = false;
      render(<VoiceIndicator />);
      
      expect(screen.getByText('No Permission')).toBeInTheDocument();
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(<VoiceIndicator size="sm" />);
      
      const icon = screen.getByTestId('microphone-icon');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    it('renders medium size correctly (default)', () => {
      render(<VoiceIndicator />);
      
      const icon = screen.getByTestId('microphone-icon');
      expect(icon).toHaveClass('w-5', 'h-5');
    });

    it('renders large size correctly', () => {
      render(<VoiceIndicator size="lg" />);
      
      const icon = screen.getByTestId('microphone-icon');
      expect(icon).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Show Text Prop', () => {
    it('shows text when showText is true (default)', () => {
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Voice Assistant')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('hides text when showText is false', () => {
      render(<VoiceIndicator showText={false} />);
      
      expect(screen.queryByText('Voice Assistant')).not.toBeInTheDocument();
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
      expect(screen.getByTestId('microphone-icon')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<VoiceIndicator className="custom-class" />);
      
      const container = screen.getByText('Voice Assistant').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('applies correct animation classes for listening state', () => {
      mockVoiceAssistant.isListening = true;
      render(<VoiceIndicator />);
      
      const icon = screen.getByTestId('microphone-icon');
      expect(icon).toHaveClass('animate-pulse');
    });

    it('applies correct animation classes for processing state', () => {
      mockVoiceAssistant.isProcessing = true;
      render(<VoiceIndicator />);
      
      const icon = screen.getByTestId('speaker-icon');
      expect(icon).toHaveClass('animate-bounce');
    });
  });

  describe('State Priority', () => {
    it('prioritizes error state over other states', () => {
      mockVoiceAssistant.error = 'Test error';
      mockVoiceAssistant.isListening = true;
      mockVoiceAssistant.isProcessing = true;
      
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('prioritizes processing state over listening state', () => {
      mockVoiceAssistant.isListening = true;
      mockVoiceAssistant.isProcessing = true;
      
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('speaker-icon')).toBeInTheDocument();
    });

    it('shows disabled state when not enabled', () => {
      mockVoiceAssistant.isEnabled = false;
      mockVoiceAssistant.isListening = true;
      
      render(<VoiceIndicator />);
      
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<VoiceIndicator />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('aria-label', 'Voice assistant status: Inactive');
    });

    it('updates aria-label based on state', () => {
      const { rerender } = render(<VoiceIndicator />);
      
      // Listening state
      mockVoiceAssistant.isListening = true;
      rerender(<VoiceIndicator />);
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Voice assistant status: Listening...');
      
      // Processing state
      mockVoiceAssistant.isListening = false;
      mockVoiceAssistant.isProcessing = true;
      rerender(<VoiceIndicator />);
      
      expect(container).toHaveAttribute('aria-label', 'Voice assistant status: Processing...');
    });

    it('provides screen reader friendly status updates', () => {
      render(<VoiceIndicator />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('responds to voice assistant state changes', () => {
      const { rerender } = render(<VoiceIndicator />);
      
      // Start with inactive
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      
      // Change to listening
      mockVoiceAssistant.isListening = true;
      rerender(<VoiceIndicator />);
      expect(screen.getByText('Listening...')).toBeInTheDocument();
      
      // Change to processing
      mockVoiceAssistant.isListening = false;
      mockVoiceAssistant.isProcessing = true;
      rerender(<VoiceIndicator />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      // Change to error
      mockVoiceAssistant.isProcessing = false;
      mockVoiceAssistant.error = 'Test error';
      rerender(<VoiceIndicator />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});