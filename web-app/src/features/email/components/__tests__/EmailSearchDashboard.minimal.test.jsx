import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock all dependencies first
jest.mock('@/features/email/hooks/useEmailSearch', () => ({
  useEmailSearch: jest.fn(() => ({
    searchResults: [],
    totalResults: 0,
    currentPage: 1,
    pageSize: 20,
    isSearching: false,
    searchError: null,
    searchHistory: [],
    savedSearches: [],
    searchStats: null,
    handlePageChange: jest.fn(),
    clearSearch: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useEmails', () => ({
  useEmails: jest.fn(() => ({
    selectedEmails: [],
    handleEmailSelect: jest.fn(),
    handleEmailAction: jest.fn(),
    bulkEmailAction: jest.fn(),
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('@/utils/cn', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

jest.mock('@shared/utils/cn', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

jest.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <div data-testid="magnifying-glass-icon" />,
  FunnelIcon: () => <div data-testid="funnel-icon" />,
  BookmarkIcon: () => <div data-testid="bookmark-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  ChartBarIcon: () => <div data-testid="chart-bar-icon" />,
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  InboxIcon: () => <div data-testid="inbox-icon" />,
}));

jest.mock('../EmailSearch', () => {
  return function MockEmailSearch() {
    return <div data-testid="email-search">Mock Email Search</div>;
  };
});

jest.mock('../EmailSearchResults', () => {
  return function MockEmailSearchResults() {
    return <div data-testid="email-search-results">Mock Email Search Results</div>;
  };
});

jest.mock('../../ui/Button', () => ({
  Button: function MockButton({ children }) {
    return <button>{children}</button>;
  },
}));

jest.mock('../../ui/Card', () => ({
  Card: function MockCard({ children }) {
    return <div>{children}</div>;
  },
}));

jest.mock('../../ui/Badge', () => ({
  Badge: function MockBadge({ children }) {
    return <span>{children}</span>;
  },
}));

// Now try to import the component
import EmailSearchDashboard from '../EmailSearchDashboard';

describe('EmailSearchDashboard Minimal Test', () => {
  it('should import and render without errors', () => {
    const { container } = render(<EmailSearchDashboard />);
    expect(container).toBeInTheDocument();
  });
});
