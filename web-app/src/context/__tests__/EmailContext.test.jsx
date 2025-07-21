import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { EmailProvider, useEmailContext } from '../EmailContext';
import { AuthProvider } from '../AuthContext';
import { WebSocketProvider } from '@providers/WebSocketProvider';
import emailManagementService from '@lib/emailManagementService';

// Mock dependencies
jest.mock('@lib/emailManagementService');
jest.mock('@utils/Logger');
jest.mock('@providers/WebSocketProvider', () => ({
  WebSocketProvider: ({ children }) => <div data-testid="websocket-provider">{children}</div>,
  useWebSocketContext: () => ({
    subscribe: jest.fn(() => jest.fn()),
    isConnected: true,
  }),
}));

// Test component to access context
const TestComponent = () => {
  const context = useEmailContext();
  
  return (
    <div>
      <div data-testid="emails-count">{context.emails.length}</div>
      <div data-testid="selected-folder">{context.selectedFolder}</div>
      <div data-testid="loading">{context.emailsLoading.toString()}</div>
      <div data-testid="unread-count">{context.unreadCount}</div>
      <button 
        data-testid="select-folder" 
        onClick={() => context.selectFolder('sent')}
      >
        Select Sent
      </button>
      <button 
        data-testid="open-composer" 
        onClick={() => context.openComposer({ to: 'test@example.com' })}
      >
        Open Composer
      </button>
    </div>
  );
};

// Mock providers wrapper
const MockProviders = ({ children }) => (
  <AuthProvider>
    <WebSocketProvider>
      <EmailProvider>
        {children}
      </EmailProvider>
    </WebSocketProvider>
  </AuthProvider>
);

describe('EmailContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock service methods
    emailManagementService.initialize.mockResolvedValue({ success: true });
    emailManagementService.getFolders.mockResolvedValue({
      success: true,
      data: [
        { id: 'inbox', name: 'Inbox', unreadCount: 5 },
        { id: 'sent', name: 'Sent', unreadCount: 0 },
      ],
    });
    emailManagementService.getTemplates.mockResolvedValue({
      success: true,
      data: [],
    });
    emailManagementService.fetchEmails.mockResolvedValue({
      success: true,
      data: [],
      total: 0,
      hasMore: false,
    });
  });

  it('should provide initial context values', () => {
    render(
      <MockProviders>
        <TestComponent />
      </MockProviders>
    );

    expect(screen.getByTestId('emails-count')).toHaveTextContent('0');
    expect(screen.getByTestId('selected-folder')).toHaveTextContent('inbox');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('should handle folder selection', async () => {
    render(
      <MockProviders>
        <TestComponent />
      </MockProviders>
    );

    const selectButton = screen.getByTestId('select-folder');
    
    await act(async () => {
      selectButton.click();
    });

    expect(screen.getByTestId('selected-folder')).toHaveTextContent('sent');
  });

  it('should handle composer state', async () => {
    const TestComposerComponent = () => {
      const context = useEmailContext();
      
      return (
        <div>
          <div data-testid="composer-open">{context.composerOpen.toString()}</div>
          <div data-testid="composer-data">
            {context.composerData ? JSON.stringify(context.composerData) : 'null'}
          </div>
          <button 
            data-testid="open-composer" 
            onClick={() => context.openComposer({ to: 'test@example.com' })}
          >
            Open Composer
          </button>
          <button 
            data-testid="close-composer" 
            onClick={() => context.closeComposer()}
          >
            Close Composer
          </button>
        </div>
      );
    };

    render(
      <MockProviders>
        <TestComposerComponent />
      </MockProviders>
    );

    // Initially closed
    expect(screen.getByTestId('composer-open')).toHaveTextContent('false');
    expect(screen.getByTestId('composer-data')).toHaveTextContent('null');

    // Open composer
    await act(async () => {
      screen.getByTestId('open-composer').click();
    });

    expect(screen.getByTestId('composer-open')).toHaveTextContent('true');
    expect(screen.getByTestId('composer-data')).toHaveTextContent('{"to":"test@example.com"}');

    // Close composer
    await act(async () => {
      screen.getByTestId('close-composer').click();
    });

    expect(screen.getByTestId('composer-open')).toHaveTextContent('false');
  });

  it('should handle search and filters', async () => {
    const TestSearchComponent = () => {
      const context = useEmailContext();
      
      return (
        <div>
          <div data-testid="search-query">{context.searchQuery}</div>
          <div data-testid="filters">{JSON.stringify(context.filters)}</div>
          <button 
            data-testid="set-search" 
            onClick={() => context.setSearchQuery('test search')}
          >
            Set Search
          </button>
          <button 
            data-testid="set-filters" 
            onClick={() => context.setFilters({ isRead: true })}
          >
            Set Filters
          </button>
        </div>
      );
    };

    render(
      <MockProviders>
        <TestSearchComponent />
      </MockProviders>
    );

    // Initially empty
    expect(screen.getByTestId('search-query')).toHaveTextContent('');

    // Set search query
    await act(async () => {
      screen.getByTestId('set-search').click();
    });

    expect(screen.getByTestId('search-query')).toHaveTextContent('test search');

    // Set filters
    await act(async () => {
      screen.getByTestId('set-filters').click();
    });

    const filtersText = screen.getByTestId('filters').textContent;
    expect(filtersText).toContain('"isRead":true');
  });

  it('should handle notifications', async () => {
    const TestNotificationComponent = () => {
      const context = useEmailContext();
      
      return (
        <div>
          <div data-testid="notifications-count">{context.notifications.length}</div>
          <div data-testid="unread-count">{context.unreadCount}</div>
          <button 
            data-testid="add-notification" 
            onClick={() => context.addNotification({
              id: 'test-1',
              type: 'test',
              title: 'Test Notification',
              message: 'This is a test',
              timestamp: new Date(),
              read: false,
            })}
          >
            Add Notification
          </button>
          <button 
            data-testid="mark-read" 
            onClick={() => context.markNotificationRead('test-1')}
          >
            Mark Read
          </button>
          <button 
            data-testid="remove-notification" 
            onClick={() => context.removeNotification('test-1')}
          >
            Remove Notification
          </button>
        </div>
      );
    };

    render(
      <MockProviders>
        <TestNotificationComponent />
      </MockProviders>
    );

    // Initially no notifications
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');

    // Add notification
    await act(async () => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');

    // Mark as read
    await act(async () => {
      screen.getByTestId('mark-read').click();
    });

    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');

    // Remove notification
    await act(async () => {
      screen.getByTestId('remove-notification').click();
    });

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useEmailContext must be used within an EmailProvider');

    console.error = originalError;
  });

  it('should handle loading states', async () => {
    // Mock loading state
    emailManagementService.fetchEmails.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: [{ id: '1', subject: 'Test Email' }],
          total: 1,
          hasMore: false,
        }), 100)
      )
    );

    const TestLoadingComponent = () => {
      const context = useEmailContext();
      
      return (
        <div>
          <div data-testid="emails-loading">{context.emailsLoading.toString()}</div>
          <div data-testid="emails-count">{context.emails.length}</div>
          <button 
            data-testid="load-emails" 
            onClick={() => context.loadEmails()}
          >
            Load Emails
          </button>
        </div>
      );
    };

    render(
      <MockProviders>
        <TestLoadingComponent />
      </MockProviders>
    );

    // Trigger loading
    await act(async () => {
      screen.getByTestId('load-emails').click();
    });

    // Wait for loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(screen.getByTestId('emails-count')).toHaveTextContent('1');
  });
});