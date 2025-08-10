import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackAnalysisTools } from '@/components/voice/FeedbackAnalysisTools';
import voiceFeedbackService from '@/services/voiceFeedbackService';

// Mock the service used by the component
jest.mock('@/services/voiceFeedbackService', () => ({
  __esModule: true,
  default: {
    getFeedback: jest.fn().mockResolvedValue([]),
    getSuggestions: jest.fn().mockResolvedValue([]),
    getAnalytics: jest.fn().mockResolvedValue({
      totalFeedback: 150,
      averageRating: 4.2,
      successRate: 92.5,
      openIssues: 7,
    }),
    resolveFeedback: jest.fn().mockResolvedValue({}),
    updateSuggestionStatus: jest.fn().mockResolvedValue({}),
  },
}));

// Avoid rendering real charts
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
  Pie: () => <div data-testid="pie-chart" />,
  Line: () => <div data-testid="line-chart" />,
  Doughnut: () => <div data-testid="doughnut-chart" />,
}));

describe('FeedbackAnalysisTools (aligned with current component)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header and analytics summary', async () => {
    render(<FeedbackAnalysisTools />);

    // Wait for non-loading UI
    expect(await screen.findByText('Feedback Analysis Tools')).toBeInTheDocument();

    expect(screen.getByText('Total Feedback')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Open Issues')).toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    // Make getAnalytics hang to show loading UI
    voiceFeedbackService.getAnalytics.mockImplementationOnce(() => new Promise(() => {}));

    render(<FeedbackAnalysisTools />);

    expect(screen.getByText('Loading feedback data...')).toBeInTheDocument();
  });

  it('refresh button reloads data', async () => {
    render(<FeedbackAnalysisTools />);
    expect(await screen.findByText('Feedback Analysis Tools')).toBeInTheDocument();
    expect(voiceFeedbackService.getAnalytics).toHaveBeenCalledTimes(1);

    const refresh = screen.getByText('Refresh');
    fireEvent.click(refresh);

    await waitFor(() => expect(voiceFeedbackService.getAnalytics).toHaveBeenCalledTimes(2));
  });

  it('exports data via browser download', async () => {
    const user = userEvent.setup();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    // Provide shims if missing
    // eslint-disable-next-line no-global-assign
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    // eslint-disable-next-line no-global-assign
    URL.revokeObjectURL = jest.fn();

    render(<FeedbackAnalysisTools />);
    expect(await screen.findByText('Feedback Analysis Tools')).toBeInTheDocument();

    const exportBtn = screen.getByText('Export');
    await user.click(exportBtn);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();

    // Restore
    // eslint-disable-next-line no-global-assign
    URL.createObjectURL = originalCreate;
    // eslint-disable-next-line no-global-assign
    URL.revokeObjectURL = originalRevoke;
  });

  it('updates filters and triggers reload', async () => {
    render(<FeedbackAnalysisTools />);
    expect(await screen.findByText('Feedback Analysis Tools')).toBeInTheDocument();

    const typeSelect = await screen.findByDisplayValue('All Types');
    fireEvent.change(typeSelect, { target: { value: 'success' } });

    await waitFor(() => expect(voiceFeedbackService.getAnalytics).toHaveBeenCalledTimes(2));
  });
});


