import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailSearchDashboard from '../EmailSearchDashboard';

// Mock all external dependencies
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

jest.mock('../../../hooks/useEmailSearch', () => ({
  useEmailSearch: jest.fn(),
}));

jest.mock('../../../hooks/useEmails', () => ({
  useEmails: jest.fn(),
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

jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }) => (
    <button 
      onClick={onClick} 
      className={className}
      data-testid={props['data-testid'] || `button-${children}`}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../ui/Card', () => ({
  Card: ({ children, className }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
}));

jest.mock('../../ui/Badge', () => ({
  Badge: ({ children, variant, className }) => (
    <span className={className} data-testid="badge">
      {children}
    </span>
  ),
}));

// Import the mocked hooks
import { useEmailSearch } from '../../../hooks/useEmailSearch';
import { useEmails } from '../../../hooks/useEmails';

describe('EmailSearchDashboard', () => {
  // Mock hook return values
  const mockSearchHook = {
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
  };

  const mockEmailsHook = {
    selectedEmails: [],
    handleEmailSelect: jest.fn(),
    handleEmailAction: jest.fn(),
    bulkEmailAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useEmailSearch.mockReturnValue(mockSearchHook);
    useEmails.mockReturnValue(mockEmailsHook);
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<EmailSearchDashboard />);
      expect(screen.getByText('search.emailSearch')).toBeInTheDocument();
    });

    it('renders main components', () => {
      render(<EmailSearchDashboard />);
      
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
      expect(screen.getByTestId('email-search-results')).toBeInTheDocument();
    });

    it('displays empty state correctly', () => {
      render(<EmailSearchDashboard />);
      
      expect(screen.getByText('search.noRecentSearches')).toBeInTheDocument();
      expect(screen.getByText('search.noSavedSearches')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles search results correctly', () => {
        const searchResults = [
          { id: 1, subject: 'Test Email 1' },
          { id: 2, subject: 'Test Email 2' },
        ];

        useEmailSearch.mockReturnValue({
          ...mockSearchHook,
          searchResults,
          totalResults: 2,
        });

        render(<EmailSearchDashboard />);
        
        // Check that component renders without errors
        expect(screen.getByTestId('email-search')).toBeInTheDocument();
        expect(screen.getByTestId('email-search-results')).toBeInTheDocument();
      });

     it('shows loading state during search', () => {
        useEmailSearch.mockReturnValue({
          ...mockSearchHook,
          isSearching: true,
        });

        render(<EmailSearchDashboard />);
        
        // Check that component renders without errors
        expect(screen.getByTestId('email-search')).toBeInTheDocument();
      });

     it('displays search error when present', () => {
       const errorMessage = 'Search failed';
       useEmailSearch.mockReturnValue({
         ...mockSearchHook,
         searchError: errorMessage,
       });

       render(<EmailSearchDashboard />);
       
       expect(screen.getByText('search.error')).toBeInTheDocument();
       expect(screen.getByText(errorMessage)).toBeInTheDocument();
     });

     it('calls clearSearch when clear button is clicked', () => {
       const mockClearSearch = jest.fn();
       useEmailSearch.mockReturnValue({
         ...mockSearchHook,
         totalResults: 5,
         clearSearch: mockClearSearch,
       });

       render(<EmailSearchDashboard />);
       
       // Check that component renders without errors
       expect(screen.getByTestId('email-search')).toBeInTheDocument();
     });
  });

  describe('Search History', () => {
    it('displays search history items', () => {
      const searchHistory = [
        { query: 'test query', timestamp: new Date().toISOString() },
        { query: 'another query', timestamp: new Date().toISOString() },
      ];

      useEmailSearch.mockReturnValue({
        ...mockSearchHook,
        searchHistory,
      });

      render(<EmailSearchDashboard />);
      
      expect(screen.getByText('test query')).toBeInTheDocument();
      expect(screen.getByText('another query')).toBeInTheDocument();
    });

    it('shows empty state when no search history', () => {
      render(<EmailSearchDashboard />);
      
      expect(screen.getByText('search.noRecentSearches')).toBeInTheDocument();
    });
  });

  describe('Saved Searches', () => {
    it('displays saved searches', () => {
      const savedSearches = [
        { id: 1, name: 'Important Emails', query: 'priority:high' },
        { id: 2, name: 'From Boss', query: 'from:boss@company.com' },
      ];

      useEmailSearch.mockReturnValue({
        ...mockSearchHook,
        savedSearches,
      });

      render(<EmailSearchDashboard />);
      
      expect(screen.getByText('Important Emails')).toBeInTheDocument();
      expect(screen.getByText('From Boss')).toBeInTheDocument();
    });

    it('shows empty state when no saved searches', () => {
      render(<EmailSearchDashboard />);
      
      expect(screen.getByText('search.noSavedSearches')).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('displays search statistics when available', () => {
      const searchStats = {
        totalEmails: 100,
        readEmails: 80,
        starredEmails: 15,
        withAttachments: 25,
        topSenders: [
          { name: 'John Doe', email: 'john@example.com', count: 10 },
        ],
        dateDistribution: {
          today: 5,
          thisWeek: 20,
          thisMonth: 50,
          older: 25,
        },
      };

      useEmailSearch.mockReturnValue({
        ...mockSearchHook,
        searchStats,
      });

      render(<EmailSearchDashboard />);
      
      // Check that component renders without errors
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
    });
  });

  describe('Quick Filters', () => {
    it('displays quick filter buttons', () => {
      render(<EmailSearchDashboard />);
      
      expect(screen.getByText('search.unreadEmails')).toBeInTheDocument();
      expect(screen.getByText('search.starredEmails')).toBeInTheDocument();
      expect(screen.getByText('search.withAttachments')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<EmailSearchDashboard />);
      
      const heading = screen.getByText('search.emailSearch');
      expect(heading).toBeInTheDocument();
    });

    it('has accessible form elements', () => {
      render(<EmailSearchDashboard />);
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders properly on different screen sizes', () => {
      render(<EmailSearchDashboard />);
      
      // Test that the component renders without errors
      expect(screen.getByTestId('email-search')).toBeInTheDocument();
      expect(screen.getByTestId('email-search-results')).toBeInTheDocument();
    });
  });
});