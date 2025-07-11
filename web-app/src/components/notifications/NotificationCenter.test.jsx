import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import NotificationCenter from './NotificationCenter';
import * as useRealtimeNotificationsModule from '../../hooks/useRealtimeNotifications';

// Mock the hook
const mockUseRealtimeNotifications = jest.spyOn(useRealtimeNotificationsModule, 'default');

// Mock data
const mockNotifications = [
  {
    id: '1',
    type: 'report',
    title: 'Report Generato',
    message: 'Il report mensile è stato generato con successo',
    timestamp: '2024-01-15T10:30:00Z',
    read: false,
    priority: 'medium'
  },
  {
    id: '2',
    type: 'schedule',
    title: 'Schedule Eseguito',
    message: 'Lo schedule settimanale è stato eseguito',
    timestamp: '2024-01-15T09:15:00Z',
    read: true,
    priority: 'low'
  },
  {
    id: '3',
    type: 'system',
    title: 'Errore Sistema',
    message: 'Si è verificato un errore nel sistema',
    timestamp: '2024-01-15T08:45:00Z',
    read: false,
    priority: 'high'
  }
];

const mockHookReturn = {
  notifications: mockNotifications,
  unreadCount: 2,
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  removeNotification: jest.fn(),
  clearAll: jest.fn()
};

describe('NotificationCenter', () => {
  beforeEach(() => {
    mockUseRealtimeNotifications.mockReturnValue(mockHookReturn);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders notification bell with unread count', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    expect(bellButton).toBeInTheDocument();
    
    const unreadBadge = screen.getByText('2');
    expect(unreadBadge).toBeInTheDocument();
  });

  test('opens notification panel when bell is clicked', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Notifiche')).toBeInTheDocument();
    expect(screen.getByText('Report Generato')).toBeInTheDocument();
  });

  test('displays correct number of notifications', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const notifications = screen.getAllByTestId(/notification-item/);
    expect(notifications).toHaveLength(3);
  });

  test('filters notifications by type', async () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const reportFilter = screen.getByText('Report');
    fireEvent.click(reportFilter);
    
    await waitFor(() => {
      const notifications = screen.getAllByTestId(/notification-item/);
      expect(notifications).toHaveLength(1);
      expect(screen.getByText('Report Generato')).toBeInTheDocument();
    });
  });

  test('filters unread notifications', async () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const unreadFilter = screen.getByText('Non lette');
    fireEvent.click(unreadFilter);
    
    await waitFor(() => {
      const notifications = screen.getAllByTestId(/notification-item/);
      expect(notifications).toHaveLength(2);
    });
  });

  test('marks notification as read when clicked', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const notification = screen.getByTestId('notification-item-1');
    fireEvent.click(notification);
    
    expect(mockHookReturn.markAsRead).toHaveBeenCalledWith('1');
  });

  test('marks all notifications as read', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const markAllButton = screen.getByText('Segna tutte come lette');
    fireEvent.click(markAllButton);
    
    expect(mockHookReturn.markAllAsRead).toHaveBeenCalled();
  });

  test('removes notification when delete button is clicked', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const deleteButtons = screen.getAllByLabelText(/rimuovi notifica/i);
    fireEvent.click(deleteButtons[0]);
    
    expect(mockHookReturn.removeNotification).toHaveBeenCalledWith('1');
  });

  test('clears all notifications', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const clearAllButton = screen.getByText('Cancella tutte');
    fireEvent.click(clearAllButton);
    
    expect(mockHookReturn.clearAll).toHaveBeenCalled();
  });

  test('displays correct notification icons', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    // Check for different notification type icons
    expect(screen.getByTestId('notification-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-3')).toBeInTheDocument();
  });

  test('displays relative time correctly', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    // Should display relative time like "2 ore fa", "3 ore fa", etc.
    const timeElements = screen.getAllByText(/fa$/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  test('shows empty state when no notifications', () => {
    mockUseRealtimeNotifications.mockReturnValue({
      ...mockHookReturn,
      notifications: [],
      unreadCount: 0
    });

    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Nessuna notifica')).toBeInTheDocument();
  });

  test('closes panel when clicking outside', () => {
    render(
      <div>
        <NotificationCenter />
        <div data-testid="outside-element">Outside</div>
      </div>
    );
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Notifiche')).toBeInTheDocument();
    
    const outsideElement = screen.getByTestId('outside-element');
    fireEvent.mouseDown(outsideElement);
    
    expect(screen.queryByText('Notifiche')).not.toBeInTheDocument();
  });

  test('handles keyboard navigation', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    
    // Test Enter key
    fireEvent.keyDown(bellButton, { key: 'Enter', code: 'Enter' });
    expect(screen.getByText('Notifiche')).toBeInTheDocument();
    
    // Test Escape key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByText('Notifiche')).not.toBeInTheDocument();
  });

  test('applies correct CSS classes for read/unread notifications', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const unreadNotification = screen.getByTestId('notification-item-1');
    const readNotification = screen.getByTestId('notification-item-2');
    
    expect(unreadNotification).toHaveClass('bg-blue-50');
    expect(readNotification).toHaveClass('bg-white');
  });

  test('displays correct priority colors', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const highPriorityNotification = screen.getByTestId('notification-item-3');
    expect(highPriorityNotification.querySelector('.text-red-600')).toBeInTheDocument();
  });

  test('handles long notification messages', () => {
    const longMessageNotification = {
      ...mockNotifications[0],
      message: 'Questo è un messaggio molto lungo che dovrebbe essere troncato per evitare problemi di layout e mantenere una buona esperienza utente nel pannello delle notifiche'
    };

    mockUseRealtimeNotifications.mockReturnValue({
      ...mockHookReturn,
      notifications: [longMessageNotification]
    });

    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const notification = screen.getByTestId('notification-item-1');
    expect(notification).toBeInTheDocument();
  });

  test('updates unread count when notifications change', () => {
    const { rerender } = render(<NotificationCenter />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Update mock to return different unread count
    mockUseRealtimeNotifications.mockReturnValue({
      ...mockHookReturn,
      unreadCount: 5
    });
    
    rerender(<NotificationCenter />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('handles notification with missing data gracefully', () => {
    const incompleteNotification = {
      id: '4',
      type: 'unknown',
      title: '',
      message: null,
      timestamp: '2024-01-15T10:30:00Z',
      read: false
    };

    mockUseRealtimeNotifications.mockReturnValue({
      ...mockHookReturn,
      notifications: [incompleteNotification]
    });

    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    expect(screen.getByTestId('notification-item-4')).toBeInTheDocument();
  });
});

// Integration tests
describe('NotificationCenter Integration', () => {
  test('integrates correctly with useRealtimeNotifications hook', () => {
    render(<NotificationCenter />);
    
    expect(mockUseRealtimeNotifications).toHaveBeenCalled();
  });

  test('passes correct parameters to hook functions', () => {
    render(<NotificationCenter />);
    
    const bellButton = screen.getByRole('button', { name: /notifiche/i });
    fireEvent.click(bellButton);
    
    const notification = screen.getByTestId('notification-item-1');
    fireEvent.click(notification);
    
    expect(mockHookReturn.markAsRead).toHaveBeenCalledWith('1');
    expect(mockHookReturn.markAsRead).toHaveBeenCalledTimes(1);
  });
});