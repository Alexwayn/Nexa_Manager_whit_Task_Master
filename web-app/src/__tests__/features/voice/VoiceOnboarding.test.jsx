import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import VoiceOnboarding from '@/features/voice/components/VoiceOnboarding';
import { VoiceAssistantProvider } from '@/providers/VoiceAssistantProvider';
import React from 'react';

const renderWithProviders = (component, props = {}) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {React.cloneElement(component, props)}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('VoiceOnboarding', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

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

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      },
      writable: true,
    });
  });

  it('renders onboarding steps correctly', () => {
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    expect(screen.getByText(/welcome to voice assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('navigates through onboarding steps', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Step 1 - Introduction
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Step 2 - Permissions
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    expect(screen.getByText(/microphone permission/i)).toBeInTheDocument();
  });

  it('requests microphone permission in step 2', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next/i }));

    const enableButton = screen.getByRole('button', { name: /enable microphone/i });
    await user.click(enableButton);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true
    });
  });

  it('handles permission denied gracefully', async () => {
    const user = userEvent.setup();
    navigator.mediaDevices.getUserMedia.mockRejectedValue(
      new Error('Permission denied')
    );

    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: /next/i }));

    const enableButton = screen.getByRole('button', { name: /enable microphone/i });
    await user.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
    });
  });

  it('shows voice command examples in step 3', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to step 3
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    expect(screen.getByText(/voice commands/i)).toBeInTheDocument();
    expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/create invoice/i)).toBeInTheDocument();
  });

  it('allows practice in step 4', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to step 4
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole('button', { name: /next/i }));
    }

    expect(screen.getByText(/step 4/i)).toBeInTheDocument();
    expect(screen.getByText(/try it out/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
  });

  it('completes onboarding successfully', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /next/i }));
    }

    // Complete onboarding
    await user.click(screen.getByRole('button', { name: /finish/i }));

    expect(mockOnComplete).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'voice_onboarding_completed',
      'true'
    );
  });

  it('allows skipping onboarding', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    await user.click(screen.getByRole('button', { name: /skip/i }));

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('shows progress indicator', () => {
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '4');
  });

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Go to step 2
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();

    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });

  it('disables next button when required actions are not completed', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to step 2 (permission step)
    await user.click(screen.getByRole('button', { name: /next/i }));

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('shows helpful tips for each step', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Step 1 tips
    expect(screen.getByText(/tip:/i)).toBeInTheDocument();

    // Navigate and check tips for other steps
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/make sure your microphone/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    nextButton.focus();
    expect(nextButton).toHaveFocus();

    fireEvent.keyDown(nextButton, { key: 'Enter' });
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it('shows error states appropriately', async () => {
    const user = userEvent.setup();
    navigator.mediaDevices.getUserMedia.mockRejectedValue(
      new Error('Microphone not available')
    );

    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to permission step
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /enable microphone/i }));

    await waitFor(() => {
      expect(screen.getByText(/microphone not available/i)).toBeInTheDocument();
    });
  });

  it('saves progress and can resume', () => {
    localStorage.getItem.mockReturnValue('2'); // Saved at step 2

    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it('shows animated demonstrations', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to demonstration step
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole('button', { name: /next/i }));
    }

    expect(screen.getByTestId('voice-demo-animation')).toBeInTheDocument();
  });

  it('provides accessibility features', () => {
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Check ARIA labels
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label');
    
    // Check focus management
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('tabIndex', '-1');
  });

  it('handles mobile-specific features', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    expect(screen.getByTestId('mobile-onboarding')).toBeInTheDocument();
  });

  it('shows browser compatibility warnings', () => {
    // Mock unsupported browser
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
    });

    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    expect(screen.getByText(/browser not supported/i)).toBeInTheDocument();
  });

  it('provides troubleshooting help', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    expect(screen.getByText(/troubleshooting/i)).toBeInTheDocument();
    expect(screen.getByText(/common issues/i)).toBeInTheDocument();
  });

  it('tracks onboarding analytics', async () => {
    const user = userEvent.setup();
    const mockTrack = jest.fn();
    
    renderWithProviders(
      <VoiceOnboarding 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip}
        onTrack={mockTrack}
      />
    );

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(mockTrack).toHaveBeenCalledWith('onboarding_step_completed', {
      step: 1,
      stepName: 'introduction'
    });
  });

  it('shows personalized recommendations', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip}
        userRole="admin"
      />
    );

    // Navigate to commands step
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole('button', { name: /next/i }));
    }

    expect(screen.getByText(/admin commands/i)).toBeInTheDocument();
    expect(screen.getByText(/manage users/i)).toBeInTheDocument();
  });

  it('supports multiple languages', () => {
    renderWithProviders(
      <VoiceOnboarding 
        onComplete={mockOnComplete} 
        onSkip={mockOnSkip}
        language="es"
      />
    );

    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
  });

  it('handles offline mode gracefully', () => {
    // Mock offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    expect(screen.getByText(/limited functionality/i)).toBeInTheDocument();
  });

  it('provides video tutorials', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceOnboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const videoButton = screen.getByRole('button', { name: /watch tutorial/i });
    await user.click(videoButton);

    expect(screen.getByTestId('tutorial-video')).toBeInTheDocument();
  });
});
