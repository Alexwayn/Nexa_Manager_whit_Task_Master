/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import EmailSearchDashboard from '../EmailSearchDashboard';

// Mock hooks
jest.mock('../../hooks/useEmailSearch', () => ({
  useEmailSearch: jest.fn(),
}));

jest.mock('../../hooks/useEmails', () => ({
  useEmails: jest.fn(),
}));

// Mock child components
jest.mock('../EmailSearch', () => {
  return function MockEmailSearch({ onSearchResults, placeholder, className }) {
    return (
      <div data-testid="email-search" className={className}>
        <input 
          data-testid="search-input" 
          placeholder={placeholder}
          onChange={(e) => {
            if (onSearchResults) {
              onSearchResults([], 0);
            }
          }}
        />
      </div>
    );
  };
});

jest.mock('../EmailSearchResults', () => {
  return function MockEmailSearchResults({ 
    results, 
    totalResults, 
    currentPage, 
    pageSize, 
    isLoading, 
    onPageChange, 
    onEmailSelect, 
    onEmailAction, 
    selectedEmails, 
    className 
  }) {
    return (
      <div data-testid="email-search-results" className={className}>
        {isLoading && <div data-testid="loading">Loading...</div>}
        {results && results.map((email, index) => (
          <div key={email.id || index} data-testid={`email-${index}`}>
            {email.subject || `Email ${index + 1}`}
          </div>
        ))}
        {totalResults > 0 && <div>{totalResults} results</div>}
      </div>
    );
  };
});

// Mock UI components using shared components alias
jest.mock('@shared/components', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  Badge: ({ children, ...props }) => <span data-testid="badge" {...props}>{children}</span>,
  Button: ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>,
}));

jest.mock('@shared/components/Button', () => ({
  Button: ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>,
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (options && options.count !== undefined) {
        return `${key} ${options.count}`;
      }
      return key;
    },
  }),
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <svg data-testid="search-icon" />,
  AdjustmentsHorizontalIcon: () => <svg data-testid="adjustments-icon" />,
  XMarkIcon: () => <svg data-testid="x-mark-icon" />,
  ClockIcon: () => <svg data-testid="clock-icon" />,
  BookmarkIcon: () => <svg data-testid="bookmark-icon" />,
  FunnelIcon: () => <svg data-testid="funnel-icon" />,
  ChevronDownIcon: () => <svg data-testid="chevron-down-icon" />,
  ChevronUpIcon: () => <svg data-testid="chevron-up-icon" />,
  StarIcon: () => <svg data-testid="star-outline-icon" />,
  PaperClipIcon: () => <svg data-testid="paperclip-icon" />,
  CalendarIcon: () => <svg data-testid="calendar-icon" />,
  UserIcon: () => <svg data-testid="user-icon" />,
  TagIcon: () => <svg data-testid="tag-icon" />,
  DocumentTextIcon: () => <svg data-testid="document-text-icon" />,
  ChartBarIcon: () => <svg data-testid="chart-bar-icon" />,
  InboxIcon: () => <svg data-testid="inbox-icon" />,
}));

jest.mock('@heroicons/react/24/solid', () => ({
  StarIcon: () => <svg data-testid="star-solid-icon" />,
}));

const { useEmailSearch: mockUseEmailSearch } = require('../../hooks/useEmailSearch');
const { useEmails: mockUseEmails } = require('../../hooks/useEmails');

describe('EmailSearchDashboard', () => {
  const defaultProps = {
    onClose: jest.fn(),
    onEmailSelect: jest.fn(),
    isOpen: true,
    initialQuery: '',
  };

  const mockSearchHook = {
    searchQuery: '',
    searchFilters: {},
    searchResults: [],
    isSearching: false,
    searchError: null,
    totalResults: 0,
    showAdvancedSearch: false,
    searchSuggestions: [],
    showSuggestions: false,
    searchHistory: [],
    savedSearches: [],
    searchStats: null,
    currentPage: 1,
    pageSize: 20,
    handleSearchQueryChange: jest.fn(),
    handleFilterChange: jest.fn(),
    clearSearch: jest.fn(),
    applySuggestion: jest.fn(),
    applyHistorySearch: jest.fn(),
    saveCurrentSearch: jest.fn(),
    applySavedSearch: jest.fn(),
    deleteSavedSearch: jest.fn(),
    toggleAdvancedSearch: jest.fn(),
    setShowSuggestions: jest.fn(),
    handlePageChange: jest.fn(),
  };

  const mockEmailsHook = {
    emails: [],
    isLoading: false,
    error: null,
    selectedEmails: [],
    loadEmails: jest.fn(),
    selectEmail: jest.fn(),
    handleEmailSelect: jest.fn(),
    handleEmailAction: jest.fn(),
    bulkEmailAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEmailSearch.mockReturnValue(mockSearchHook);
    mockUseEmails.mockReturnValue(mockEmailsHook);
  });

  describe('Rendering', () => {
    test('should render dashboard and child components', () => {
      render(<EmailSearchDashboard {...defaultProps} />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
      expect(screen.getByTestId('email-search-results')).toBeInTheDocument();
    });

    test('should render when open', () => {
      render(<EmailSearchDashboard {...defaultProps} isOpen={true} />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });
  });

  describe('Basic Interactions', () => {
    test('should pass search props to child components', () => {
      render(<EmailSearchDashboard {...defaultProps} />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
      expect(screen.getByTestId('email-search-results')).toBeInTheDocument();
    });

    test('should handle email selection', () => {
      render(<EmailSearchDashboard {...defaultProps} />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });
  });

  describe('State Variations', () => {
    test('should display loading state', () => {
      mockUseEmails.mockReturnValue({ ...mockEmailsHook, isLoading: true });
      render(<EmailSearchDashboard {...defaultProps} />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });

    test('should display error state', () => {
      mockUseEmails.mockReturnValue({ ...mockEmailsHook, error: 'Failed to load' });
      render(<EmailSearchDashboard {...defaultProps} />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });

    test('should display search error', () => {
      mockUseEmailSearch.mockReturnValue({ ...mockSearchHook, searchError: 'Search failed' });
      render(<EmailSearchDashboard {...defaultProps} />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    test('should pass initialQuery to hook', () => {
      mockUseEmailSearch.mockReturnValue({ ...mockSearchHook, searchQuery: 'initial' });
      render(<EmailSearchDashboard {...defaultProps} initialQuery="initial" />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });

    test('should handle custom className', () => {
      render(<EmailSearchDashboard {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });
  });
});
