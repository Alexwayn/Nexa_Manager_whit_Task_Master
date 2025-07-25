import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailPerformanceMonitor from '../EmailPerformanceMonitor';
import emailCacheService from '@lib/emailCacheService';
import emailSyncService from '@lib/emailSyncService';

// Mock the services
jest.mock('@lib/emailCacheService');
jest.mock('@lib/emailSyncService');

// Mock Logger to prevent import issues
jest.mock('@utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock all email services to prevent import.meta.env issues
jest.mock('@lib/emailProviderService', () => ({}));
jest.mock('@lib/emailStorageService', () => ({}));
jest.mock('@lib/emailTemplateService', () => ({}));
jest.mock('@lib/emailSecurityService', () => ({}));
jest.mock('@features/email/services/emailManagementService', () => ({}));
jest.mock('@lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChartBarIcon: ({ className, ...props }) => <svg data-testid="chart-bar-icon" className={className} {...props} />,
  ClockIcon: ({ className, ...props }) => <svg data-testid="clock-icon" className={className} {...props} />,
  ServerIcon: ({ className, ...props }) => <svg data-testid="server-icon" className={className} {...props} />,
  CpuChipIcon: ({ className, ...props }) => <svg data-testid="cpu-chip-icon" className={className} {...props} />,
}));

describe('EmailPerformanceMonitor', () => {
  const mockCacheStats = {
    hitRate: '85.50%',
    cacheSize: 150,
    memoryUsageMB: '2.00',
    hits: 85,
    misses: 15,
    evictions: 5,
  };

  const mockSyncStats = {
    isOnline: true,
    queueSizes: {
      inbox: 5,
      outbox: 3,
    },
    lastSyncTime: new Date().toISOString(),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock return values
    emailCacheService.getStats.mockReturnValue(mockCacheStats);
    emailSyncService.getPerformanceStats.mockReturnValue(mockSyncStats);
    emailCacheService.clear.mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('renders toggle button when not visible', () => {
      render(<EmailPerformanceMonitor />);
      
      const toggleButton = screen.getByTitle('Show Performance Monitor');
      expect(toggleButton).toBeInTheDocument();
      expect(screen.getByTestId('chart-bar-icon')).toBeInTheDocument();
    });

    it('applies custom className to toggle button', () => {
      render(<EmailPerformanceMonitor className="custom-class" />);
      
      const toggleButton = screen.getByTitle('Show Performance Monitor');
      expect(toggleButton).toHaveClass('custom-class');
    });
  });

  describe('Performance Monitor Display', () => {
    beforeEach(() => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
    });

    it('shows performance monitor when toggle button is clicked', () => {
      expect(screen.getByText('Email Performance')).toBeInTheDocument();
      expect(screen.getByText('Cache Performance')).toBeInTheDocument();
      expect(screen.getByText('Sync Status')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('displays cache statistics correctly', () => {
      expect(screen.getByText('Hit Rate')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });

    it('displays sync status correctly', () => {
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('Queue')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // 5 + 2 + 1
    });

    it('displays performance metrics correctly', () => {
      expect(screen.getByText('Avg Load')).toBeInTheDocument();
      expect(screen.getByText('0ms')).toBeInTheDocument(); // Not available in service
      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // hits + misses
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument(); // Not available in service
    });

    it('shows offline status when sync is offline', () => {
      emailSyncService.getPerformanceStats.mockReturnValue({
        ...mockSyncStats,
        isOnline: false,
      });

      // Re-render to trigger stats update
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('handles zero queue sizes correctly', () => {
      emailSyncService.getPerformanceStats.mockReturnValue({
        ...mockSyncStats,
        queueSizes: {},
      });

      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
    });

    it('clears cache when Clear Cache button is clicked', async () => {
      const clearButton = screen.getByText('Clear Cache');
      fireEvent.click(clearButton);

      expect(emailCacheService.clear).toHaveBeenCalledTimes(1);
    });

    it('renders refresh button', () => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });

    it('hides monitor when close button is clicked', () => {
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Email Performance')).not.toBeInTheDocument();
      expect(screen.getByTitle('Show Performance Monitor')).toBeInTheDocument();
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('updates stats every 5 seconds', () => {
      render(<EmailPerformanceMonitor />);

      expect(emailCacheService.getStats).toHaveBeenCalledTimes(1);
      expect(emailSyncService.getPerformanceStats).toHaveBeenCalledTimes(1);

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      expect(emailCacheService.getStats).toHaveBeenCalledTimes(2);
      expect(emailSyncService.getPerformanceStats).toHaveBeenCalledTimes(2);
    });

    it('cleans up interval on unmount', () => {
      const { unmount } = render(<EmailPerformanceMonitor />);
      
      jest.advanceTimersByTime(5000);
      expect(emailCacheService.getStats).toHaveBeenCalledTimes(2);

      unmount();
      jest.advanceTimersByTime(5000);
      
      // Should not call again after unmount
      expect(emailCacheService.getStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      emailCacheService.getStats.mockImplementation(() => {
        throw new Error('Service error');
      });

      render(<EmailPerformanceMonitor />);

      expect(consoleSpy).toHaveBeenCalledWith('Error updating performance stats:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles missing stats properties', () => {
      emailCacheService.getStats.mockReturnValue({});
      emailSyncService.getPerformanceStats.mockReturnValue({});

      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));

      // Should render with default values - be more specific to avoid multiple matches
      expect(screen.getByText('Hit Rate')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
      
      // Check that there are multiple "0" values (items and queue)
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Formatting', () => {
    it('formats memory usage correctly for different sizes', () => {
      const testCases = [
        { memoryUsageMB: '1.00', expected: '1.0 MB' },
        { memoryUsageMB: '2.50', expected: '2.5 MB' },
        { memoryUsageMB: '0.00', expected: '0.0 MB' },
        { memoryUsageMB: '0.50', expected: '0.5 MB' },
      ];

      testCases.forEach(({ memoryUsageMB, expected }) => {
        emailCacheService.getStats.mockReturnValue({
          ...mockCacheStats,
          memoryUsageMB,
        });

        const { unmount } = render(<EmailPerformanceMonitor />);
        fireEvent.click(screen.getByTitle('Show Performance Monitor'));

        // Use getAllByText and check that the expected value is in the list
        const memoryElements = screen.getAllByText(expected);
        expect(memoryElements.length).toBeGreaterThan(0);
        
        unmount();
      });
    });
  });
});