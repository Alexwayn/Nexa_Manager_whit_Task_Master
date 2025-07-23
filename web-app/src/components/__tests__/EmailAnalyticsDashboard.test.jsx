import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmailAnalyticsDashboard from '@components/EmailAnalyticsDashboard';
import emailManagementService from '@lib/emailManagementService';

// Mock dependencies
vi.mock('@lib/emailManagementService', () => ({
  default: {
    getEmailAnalytics: vi.fn(),
    getEmailPerformanceMetrics: vi.fn(),
    getClientCommunicationAnalytics: vi.fn(),
    getEmailActivityMetrics: vi.fn(),
    generateEmailReport: vi.fn(),
    getRealTimeEmailMetrics: vi.fn(),
  },
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Cell: () => <div data-testid="cell" />,
  Area: () => <div data-testid="area" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

vi.mock('@components/ui/date-picker', () => ({
  default: ({ onDateChange, value }) => (
    <div data-testid="date-picker">
      <button onClick={() => onDateChange({ from: new Date('2024-01-01'), to: new Date('2024-01-31') })}>
        Select Date Range
      </button>
    </div>
  ),
}));

const mockAnalyticsData = {
  success: true,
  data: {
    overview: {
      totalEmails: 1250,
      sentEmails: 850,
      receivedEmails: 400,
      unreadEmails: 45,
      starredEmails: 23,
      deliveryRate: 98.5,
      openRate: 24.3,
      clickRate: 3.7,
      responseRate: 12.1,
    },
    activity: {
      timeline: [
        { date: '2024-01-01', sent: 10, received: 5, opened: 8 },
        { date: '2024-01-02', sent: 15, received: 8, opened: 12 },
      ],
      hourlyDistribution: [
        { hour: 9, count: 25 },
        { hour: 10, count: 35 },
      ],
    },
    clients: {
      topClients: [
        { name: 'Client A', emailCount: 45, responseRate: 85 },
        { name: 'Client B', emailCount: 32, responseRate: 72 },
      ],
    },
    performance: {
      templates: [
        { name: 'Invoice Template', usage: 120, effectiveness: 85 },
        { name: 'Quote Template', usage: 95, effectiveness: 78 },
      ],
    },
    realTime: {
      last24Hours: { opens: 15, clicks: 8 },
      recentActivity: [],
    },
  },
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('EmailAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailManagementService.getEmailAnalytics.mockResolvedValue(mockAnalyticsData);
    emailManagementService.getEmailPerformanceMetrics.mockResolvedValue({
      success: true,
      data: mockAnalyticsData.data.performance,
    });
    emailManagementService.getClientCommunicationAnalytics.mockResolvedValue({
      success: true,
      data: mockAnalyticsData.data.clients,
    });
    emailManagementService.getEmailActivityMetrics.mockResolvedValue({
      success: true,
      data: mockAnalyticsData.data.activity,
    });
    emailManagementService.getRealTimeEmailMetrics.mockResolvedValue({
      success: true,
      data: mockAnalyticsData.data.realTime,
    });
  });

  it('should render the dashboard with all sections', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics Dashboard')).toBeInTheDocument();
    });

    // Check for main sections
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Email Activity Timeline')).toBeInTheDocument();
    expect(screen.getByText('Hourly Distribution')).toBeInTheDocument();
    expect(screen.getByText('Top Clients')).toBeInTheDocument();
    expect(screen.getByText('Template Performance')).toBeInTheDocument();
  });

  it('should display overview metrics correctly', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Total emails
      expect(screen.getByText('850')).toBeInTheDocument(); // Sent emails
      expect(screen.getByText('400')).toBeInTheDocument(); // Received emails
      expect(screen.getByText('98.5%')).toBeInTheDocument(); // Delivery rate
    });
  });

  it('should render charts correctly', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getAllByTestId('line-chart')).toHaveLength(1);
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
      expect(screen.getAllByTestId('pie-chart')).toHaveLength(1);
    });
  });

  it('should handle date range changes', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    const datePicker = screen.getByTestId('date-picker');
    const selectButton = screen.getByText('Select Date Range');
    
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(emailManagementService.getEmailAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: expect.any(String),
          dateTo: expect.any(String),
        })
      );
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics Dashboard')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(emailManagementService.getEmailAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it('should generate reports in different formats', async () => {
    emailManagementService.generateEmailReport.mockResolvedValue({
      success: true,
      data: { reportData: 'mock report' },
    });

    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics Dashboard')).toBeInTheDocument();
    });

    // Test JSON export
    const jsonButton = screen.getByText('Export JSON');
    fireEvent.click(jsonButton);

    await waitFor(() => {
      expect(emailManagementService.generateEmailReport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'json',
        })
      );
    });

    // Test CSV export
    const csvButton = screen.getByText('Export CSV');
    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(emailManagementService.generateEmailReport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'csv',
        })
      );
    });
  });

  it('should handle loading states', () => {
    emailManagementService.getEmailAnalytics.mockReturnValue(new Promise(() => {})); // Never resolves

    renderWithRouter(<EmailAnalyticsDashboard />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should handle error states', async () => {
    emailManagementService.getEmailAnalytics.mockResolvedValue({
      success: false,
      error: 'Failed to load analytics',
    });

    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading analytics: Failed to load analytics')).toBeInTheDocument();
    });
  });

  it('should display real-time metrics when available', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Real-time Activity')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // Opens in last 24h
      expect(screen.getByText('8')).toBeInTheDocument(); // Clicks in last 24h
    });
  });

  it('should toggle between different time periods', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics Dashboard')).toBeInTheDocument();
    });

    // Test period buttons
    const weekButton = screen.getByText('7 Days');
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(emailManagementService.getEmailAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: expect.any(String),
          dateTo: expect.any(String),
        })
      );
    });

    const monthButton = screen.getByText('30 Days');
    fireEvent.click(monthButton);

    await waitFor(() => {
      expect(emailManagementService.getEmailAnalytics).toHaveBeenCalledTimes(3); // Initial + week + month
    });
  });

  it('should display client communication metrics', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
      expect(screen.getByText('Client B')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // Response rate
    });
  });

  it('should display template performance metrics', async () => {
    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Invoice Template')).toBeInTheDocument();
      expect(screen.getByText('Quote Template')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument(); // Usage count
    });
  });

  it('should handle empty data gracefully', async () => {
    emailManagementService.getEmailAnalytics.mockResolvedValue({
      success: true,
      data: {
        overview: { totalEmails: 0 },
        activity: { timeline: [], hourlyDistribution: [] },
        clients: { topClients: [] },
        performance: { templates: [] },
        realTime: null,
      },
    });

    renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No data available for the selected period')).toBeInTheDocument();
    });
  });
});