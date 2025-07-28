import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedback from '@/features/voice/pages/VoiceFeedback';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';
import voiceFeedbackService from '@/services/voiceFeedbackService';

// Mock services
jest.mock('@/services/voiceFeedbackService');
jest.mock('@/services/voiceAnalyticsService');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock components that might not be available
jest.mock('@/features/voice/components/VoiceFeedbackModal', () => {
  return function MockVoiceFeedbackModal({ isOpen, onClose, onSubmit }) {
    if (!isOpen) return null;
    return (
      <div data-testid="voice-feedback-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ rating: 5, comment: 'Test feedback' })}>
          Submit
        </button>
      </div>
    );
  };
});

jest.mock('@/features/voice/components/FeedbackAnalysisTools', () => {
  return function MockFeedbackAnalysisTools() {
    return <div data-testid="feedback-analysis-tools">Analysis Tools</div>;
  };
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('VoiceFeedback Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    voiceFeedbackService.getFeedbackAnalytics.mockResolvedValue({
      success: true,
      data: {
        averageRating: 4.2,
        totalFeedback: 150,
        ratingDistribution: {
          1: 5,
          2: 10,
          3: 25,
          4: 60,
          5: 50
        },
        commonIssues: ['Recognition accuracy', 'Response time']
      }
    });

    voiceFeedbackService.getQueuedFeedbackCount.mockReturnValue(0);
  });

  it('renders voice feedback page correctly', async () => {
    renderWithProviders(<VoiceFeedback />);

    expect(screen.getByText(/voice feedback/i)).toBeInTheDocument();
    expect(screen.getByText(/help us improve/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/average rating/i)).toBeInTheDocument();
    });
  });

  it('displays feedback analytics', async () => {
    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Average rating
      expect(screen.getByText('150')).toBeInTheDocument(); // Total feedback
    });
  });

  it('shows feedback modal when give feedback button is clicked', async () => {
    renderWithProviders(<VoiceFeedback />);

    const giveFeedbackButton = screen.getByText(/give feedback/i);
    fireEvent.click(giveFeedbackButton);

    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
    });
  });

  it('handles feedback submission', async () => {
    voiceFeedbackService.submitFeedback.mockResolvedValue({
      success: true,
      data: { id: 'feedback-123' }
    });

    renderWithProviders(<VoiceFeedback />);

    // Open modal
    const giveFeedbackButton = screen.getByText(/give feedback/i);
    fireEvent.click(giveFeedbackButton);

    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
    });

    // Submit feedback
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(voiceFeedbackService.submitFeedback).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Test feedback'
      });
    });
  });

  it('displays error message when analytics loading fails', async () => {
    voiceFeedbackService.getFeedbackAnalytics.mockRejectedValue(
      new Error('Failed to load analytics')
    );

    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument();
    });
  });

  it('shows queued feedback count when offline', async () => {
    voiceFeedbackService.getQueuedFeedbackCount.mockReturnValue(3);

    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      expect(screen.getByText(/3 feedback items queued/i)).toBeInTheDocument();
    });
  });

  it('handles sync queued feedback', async () => {
    voiceFeedbackService.getQueuedFeedbackCount.mockReturnValue(2);
    voiceFeedbackService.syncQueuedFeedback.mockResolvedValue({
      success: true,
      synced: 2,
      failed: 0
    });

    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      const syncButton = screen.getByText(/sync feedback/i);
      fireEvent.click(syncButton);
    });

    await waitFor(() => {
      expect(voiceFeedbackService.syncQueuedFeedback).toHaveBeenCalled();
    });
  });

  it('displays feedback analysis tools', async () => {
    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      expect(screen.getByTestId('feedback-analysis-tools')).toBeInTheDocument();
    });
  });

  it('handles navigation back to dashboard', () => {
    renderWithProviders(<VoiceFeedback />);

    const backButton = screen.getByLabelText(/back to dashboard/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('displays rating distribution chart', async () => {
    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      // Check for rating distribution elements
      expect(screen.getByText('5 stars')).toBeInTheDocument();
      expect(screen.getByText('4 stars')).toBeInTheDocument();
      expect(screen.getByText('3 stars')).toBeInTheDocument();
      expect(screen.getByText('2 stars')).toBeInTheDocument();
      expect(screen.getByText('1 star')).toBeInTheDocument();
    });
  });

  it('shows common issues section', async () => {
    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      expect(screen.getByText(/common issues/i)).toBeInTheDocument();
      expect(screen.getByText('Recognition accuracy')).toBeInTheDocument();
      expect(screen.getByText('Response time')).toBeInTheDocument();
    });
  });

  it('handles empty analytics data gracefully', async () => {
    voiceFeedbackService.getFeedbackAnalytics.mockResolvedValue({
      success: true,
      data: {
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: {},
        commonIssues: []
      }
    });

    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      expect(screen.getByText(/no feedback data available/i)).toBeInTheDocument();
    });
  });

  it('refreshes analytics data', async () => {
    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      const refreshButton = screen.getByLabelText(/refresh analytics/i);
      fireEvent.click(refreshButton);
    });

    expect(voiceFeedbackService.getFeedbackAnalytics).toHaveBeenCalledTimes(2);
  });

  it('exports feedback data', async () => {
    voiceFeedbackService.exportFeedback.mockResolvedValue({
      success: true,
      data: new Blob(['feedback data'], { type: 'text/csv' })
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    renderWithProviders(<VoiceFeedback />);

    await waitFor(() => {
      const exportButton = screen.getByText(/export feedback/i);
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(voiceFeedbackService.exportFeedback).toHaveBeenCalledWith('csv');
    });
  });

  it('handles keyboard navigation', async () => {
    renderWithProviders(<VoiceFeedback />);

    const giveFeedbackButton = screen.getByText(/give feedback/i);
    
    // Test Enter key
    fireEvent.keyDown(giveFeedbackButton, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-modal')).toBeInTheDocument();
    });

    // Close modal with Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByTestId('voice-feedback-modal')).not.toBeInTheDocument();
    });
  });

  it('displays loading state while fetching analytics', () => {
    // Make the promise never resolve to test loading state
    voiceFeedbackService.getFeedbackAnalytics.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<VoiceFeedback />);

    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
  });

  it('handles feedback submission errors', async () => {
    voiceFeedbackService.submitFeedback.mockRejectedValue(
      new Error('Submission failed')
    );

    renderWithProviders(<VoiceFeedback />);

    // Open modal and submit
    const giveFeedbackButton = screen.getByText(/give feedback/i);
    fireEvent.click(giveFeedbackButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to submit feedback/i)).toBeInTheDocument();
    });
  });
});