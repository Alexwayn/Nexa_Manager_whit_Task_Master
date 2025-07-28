import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceFeedbackModal from '@/features/voice/components/VoiceFeedbackModal';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';

const renderWithProviders = (component) => {
  return render(
    <VoiceAssistantProvider>
      {component}
    </VoiceAssistantProvider>
  );
};

describe('VoiceFeedbackModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    command: 'go to dashboard',
    confidence: 0.85
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    expect(screen.getByText(/voice command feedback/i)).toBeInTheDocument();
    expect(screen.getByText('go to dashboard')).toBeInTheDocument();
    expect(screen.getByText(/confidence: 85%/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(
      <VoiceFeedbackModal {...defaultProps} isOpen={false} />
    );

    expect(screen.queryByText(/voice command feedback/i)).not.toBeInTheDocument();
  });

  it('displays quick feedback options', () => {
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    expect(screen.getByText(/worked perfectly/i)).toBeInTheDocument();
    expect(screen.getByText(/mostly correct/i)).toBeInTheDocument();
    expect(screen.getByText(/partially correct/i)).toBeInTheDocument();
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    expect(screen.getByText(/completely wrong/i)).toBeInTheDocument();
  });

  it('handles quick feedback selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const perfectButton = screen.getByText(/worked perfectly/i);
    await user.click(perfectButton);

    expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Rating should be 5
  });

  it('allows custom rating selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    // Click on 3-star rating
    const threeStarButton = screen.getByLabelText(/3 stars/i);
    await user.click(threeStarButton);

    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('handles comment input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const commentTextarea = screen.getByPlaceholderText(/tell us more/i);
    await user.type(commentTextarea, 'This is my feedback comment');

    expect(commentTextarea).toHaveValue('This is my feedback comment');
  });

  it('submits feedback with all data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    // Select rating
    const fourStarButton = screen.getByLabelText(/4 stars/i);
    await user.click(fourStarButton);

    // Add comment
    const commentTextarea = screen.getByPlaceholderText(/tell us more/i);
    await user.type(commentTextarea, 'Good but could be better');

    // Submit
    const submitButton = screen.getByText(/submit feedback/i);
    await user.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      command: 'go to dashboard',
      rating: 4,
      comment: 'Good but could be better',
      confidence: 0.85,
      timestamp: expect.any(Number),
      sessionId: expect.any(String)
    });
  });

  it('requires rating before submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const submitButton = screen.getByText(/submit feedback/i);
    await user.click(submitButton);

    expect(screen.getByText(/please select a rating/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const closeButton = screen.getByLabelText(/close/i);
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when clicking outside', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal with Escape key', async () => {
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('prevents closing when clicking inside modal content', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const modalContent = screen.getByRole('dialog');
    await user.click(modalContent);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('displays command suggestions for low confidence', () => {
    renderWithProviders(
      <VoiceFeedbackModal 
        {...defaultProps} 
        confidence={0.3}
        suggestions={[
          { text: 'go to dashboard', confidence: 0.9 },
          { text: 'show dashboard', confidence: 0.8 }
        ]}
      />
    );

    expect(screen.getByText(/did you mean/i)).toBeInTheDocument();
    expect(screen.getByText('go to dashboard')).toBeInTheDocument();
    expect(screen.getByText('show dashboard')).toBeInTheDocument();
  });

  it('handles suggestion selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VoiceFeedbackModal 
        {...defaultProps} 
        confidence={0.3}
        suggestions={[
          { text: 'go to dashboard', confidence: 0.9 },
          { text: 'show dashboard', confidence: 0.8 }
        ]}
      />
    );

    const suggestionButton = screen.getByText('show dashboard');
    await user.click(suggestionButton);

    // Should update the command field
    expect(screen.getByDisplayValue('show dashboard')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock a slow submission
    const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderWithProviders(
      <VoiceFeedbackModal {...defaultProps} onSubmit={slowSubmit} />
    );

    // Select rating and submit
    const fiveStarButton = screen.getByLabelText(/5 stars/i);
    await user.click(fiveStarButton);

    const submitButton = screen.getByText(/submit feedback/i);
    await user.click(submitButton);

    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles submission errors', async () => {
    const user = userEvent.setup();
    const failingSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    
    renderWithProviders(
      <VoiceFeedbackModal {...defaultProps} onSubmit={failingSubmit} />
    );

    // Select rating and submit
    const fiveStarButton = screen.getByLabelText(/5 stars/i);
    await user.click(fiveStarButton);

    const submitButton = screen.getByText(/submit feedback/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to submit feedback/i)).toBeInTheDocument();
    });
  });

  it('displays feedback categories', () => {
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    expect(screen.getByText(/recognition accuracy/i)).toBeInTheDocument();
    expect(screen.getByText(/response time/i)).toBeInTheDocument();
    expect(screen.getByText(/command understanding/i)).toBeInTheDocument();
    expect(screen.getByText(/user interface/i)).toBeInTheDocument();
  });

  it('handles category selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const categoryCheckbox = screen.getByLabelText(/recognition accuracy/i);
    await user.click(categoryCheckbox);

    expect(categoryCheckbox).toBeChecked();
  });

  it('includes selected categories in submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    // Select rating
    const fiveStarButton = screen.getByLabelText(/5 stars/i);
    await user.click(fiveStarButton);

    // Select categories
    const recognitionCheckbox = screen.getByLabelText(/recognition accuracy/i);
    const responseTimeCheckbox = screen.getByLabelText(/response time/i);
    await user.click(recognitionCheckbox);
    await user.click(responseTimeCheckbox);

    // Submit
    const submitButton = screen.getByText(/submit feedback/i);
    await user.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: ['recognition_accuracy', 'response_time']
      })
    );
  });

  it('maintains focus management for accessibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    // Modal should focus the first interactive element
    const firstButton = screen.getByText(/worked perfectly/i);
    expect(firstButton).toHaveFocus();

    // Tab navigation should work
    await user.tab();
    expect(screen.getByText(/mostly correct/i)).toHaveFocus();
  });

  it('has proper ARIA attributes', () => {
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby');
    expect(modal).toHaveAttribute('aria-describedby');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('handles detailed feedback mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    const detailedModeButton = screen.getByText(/detailed feedback/i);
    await user.click(detailedModeButton);

    expect(screen.getByText(/execution time/i)).toBeInTheDocument();
    expect(screen.getByText(/accuracy rating/i)).toBeInTheDocument();
    expect(screen.getByText(/ease of use/i)).toBeInTheDocument();
  });

  it('validates detailed feedback inputs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceFeedbackModal {...defaultProps} />);

    // Switch to detailed mode
    const detailedModeButton = screen.getByText(/detailed feedback/i);
    await user.click(detailedModeButton);

    // Try to submit without filling required detailed fields
    const submitButton = screen.getByText(/submit feedback/i);
    await user.click(submitButton);

    expect(screen.getByText(/please complete all ratings/i)).toBeInTheDocument();
  });
});