import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailPerformanceMonitor from '../EmailPerformanceMonitor';

// Mock the entire module
jest.mock('@features/email', () => ({
  __esModule: true,
  emailCacheService: {
    getStats: jest.fn(),
    clear: jest.fn(),
  },
  emailSyncService: {
    getPerformanceStats: jest.fn(),
  },
}));

jest.mock('@/utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Import the mocked services after the mock setup
import { emailCacheService, emailSyncService } from '@features/email';

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChartBarIcon: ({ className, ...props }) => <svg data-testid="chart-bar-icon" className={className} {...props} />,
  ClockIcon: ({ className, ...props }) => <svg data-testid="clock-icon" className={className} {...props} />,
  ServerIcon: ({ className, ...props }) => <svg data-testid="server-icon" className={className} {...props} />,
  CpuChipIcon: ({ className, ...props }) => <svg data-testid="cpu-chip-icon" className={className} {...props} />,
}));

describe('EmailPerformanceMonitor', () => {


  beforeEach(() => {
    jest.clearAllMocks();
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
      // Setup mock return values before each test in this block
      emailCacheService.getStats.mockReturnValue({
        hitRate: 0.85,
        cacheSize: 100,
        memoryUsageMB: '10.5',
        hits: 85,
        misses: 15,
      });
      emailSyncService.getPerformanceStats.mockReturnValue({
        isOnline: true,
        queueSizes: {
          pending: 10,
          inProgress: 5,
        },
        lastSyncTime: new Date().toISOString(),
      });
    });

    it('shows performance monitor when toggle button is clicked', () => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
      expect(screen.getByText('Email Performance')).toBeInTheDocument();
      expect(screen.getByText('Cache Performance')).toBeInTheDocument();
      expect(screen.getByText('Sync Status')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('displays cache statistics correctly', () => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
      expect(screen.getByText('Hit Rate')).toBeInTheDocument();
      expect(screen.getByText('85.0%')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByTestId('cache-items')).toHaveTextContent('100');
      expect(screen.getByText('10.5 MB')).toBeInTheDocument();
    });

    it('displays sync status correctly', async () => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
      expect(await screen.findByText('Status')).toBeInTheDocument();
      expect(await screen.findByText('Online')).toBeInTheDocument();
      expect(await screen.findByText('Queue')).toBeInTheDocument();
      expect(await screen.findByText('15')).toBeInTheDocument(); // pending (10) + inProgress (5)
    });

    it('displays performance metrics correctly', async () => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
      expect(screen.getByText('Avg Load')).toBeInTheDocument();
      expect(screen.getByText('0ms')).toBeInTheDocument(); // Not available in service
      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(await screen.findByTestId('performance-requests')).toHaveTextContent('100'); // hits + misses
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument(); // Not available in service
    });

        it('shows offline status when sync is offline', async () => {
      emailSyncService.getPerformanceStats.mockReturnValue({
        pending: 10,
        inProgress: 5,
        completed: 100,
        failed: 2,
        status: 'offline',
      });

      // Re-render is not ideal, let's assume the component reacts to prop changes or a state management solution
      // For this test, we will re-render to simulate a change.
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

        it('handles zero queue sizes correctly', async () => {
      emailSyncService.getPerformanceStats.mockReturnValue({
        pending: 0,
        inProgress: 0,
        completed: 100,
        failed: 2,
        status: 'online',
      });

      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));

      await waitFor(() => {
        const queueValue = screen.getAllByText('0');
        expect(queueValue.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      // Mocks can be set up here if they are common to all tests in this block
    });

        it('clears cache when Clear Cache button is clicked', async () => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
      const clearButton = screen.getByText('Clear Cache');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(emailCacheService.clear).toHaveBeenCalledTimes(1);
      });
    });

    it('renders refresh button', () => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });

    it('hides monitor when close button is clicked', () => {
      render(<EmailPerformanceMonitor />);
      fireEvent.click(screen.getByTitle('Show Performance Monitor'));
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Email Performance')).not.toBeInTheDocument();
      expect(screen.getByTitle('Show Performance Monitor')).toBeInTheDocument();
    });
  });






});
