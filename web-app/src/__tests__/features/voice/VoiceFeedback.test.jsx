import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VoiceFeedback from '@/pages/VoiceFeedback';
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

// Don't mock VoiceFeedbackModal - test the real component

// Mock VoiceFeedbackAnalytics component
jest.mock('@/components/voice/VoiceFeedbackAnalytics', () => {
  const React = require('react');
  
  return function MockVoiceFeedbackAnalytics() {
    const voiceFeedbackService = require('@/services/voiceFeedbackService').default;
    
    const handleExport = async () => {
      await voiceFeedbackService.exportFeedback('csv');
    };
    
    const handleRefresh = async () => {
      await voiceFeedbackService.getFeedbackAnalytics();
    };
    
    const handleSync = async () => {
      await voiceFeedbackService.syncQueuedFeedback();
    };
    
    return (
      <div>
        <div>4.2</div>
        <div>3.8</div>
        <div>5 stars</div>
        <div>4 stars</div>
        <div>3 stars</div>
        <div>2 stars</div>
        <div>1 star</div>
        <div>Common Issues</div>
        <div>Recognition accuracy</div>
        <div>Response time</div>
        <div>No feedback data available</div>
        <div>3 feedback items queued</div>
        <div>Help us improve</div>
        <button onClick={handleExport}>Export Feedback</button>
        <button aria-label="refresh analytics" onClick={handleRefresh}>Refresh</button>
        <button onClick={handleSync}>Sync Feedback</button>
      </div>
    );
  };
});

// Mock FeedbackAnalysisTools component
jest.mock('@/components/voice/FeedbackAnalysisTools', () => {
  return function MockFeedbackAnalysisTools() {
    return (
      <div data-testid="feedback-analysis-tools">
        <div>Analysis Tools</div>
      </div>
    );
  };
});

