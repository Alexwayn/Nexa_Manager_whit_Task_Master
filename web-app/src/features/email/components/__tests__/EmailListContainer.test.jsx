import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailListContainer from '../EmailListContainer';

// Mock hooks
jest.mock('@hooks/useEmailList', () => jest.fn());

// Mock EmailList component
jest.mock('@components/email/EmailList', () => {
  return function MockEmailList({ 
    emails,
    selectedEmail,
    selectedEmails,
    onEmailSelect,
    onEmailCheck,
    onStarToggle,
    onBulkAction,
    loading,
    hasMore,
    onLoadMore,
    showThreads,
    labels,
    className
  }) {
    return (
      <div 
        data-testid="mock-email-list"
        data-loading={loading}
        data-has-more={hasMore}
        data-show-threads={showThreads}
        className={className}
      >
        <div data-testid="email-count">{emails.length} emails</div>
        {emails.map(email => (
          <div 
            key={email.id} 
            data-testid={`email-item-${email.id}`}
            onClick={() => onEmailSelect(email)}
          >
            {email.subject}
          </div>
        ))}
        {hasMore && (
          <button onClick={onLoadMore} data-testid="load-more">
            Load More
          </button>
        )}
      </div>
    );
  };
});

import useEmailList from '@hooks/useEmailList';

// Default mock implementation for useEmailList
const defaultMockReturn = {
  emails: [],
  selectedEmail: null,
  selectedEmails: new Set(),
  loading: false,
  error: null,
  hasMore: false,
  stats: {
    total: 0,
    unread: 0,
    starred: 0,
    selected: 0,
  },
  lastRefresh: null,
  fetchEmails: jest.fn(),
  loadMore: jest.fn(),
  refresh: jest.fn(),
  search: jest.fn(),
  applyFilters: jest.fn(),
  selectEmail: jest.fn(),
  toggleEmailSelection: jest.fn(),
  selectAllEmails: jest.fn(),
  toggleStar: jest.fn(),
  performBulkAction: jest.fn(),
  moveToFolder: jest.fn(),
  setSearchQuery: jest.fn(),
  setFilters: jest.fn(),
  setSelectedEmail: jest.fn(),
  setSelectedEmails: jest.fn(),
};

describe('EmailListContainer', () => {
  const defaultProps = {
    folderId: 'inbox',
    selectedEmail: null,
    onEmailSelect: jest.fn(),
    labels: [],
    showThreads: false,
    className: '',
  };

  const sampleEmails = [
    {
      id: '1',
      subject: 'Test Email 1',
      sender: 'test1@example.com',
      date: '2023-05-30T10:00:00Z',
      isRead: false,
      isStarred: false,
      snippet: 'This is a test email snippet...',
    },
    {
      id: '2',
      subject: 'Test Email 2',
      sender: 'test2@example.com',
      date: '2023-05-30T09:00:00Z',
      isRead: true,
      isStarred: true,
      snippet: 'Another test email snippet...',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useEmailList.mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    test('should render EmailList component', () => {
      render(<EmailListContainer {...defaultProps} />);
      
      expect(screen.getByTestId('mock-email-list')).toBeInTheDocument();
    });

        test('should show loading state', async () => {
            useEmailList.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      render(<EmailListContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-email-list')).toBeInTheDocument();
        expect(screen.getByTestId('mock-email-list')).toHaveAttribute('data-loading', 'true');
      });
    });

        test('should show error state', async () => {
            useEmailList.mockReturnValue({
        ...defaultMockReturn,
        error: 'Failed to load emails',
      });

      render(<EmailListContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading emails')).toBeInTheDocument();
        expect(screen.getByText('Failed to load emails')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

        test('should show emails when loaded', async () => {
            useEmailList.mockReturnValue({
        ...defaultMockReturn,
        emails: sampleEmails,
      });

      render(<EmailListContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-email-list')).toBeInTheDocument();
        expect(screen.getByText('2 emails')).toBeInTheDocument();
      });
    });

    test('should pass correct props to EmailList', () => {
      const mockEmails = sampleEmails;
      const mockSelectedEmails = new Set(['1']);
      
      mockUseEmailList.mockReturnValue({
        ...defaultMockReturn,
        emails: mockEmails,
        selectedEmails: mockSelectedEmails,
        hasMore: true,
      });

      render(<EmailListContainer {...defaultProps} showThreads={true} />);
      
      const emailList = screen.getByTestId('mock-email-list');
      expect(emailList).toHaveAttribute('data-show-threads', 'true');
      expect(emailList).toHaveAttribute('data-has-more', 'true');
    });
  });

  describe('Email Interactions', () => {
    test('should handle email selection', () => {
      const mockSelectEmail = jest.fn();
      const mockOnEmailSelect = jest.fn();
      
      mockUseEmailList.mockReturnValue({
        ...defaultMockReturn,
        emails: sampleEmails,
        selectEmail: mockSelectEmail,
      });

      render(<EmailListContainer {...defaultProps} onEmailSelect={mockOnEmailSelect} />);
      
      const emailItem = screen.getByTestId('email-item-1');
      fireEvent.click(emailItem);
      
      expect(mockSelectEmail).toHaveBeenCalledWith(sampleEmails[0]);
      expect(mockOnEmailSelect).toHaveBeenCalledWith(sampleEmails[0]);
    });

    test('should handle load more', () => {
      const mockLoadMore = jest.fn();
      
      mockUseEmailList.mockReturnValue({
        ...defaultMockReturn,
        emails: sampleEmails,
        hasMore: true,
        loadMore: mockLoadMore,
      });

      render(<EmailListContainer {...defaultProps} />);
      
      const loadMoreButton = screen.getByTestId('load-more');
      fireEvent.click(loadMoreButton);
      
      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should show retry button on error', () => {
      const mockRefresh = jest.fn();
      
      mockUseEmailList.mockReturnValue({
        ...defaultMockReturn,
        error: 'Network error',
        refresh: mockRefresh,
      });

      render(<EmailListContainer {...defaultProps} />);
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('should display error message', () => {
      mockUseEmailList.mockReturnValue({
        ...defaultMockReturn,
        error: 'Custom error message',
      });

      render(<EmailListContainer {...defaultProps} />);
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    test('should pass folderId to useEmailList hook', () => {
      render(<EmailListContainer {...defaultProps} folderId="sent" />);
      
      expect(mockUseEmailList).toHaveBeenCalledWith({
        folderId: 'sent',
        pageSize: 50,
        autoRefresh: true,
        refreshInterval: 30000,
      });
    });

    test('should apply custom className', () => {
      mockUseEmailList.mockReturnValue({
        ...defaultMockReturn,
        emails: sampleEmails,
      });

      render(<EmailListContainer {...defaultProps} className="custom-class" />);
      
      const emailList = screen.getByTestId('mock-email-list');
      expect(emailList).toHaveClass('custom-class');
    });
  });
});