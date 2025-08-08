import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackAnalysisTools } from '@/components/voice/FeedbackAnalysisTools';

// Mock services
vi.mock('@/services/voiceFeedbackService', () => ({
  default: {
    getFeedback: vi.fn().mockResolvedValue([
      { id: 1, command: 'test command', type: 'success', rating: 5, comments: 'works well', timestamp: new Date().toISOString(), status: 'open' }
    ]),
    getSuggestions: vi.fn().mockResolvedValue([
        { id: 1, command: 'new feature', priority: 'high', status: 'pending', expectedAction: 'do something', votes: 10, timestamp: new Date().toISOString() }
    ]),
    getAnalytics: vi.fn().mockResolvedValue({
      totalFeedback: 100,
      averageRating: 4.5,
      successRate: 95.5,
      openIssues: 5,
    }),
    resolveFeedback: vi.fn().mockResolvedValue({}),
    updateSuggestionStatus: vi.fn().mockResolvedValue({}),
  },
}));

// Mock chart components
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart"></div>,
  Pie: () => <div data-testid="pie-chart"></div>,
}));

describe('FeedbackAnalysisTools', () => {
  const mockAnalyticsData = {
    averageRating: 4.2,
    totalFeedback: 150,
    ratingDistribution: {
      1: 5,
      2: 10,
      3: 25,
      4: 60,
      5: 50
    },
    commonIssues: [
      'Recognition accuracy',
      'Response time',
      'Command understanding'
    ],
    trendData: [
      { date: '2024-01-01', rating: 4.0, count: 10 },
      { date: '2024-01-02', rating: 4.1, count: 12 },
      { date: '2024-01-03', rating: 4.3, count: 15 }
    ],
    categoryBreakdown: {
      navigation: { average: 4.5, count: 50 },
      action: { average: 4.0, count: 40 },
      help: { average: 4.2, count: 30 },
      system: { average: 3.8, count: 30 }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    voiceFeedbackService.getFeedbackAnalytics.mockResolvedValue({
      success: true,
      data: mockAnalyticsData
    });
  });

  it('renders analysis tools correctly', async () => {
    render(<FeedbackAnalysisTools />);

    expect(screen.getByText(/feedback analysis/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/average rating/i)).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('displays rating distribution chart', async () => {
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    const chartData = screen.getByTestId('chart-data');
    const data = JSON.parse(chartData.textContent);
    
    expect(data.labels).toEqual(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars']);
    expect(data.datasets[0].data).toEqual([5, 10, 25, 60, 50]);
  });

  it('shows feedback trends over time', async () => {
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    const chartData = screen.getByTestId('chart-data');
    const data = JSON.parse(chartData.textContent);
    
    expect(data.datasets[0].data).toEqual([4.0, 4.1, 4.3]);
  });

  it('displays common issues list', async () => {
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByText('Recognition accuracy')).toBeInTheDocument();
      expect(screen.getByText('Response time')).toBeInTheDocument();
      expect(screen.getByText('Command understanding')).toBeInTheDocument();
    });
  });

  it('shows category breakdown', async () => {
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByText(/navigation/i)).toBeInTheDocument();
      expect(screen.getByText(/action/i)).toBeInTheDocument();
      expect(screen.getByText(/help/i)).toBeInTheDocument();
      expect(screen.getByText(/system/i)).toBeInTheDocument();
    });
  });

  it('handles date range filtering', async () => {
    const user = userEvent.setup();
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      return Promise.all([
        user.type(startDateInput, '2024-01-01'),
        user.type(endDateInput, '2024-01-31')
      ]);
    });

    const applyButton = screen.getByText(/apply filter/i);
    await user.click(applyButton);

    expect(voiceFeedbackService.getFeedbackAnalytics).toHaveBeenCalledWith({
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
  });

  it('exports analysis data', async () => {
    const user = userEvent.setup();
    voiceFeedbackService.exportFeedback.mockResolvedValue({
      success: true,
      data: new Blob(['analysis data'], { type: 'text/csv' })
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      const exportButton = screen.getByText(/export data/i);
      return user.click(exportButton);
    });

    expect(voiceFeedbackService.exportFeedback).toHaveBeenCalledWith('csv');
  });

  it('handles loading state', () => {
    voiceFeedbackService.getFeedbackAnalytics.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<FeedbackAnalysisTools />);

    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    voiceFeedbackService.getFeedbackAnalytics.mockRejectedValue(
      new Error('Failed to load analytics')
    );

    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      const refreshButton = screen.getByLabelText(/refresh data/i);
      return user.click(refreshButton);
    });

    expect(voiceFeedbackService.getFeedbackAnalytics).toHaveBeenCalledTimes(2);
  });

  it('toggles between different chart views', async () => {
    const user = userEvent.setup();
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    const chartTypeSelect = screen.getByLabelText(/chart type/i);
    await user.selectOptions(chartTypeSelect, 'doughnut');

    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('filters data by rating range', async () => {
    const user = userEvent.setup();
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      const minRatingInput = screen.getByLabelText(/minimum rating/i);
      const maxRatingInput = screen.getByLabelText(/maximum rating/i);
      
      return Promise.all([
        user.clear(minRatingInput),
        user.type(minRatingInput, '3'),
        user.clear(maxRatingInput),
        user.type(maxRatingInput, '5')
      ]);
    });

    const applyButton = screen.getByText(/apply filter/i);
    await user.click(applyButton);

    expect(voiceFeedbackService.getFeedbackAnalytics).toHaveBeenCalledWith({
      minRating: 3,
      maxRating: 5
    });
  });

  it('shows detailed statistics', async () => {
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByText(/total feedback/i)).toBeInTheDocument();
      expect(screen.getByText(/average rating/i)).toBeInTheDocument();
      expect(screen.getByText(/response rate/i)).toBeInTheDocument();
      expect(screen.getByText(/satisfaction score/i)).toBeInTheDocument();
    });
  });

  it('displays improvement suggestions', async () => {
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByText(/improvement suggestions/i)).toBeInTheDocument();
      expect(screen.getByText(/focus on recognition accuracy/i)).toBeInTheDocument();
      expect(screen.getByText(/optimize response time/i)).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    voiceFeedbackService.getFeedbackAnalytics.mockResolvedValue({
      success: true,
      data: {
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: {},
        commonIssues: [],
        trendData: [],
        categoryBreakdown: {}
      }
    });

    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      expect(screen.getByText(/no feedback data available/i)).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<FeedbackAnalysisTools />);

    let firstButton;
    await waitFor(() => {
      firstButton = screen.getByText(/apply filter/i);
      expect(firstButton).toBeInTheDocument();
    });

    firstButton.focus();
    await waitFor(() => expect(firstButton).toHaveFocus());

    await user.tab();

    const refreshButton = screen.getByLabelText(/refresh data/i);
    expect(refreshButton).toHaveFocus();
  });

  it('has proper ARIA attributes', async () => {
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      const chartContainer = screen.getByRole('region', { name: /rating distribution/i });
      expect(chartContainer).toBeInTheDocument();
      
      const statisticsSection = screen.getByRole('region', { name: /statistics/i });
      expect(statisticsSection).toBeInTheDocument();
    });
  });

  it('handles real-time updates', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup();
    render(<FeedbackAnalysisTools />);

    // Initial fetch
    await waitFor(() => {
      expect(voiceFeedbackService.getFeedbackAnalytics).toHaveBeenCalledTimes(1);
    });

    // Enable real-time updates
    const realtimeToggle = screen.getByLabelText(/real-time updates/i);
    await user.click(realtimeToggle);

    // Advance timers to trigger polling
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(voiceFeedbackService.getFeedbackAnalytics).toHaveBeenCalledTimes(2);
    });

    // Disable real-time updates and check if polling stops
    await user.click(realtimeToggle);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // No new calls should be made
    expect(voiceFeedbackService.getFeedbackAnalytics).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('compares data across time periods', async () => {
    const user = userEvent.setup();
    render(<FeedbackAnalysisTools />);

    await waitFor(() => {
      const compareToggle = screen.getByLabelText(/compare periods/i);
      return user.click(compareToggle);
    });

    expect(screen.getByText(/previous period/i)).toBeInTheDocument();
    expect(screen.getByText(/current period/i)).toBeInTheDocument();
    expect(screen.getByText(/change/i)).toBeInTheDocument();
  });

  test('generates insights from data', async () => {
    render(<FeedbackAnalysisTools />);
    
    // Check for insights section
    expect(await screen.findByText('Insights')).toBeInTheDocument();

    // Check for specific insights (based on the component's static content for now)
    expect(await screen.findByText(/Rating trend is positive/i)).toBeInTheDocument();
    expect(await screen.findByText(/Navigation commands perform best/i)).toBeInTheDocument();
    expect(await screen.findByText(/Recognition accuracy needs improvement/i)).toBeInTheDocument();
  });
});