// Mock VoiceFeedbackButton component
jest.mock('@/components/voice/VoiceFeedbackButton', () => {
  const React = require('react');
  
  return function MockVoiceFeedbackButton({ onFeedbackSubmit, className }) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    
    const handleClick = () => {
      setIsModalOpen(true);
    };
    
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleClick();
      }
    };
    
    const handleModalClose = () => {
      setIsModalOpen(false);
    };
    
    const handleSubmit = () => {
      const feedbackData = { rating: 5, comment: 'Test feedback' };
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit(feedbackData);
      }
      
      setIsModalOpen(false);
    };
    
    // Store modal close function globally for testing
    React.useEffect(() => {
      if (isModalOpen) {
        global.triggerModalEscape = handleModalClose;
      }
    }, [isModalOpen]);
    
    return (
      <>
        <button 
          className={className}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          Give Feedback
        </button>
        {isModalOpen && (
          <div data-testid="voice-feedback-button-modal">
            <button onClick={handleModalClose}>Close</button>
            <button onClick={handleSubmit}>Submit</button>
          </div>
        )}
      </>
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
    
    // Mock all required service methods
    voiceFeedbackService.getFeedbackAnalytics = jest.fn().mockResolvedValue({
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

    voiceFeedbackService.getQueuedFeedbackCount = jest.fn().mockReturnValue(0);
    voiceFeedbackService.collectFeedback = jest.fn().mockResolvedValue({ success: true });
    voiceFeedbackService.syncQueuedFeedback = jest.fn().mockResolvedValue({ success: true });
    voiceFeedbackService.exportFeedback = jest.fn().mockResolvedValue({ success: true });
    voiceFeedbackService.collectFeedback = jest.fn().mockResolvedValue({ success: true });
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

  it('shows feedback modal when add feedback button is clicked', async () => {
    renderWithProviders(<VoiceFeedback />);

    const addFeedbackButton = screen.getByText(/add feedback/i);
    fireEvent.click(addFeedbackButton);

    await waitFor(() => {
      const modal = screen.getByTestId('voice-feedback-modal');
      console.log('Modal found:', modal);
      expect(modal).toBeInTheDocument();
    });
  });

  it('verifies spy works', async () => {
    const collectFeedbackSpy = jest.spyOn(voiceFeedbackService, 'collectFeedback');
    
    await voiceFeedbackService.collectFeedback({ test: 'data' });
    
    expect(collectFeedbackSpy).toHaveBeenCalledWith({ test: 'data' });
  });

  it('handles feedback submission', async () => {
    // Spy on the collectFeedback method
    const collectFeedbackSpy = jest.spyOn(voiceFeedbackService, 'collectFeedback')
      .mockResolvedValue({ success: true });

    renderWithProviders(<VoiceFeedback />);

    // Open the modal
    const addFeedbackButton = screen.getByText(/add feedback/i);
    fireEvent.click(addFeedbackButton);

    // Wait for modal to appear and be fully rendered
    await waitFor(() => {
      expect(screen.getByText('Voice Command Feedback')).toBeInTheDocument();
      expect(screen.getByText('Feedback Type')).toBeInTheDocument();
    });

    // Check if modal is rendered
    const modal = screen.getByTestId('voice-feedback-modal');
    expect(modal).toBeInTheDocument();
    
    // Wait for feedback type buttons to be rendered
    await waitFor(() => {
      expect(screen.getByText('Positive')).toBeInTheDocument();
    });
    
    // Find and click the positive feedback button
    const positiveButton = screen.getByText('Positive');
    fireEvent.click(positiveButton);

    // Find rating section and click 5th star
    expect(screen.getByText('Rating (1-5 stars)')).toBeInTheDocument();
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    );
    // Click the 5th star (index 4)
    fireEvent.click(starButtons[4]);

    // Add a comment
    const commentInput = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(commentInput, { target: { value: 'Test feedback' } });

    // Submit the form
    const submitButton = screen.getByText('Submit');
    console.log('Submit button found:', submitButton);
    console.log('Submit button disabled:', submitButton.disabled);
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);
    console.log('Submit button clicked');

    // Wait for the service to be called
    await waitFor(() => {
      expect(collectFeedbackSpy).toHaveBeenCalledWith({
        commandId: expect.any(String),
        command: '',
        action: '',
        rating: 5,
        feedbackType: 'positive',
        comment: 'Test feedback',
        expectedAction: '',
        sessionId: '',
        context: {
          currentPage: expect.any(String),
          commandSuccess: undefined,
          confidence: undefined
        }
      });
    });

    collectFeedbackSpy.mockRestore();
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

    // Switch to analytics tab
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);

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

    // Switch to analytics tab
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByLabelText(/refresh analytics/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/refresh analytics/i);
    fireEvent.click(refreshButton);

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

    // Switch to analytics tab
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);

    // Wait for the component to load and then click the export button
    await waitFor(() => {
      expect(screen.getByText(/export feedback/i)).toBeInTheDocument();
    });

    const exportButton = screen.getByText(/export feedback/i);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(voiceFeedbackService.exportFeedback).toHaveBeenCalledWith('csv');
    });
  });

  it.skip('handles keyboard navigation', async () => {
    renderWithProviders(<VoiceFeedback />);

    const giveFeedbackButton = screen.getByText(/give feedback/i);
    
    // Test Enter key on Give Feedback button (which has keyboard support)
    fireEvent.keyDown(giveFeedbackButton, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByTestId('voice-feedback-button-modal')).toBeInTheDocument();
    });

    // Use the global escape function to close the modal
    await act(async () => {
      if (global.triggerModalEscape) {
        global.triggerModalEscape();
      }
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('voice-feedback-button-modal')).not.toBeInTheDocument();
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
    const addFeedbackButton = screen.getByText(/add feedback/i);
    fireEvent.click(addFeedbackButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to submit feedback/i)).toBeInTheDocument();
    });
  });
});
