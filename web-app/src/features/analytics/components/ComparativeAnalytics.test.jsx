import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import ComparativeAnalytics from './ComparativeAnalytics';

// Mock react-i18next to avoid relying on real i18n instance and options
jest.mock('react-i18next', () => {
  const React = require('react');
  const actual = jest.requireActual('react-i18next');

  const translations = {
    'analytics:charts.comparison': 'Comparison',
    'analytics:charts.comparisonDesc': 'Compare income and expenses across different categories.',
    'analytics:comparison': 'Comparison',
    'analytics:totalRevenue': 'Total Revenue',
    'analytics:totalExpenses': 'Total Expenses',
    'analytics:activeClients': 'Active Clients',
    'analytics:profitMargin': 'Profit Margin',
    'analytics:common.loading': 'Loading...',
    'analytics:common.error': 'Error',
    'analytics:common.noData': 'No data available',
    'analytics:dashboard.currentPeriod': 'Current',
    'analytics:dashboard.previousPeriod': 'Previous Period',
    'analytics:dashboard.compare.previousYear': 'Previous Year',
    'analytics:dashboard.lastMonth': 'Last Month',
    'analytics:dashboard.lastQuarter': 'Last Quarter',
  };

  const t = key => translations[key] || key;

  return {
    ...actual,
    useTranslation: () => ({
      t,
      i18n: {
        changeLanguage: () => Promise.resolve(),
        language: 'en',
        options: { react: { useSuspense: false } },
      },
    }),
    I18nextProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} },
  };
});

// Mock the services
jest.mock('../../financial/services/financialService', () => ({
  __esModule: true,
  default: {
    getFinancialOverview: jest.fn(() =>
      Promise.resolve({
        success: true,
        data: {
          totalRevenue: 50000,
          totalExpenses: 30000,
          profitMargin: 40,
        },
      }),
    ),
  },
}));

jest.mock('../../clients/services/clientService', () => ({
  __esModule: true,
  default: {
    getClientMetrics: jest.fn(() =>
      Promise.resolve({
        success: true,
        data: {
          total: 40,
          active: 35,
        },
      }),
    ),
  },
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid='line-chart'>Line Chart</div>,
  Bar: () => <div data-testid='bar-chart'>Bar Chart</div>,
}));

const TestWrapper = ({ children }) => {
  // Our mocked I18nextProvider ignores props and just returns children
  return <I18nextProvider>{children}</I18nextProvider>;
};

describe('ComparativeAnalytics', () => {
  const defaultProps = {
    currentDateRange: {
      start: '2024-01-01',
      end: '2024-01-31',
    },
    comparisonType: 'yoy',
    className: 'test-class',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders comparative analytics after loading', async () => {
    render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Comparison/i)).toBeInTheDocument();
    });

    // Check that comparative metrics are displayed
    expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Clients/i)).toBeInTheDocument();
    expect(screen.getByText(/Profit Margin/i)).toBeInTheDocument();
  });

  it('applies custom className', async () => {
    const { container } = render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  it('handles different comparison types', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} comparisonType='mom' />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/MOM Analysis/i)).toBeInTheDocument();
    });

    rerender(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} comparisonType='qoq' />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/QOQ Analysis/i)).toBeInTheDocument();
    });
  });

  it('shows period labels correctly', async () => {
    render(
      <TestWrapper>
        <ComparativeAnalytics {...defaultProps} />
      </TestWrapper>,
    );

    // Ensure main content rendered first
    await screen.findByText(/Comparison/i);

    // Then check for period labels
    const currentLabels = screen.getAllByText(/Current/i);
    expect(currentLabels.length).toBeGreaterThan(0);
    expect(screen.getByText(/^vs$/i)).toBeInTheDocument();
  });
});
