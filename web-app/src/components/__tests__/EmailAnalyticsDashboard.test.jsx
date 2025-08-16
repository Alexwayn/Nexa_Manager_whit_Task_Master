import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmailAnalyticsDashboard from '@components/EmailAnalyticsDashboard';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock dependencies
jest.mock('@features/email', () => ({
  emailAnalyticsService: {
    getDashboardAnalytics: jest.fn(),
    getEmailStats: jest.fn(),
    getActivityMetrics: jest.fn(),
    getClientCommunicationMetrics: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    getRealTimeMetrics: jest.fn(),
    generateEmailReport: jest.fn(),
  },
}));

jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
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

jest.mock('@shared/components', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Badge: ({ children }) => <span data-testid="badge">{children}</span>,
  Tabs: ({ children }) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, onClick, value }) => <button onClick={onClick} data-value={value}>{children}</button>,
  Select: ({ children, onValueChange }) => <div data-testid="select" onClick={() => onValueChange && onValueChange('json')}>{children}</div>,
  SelectContent: ({ children }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, onClick }) => <div data-testid="select-item" onClick={onClick} data-value={value}>{children}</div>,
  SelectTrigger: ({ children }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
  DatePickerWithRange: ({ onDateChange }) => (
    <div data-testid="date-picker">
      <button onClick={() => onDateChange({ from: new Date('2024-01-01'), to: new Date('2024-01-31') })}>
        Select Date Range
      </button>
    </div>
  ),
}));

jest.mock('@shared/hooks', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@shared/utils/formatters', () => ({
  formatNumber: (num) => num?.toLocaleString() || '0',
  formatPercentage: (num) => num?.toFixed(1) || '0.0',
  formatDate: (date) => date?.toISOString?.()?.split('T')[0] || '2024-01-01',
}));

jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Inbox: () => <div data-testid="inbox-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Users: () => <div data-testid="users-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  MousePointer: () => <div data-testid="mouse-pointer-icon" />,
  Reply: () => <div data-testid="reply-icon" />,
  Download: () => <div data-testid="download-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  BarChart3: () => <div data-testid="bar-chart3-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
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

const renderWithRouter = async (component) => {
  let utils;
  await act(async () => {
    utils = render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  });
  return utils;
};

const { emailAnalyticsService } = jest.requireMock('@features/email');

const mockDashboardData = {
  overview: {
    totalEmails: 1250,
    sentEmails: 850,
    receivedEmails: 400,
    unreadEmails: 45,
    deliveryRate: 98.5,
    openRate: 24.3,
    clickRate: 3.7,
    responseRate: 12.1,
    businessEmails: 10,
    invoiceEmails: 5,
    quoteEmails: 3,
    reminderEmails: 2,
    growthMetrics: { emailGrowth: 5 },
  },
  activity: {
    dailyTrends: [
      { date: '2024-01-01', sent: 10, received: 5 },
      { date: '2024-01-02', sent: 15, received: 8 },
    ],
    hourlyDistribution: [
      { hour: 9, count: 25 },
      { hour: 10, count: 35 },
    ],
  },
  clients: {
    topClients: [
      { name: 'Client A', emailCount: 45 },
      { name: 'Client B', emailCount: 32 },
    ],
    responseRates: [],
  },
  performance: {
    templates: [
      { name: 'Invoice Template', uses: 120, openRate: 85 },
      { name: 'Quote Template', uses: 95, openRate: 78 },
    ],
    responseTimes: { average: 12, fastest: 5, slowest: 1 },
  },
  realTime: {
    last24Hours: { emailsSent: 5, opens: 15, clicks: 8 },
    queue: { pending: 0 },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default fetch mock for dashboard analytics endpoint
  global.fetch.mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('/api/email/analytics/dashboard')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDashboardData) });
    }
    if (typeof url === 'string' && url.includes('/api/email/analytics/reports')) {
      // default report response JSON
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
});

describe('EmailAnalyticsDashboard', () => {
  it('should render the dashboard with all sections', async () => {
    await renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive insights into your email performance')).toBeInTheDocument();
    });

    // Wait for Real-time Activity to render
    await waitFor(() => {
      expect(screen.getByText('Real-time Activity')).toBeInTheDocument();
    });

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Daily Email Activity')).toBeInTheDocument();
    expect(screen.getByText('Hourly Distribution')).toBeInTheDocument();
    expect(screen.getByText('Top Clients by Email Volume')).toBeInTheDocument();
    
    // Click on performance tab to check Template Performance
    fireEvent.click(screen.getByText('Performance'));
    await waitFor(() => {
      expect(screen.getByText('Template Performance')).toBeInTheDocument();
    });
  });

  it('should display overview metrics correctly', async () => {
    await renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      // Robust check: find a <p> whose numeric text equals 1250 (ignoring separators)
      const totalEl = screen.getByText((content, node) => {
        const el = node;
        if (!el || el.tagName?.toLowerCase() !== 'p') return false;
        const digits = el.textContent?.replace(/\D/g, '');
        return digits === '1250';
      });
      expect(totalEl).toBeInTheDocument();
      expect(screen.getByText('850')).toBeInTheDocument();
      expect(screen.getByText('400')).toBeInTheDocument();
    });
  });

  it('should render charts correctly', async () => {
    await renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getAllByTestId('area-chart')).toHaveLength(1); // Daily trends in activity tab
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(3); // Overview performance + Hourly distribution + Client response rates
      expect(screen.getAllByTestId('pie-chart')).toHaveLength(1); // Email types
      expect(screen.queryAllByTestId('line-chart')).toHaveLength(0);
    });
  });

  it('should handle date range changes', async () => {
    await renderWithRouter(<EmailAnalyticsDashboard />);

    const selectButton = screen.getByText('Select Date Range');

    await act(async () => {
      fireEvent.click(selectButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/email/analytics/dashboard?'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    await renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      // Two calls: initial load + refresh
      const calls = global.fetch.mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/api/email/analytics/dashboard'));
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should generate reports in different formats', async () => {
    await renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics')).toBeInTheDocument();
    });

    const exportTrigger = screen.getByText('Export');
    fireEvent.mouseDown(exportTrigger);

    const jsonItem = await screen.findByText('JSON Report');
    fireEvent.click(jsonItem);

    await waitFor(() => {
      const calls = global.fetch.mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/api/email/analytics/reports'));
      expect(calls.length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.mouseDown(exportTrigger);
    const csvItem = await screen.findByText('CSV Export');

    // Mock text for CSV response
    global.fetch.mockImplementationOnce((url) =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('a,b,c') })
    );

    fireEvent.click(csvItem);

    await waitFor(() => {
      const calls = global.fetch.mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/api/email/analytics/reports'));
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should handle loading states', async () => {
    // Make dashboard call never resolve
    global.fetch.mockImplementationOnce((url) =>
      url.includes('/api/email/analytics/dashboard')
        ? new Promise(() => {})
        : Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    await renderWithRouter(<EmailAnalyticsDashboard />);

    // Shows spinner (no explicit text label)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should handle error states', async () => {
    global.fetch.mockImplementationOnce((url) =>
      url.includes('/api/email/analytics/dashboard')
        ? Promise.resolve({ ok: false, status: 500 })
        : Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    await renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      // Toast shows error; component logs as well
      // We can assert that the Retry UI shows due to no analytics data
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should display real-time metrics when available', async () => {
    await renderWithRouter(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Real-time Activity')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });
});
