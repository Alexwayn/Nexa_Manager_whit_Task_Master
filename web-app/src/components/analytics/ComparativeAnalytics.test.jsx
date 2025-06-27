import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/i18n';
import ComparativeAnalytics from './ComparativeAnalytics';

// Mock the services
jest.mock('@lib/financialService', () => ({
  getFinancialOverview: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      totalRevenue: 50000,
      totalExpenses: 30000,
      profitMargin: 40
    }
  }))
}));

jest.mock('@lib/clientService', () => ({
  getClientMetrics: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      total: 40,
      active: 35
    }
  }))
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>
}));

const TestWrapper = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('ComparativeAnalytics', () => {
  const defaultProps = {
    currentDateRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    comparisonType: 'yoy',
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders comparative analytics after loading', async () => {
    render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/comparison/i)).toBeInTheDocument();
    });

    // Check that comparative metrics are displayed
    expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/total expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/active clients/i)).toBeInTheDocument();
    expect(screen.getByText(/profit margin/i)).toBeInTheDocument();
  });

  it('applies custom className', async () => {
    const { container } = render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  it('handles different comparison types', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} comparisonType="mom" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/MOM Analysis/i)).toBeInTheDocument();
    });

    rerender(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} comparisonType="qoq" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/QOQ Analysis/i)).toBeInTheDocument();
    });
  });

  it('shows period labels correctly', async () => {
    render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/current/i)).toBeInTheDocument();
      expect(screen.getByText(/vs/i)).toBeInTheDocument();
    });
  });
}); 