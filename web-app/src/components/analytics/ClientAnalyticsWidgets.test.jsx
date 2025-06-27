import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/i18n';
import ClientAnalyticsWidgets from './ClientAnalyticsWidgets';

// Mock the services
jest.mock('@lib/clientService', () => ({
  getClients: jest.fn(() => Promise.resolve({
    data: [
      { id: 1, full_name: 'Test Client 1', created_at: new Date().toISOString() },
      { id: 2, full_name: 'Test Client 2', created_at: new Date().toISOString() }
    ],
    error: null
  }))
}));

jest.mock('@lib/invoiceAnalyticsService', () => ({
  getClientAnalytics: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      totalClients: 2,
      clientMetrics: {},
      paymentBehavior: {
        excellent: { count: 5, percentage: 50 },
        good: { count: 3, percentage: 30 },
        fair: { count: 1, percentage: 10 },
        poor: { count: 1, percentage: 10 }
      },
      topClients: [
        {
          rank: 1,
          client: { id: 1, full_name: 'Test Client 1' },
          totalRevenue: 5000,
          invoiceCount: 3,
          averagePaymentTime: 15
        }
      ]
    }
  }))
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>
}));

const TestWrapper = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('ClientAnalyticsWidgets', () => {
  const defaultProps = {
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    },
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <ClientAnalyticsWidgets {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/loading client analytics/i)).toBeInTheDocument();
  });

  it('renders client analytics widgets after loading', async () => {
    render(
      <TestWrapper>
        <ClientAnalyticsWidgets {...defaultProps} />
      </TestWrapper>
    );

    // Wait for the component to load
    await screen.findByText(/client overview/i);

    // Check that the main widgets are rendered
    expect(screen.getByText(/client overview/i)).toBeInTheDocument();
    expect(screen.getByText(/business health score/i)).toBeInTheDocument();
    expect(screen.getByText(/top clients/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <ClientAnalyticsWidgets {...defaultProps} />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('test-class');
  });

  it('handles drill-down functionality', async () => {
    const mockOnDrillDown = jest.fn();
    
    render(
      <TestWrapper>
        <ClientAnalyticsWidgets {...defaultProps} onDrillDown={mockOnDrillDown} />
      </TestWrapper>
    );

    // Wait for the component to load
    await screen.findByText(/view all/i);

    // Click on "View All" button for top clients
    const viewAllButton = screen.getByText(/view all/i);
    viewAllButton.click();

    // Check if drill-down was called
    expect(mockOnDrillDown).toHaveBeenCalled();
  });
}); 