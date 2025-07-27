import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryProvider } from '@tanstack/react-query';
import { useReports, useReportMetrics, useReportGeneration, useScheduledReports } from '../useReports';
import * as reportingService from '../../services/reportingService';

// Mock services
jest.mock('../../services/reportingService');

// Mock data
const mockReports = [
  {
    id: 1,
    name: 'Revenue Report Q1',
    type: 'revenue',
    status: 'completed',
    format: 'PDF',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Client Analysis',
    type: 'client',
    status: 'processing',
    format: 'Excel',
    created_at: '2024-01-10T14:30:00Z'
  }
];

const mockMetrics = {
  totalRevenue: 150000,
  totalExpenses: 80000,
  netProfit: 70000,
  totalClients: 45,
  activeProjects: 12,
  completedReports: 28
};

const mockSchedules = [
  {
    id: 1,
    name: 'Weekly Revenue Report',
    type: 'revenue',
    frequency: 'weekly',
    enabled: true
  }
];

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });

  return ({ children }) => (
    <QueryProvider client={queryClient}>
      {children}
    </QueryProvider>
  );
};

describe('useReports Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportingService.getReports.mockResolvedValue(mockReports);
  });

  it('fetches reports successfully', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockReports);
    expect(result.current.error).toBeNull();
    expect(reportingService.getReports).toHaveBeenCalledWith({});
  });

  it('fetches reports with filters', async () => {
    const filters = { type: 'revenue', status: 'completed' };
    
    const { result } = renderHook(() => useReports(filters), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(reportingService.getReports).toHaveBeenCalledWith(filters);
  });

  it('handles fetch errors', async () => {
    const error = new Error('Network error');
    reportingService.getReports.mockRejectedValue(error);

    const { result } = renderHook(() => useReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('refetches data when filters change', async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useReports(filters),
      {
        wrapper: createWrapper(),
        initialProps: { filters: { type: 'revenue' } }
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(reportingService.getReports).toHaveBeenCalledWith({ type: 'revenue' });

    // Change filters
    rerender({ filters: { type: 'client' } });

    await waitFor(() => {
      expect(reportingService.getReports).toHaveBeenCalledWith({ type: 'client' });
    });
  });

  it('provides refetch function', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Call refetch
    result.current.refetch();

    expect(reportingService.getReports).toHaveBeenCalledTimes(2);
  });
});

describe('useReportMetrics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportingService.getReportMetrics.mockResolvedValue(mockMetrics);
  });

  it('fetches metrics successfully', async () => {
    const { result } = renderHook(() => useReportMetrics(), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
    expect(reportingService.getReportMetrics).toHaveBeenCalledWith({});
  });

  it('fetches metrics with date range', async () => {
    const dateRange = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };

    const { result } = renderHook(() => useReportMetrics(dateRange), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(reportingService.getReportMetrics).toHaveBeenCalledWith(dateRange);
  });

  it('handles metrics fetch errors', async () => {
    const error = new Error('Metrics service unavailable');
    reportingService.getReportMetrics.mockRejectedValue(error);

    const { result } = renderHook(() => useReportMetrics(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
  });

  it('updates when date range changes', async () => {
    const { result, rerender } = renderHook(
      ({ dateRange }) => useReportMetrics(dateRange),
      {
        wrapper: createWrapper(),
        initialProps: { 
          dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' } 
        }
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change date range
    rerender({ 
      dateRange: { startDate: '2024-02-01', endDate: '2024-02-29' } 
    });

    await waitFor(() => {
      expect(reportingService.getReportMetrics).toHaveBeenCalledWith({
        startDate: '2024-02-01',
        endDate: '2024-02-29'
      });
    });
  });
});

describe('useReportGeneration Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportingService.generateReport.mockResolvedValue({
      id: 123,
      status: 'processing',
      name: 'Generated Report'
    });
  });

  it('provides generate function', async () => {
    const { result } = renderHook(() => useReportGeneration(), {
      wrapper: createWrapper()
    });

    expect(typeof result.current.generateReport).toBe('function');
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('generates report successfully', async () => {
    const { result } = renderHook(() => useReportGeneration(), {
      wrapper: createWrapper()
    });

    const reportParams = {
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF'
    };

    let generatedReport;
    await waitFor(async () => {
      generatedReport = await result.current.generateReport(reportParams);
    });

    expect(reportingService.generateReport).toHaveBeenCalledWith(reportParams);
    expect(generatedReport).toEqual({
      id: 123,
      status: 'processing',
      name: 'Generated Report'
    });
  });

  it('handles generation errors', async () => {
    const error = new Error('Generation failed');
    reportingService.generateReport.mockRejectedValue(error);

    const { result } = renderHook(() => useReportGeneration(), {
      wrapper: createWrapper()
    });

    const reportParams = {
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF'
    };

    await expect(result.current.generateReport(reportParams)).rejects.toThrow('Generation failed');
  });

  it('tracks loading state during generation', async () => {
    let resolveGeneration;
    reportingService.generateReport.mockImplementation(
      () => new Promise(resolve => {
        resolveGeneration = resolve;
      })
    );

    const { result } = renderHook(() => useReportGeneration(), {
      wrapper: createWrapper()
    });

    const reportParams = {
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF'
    };

    // Start generation
    const generationPromise = result.current.generateReport(reportParams);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(true);
    });

    // Complete generation
    resolveGeneration({ id: 123, status: 'completed' });
    await generationPromise;

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useReportGeneration({ onSuccess }), {
      wrapper: createWrapper()
    });

    const reportParams = {
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF'
    };

    await waitFor(async () => {
      await result.current.generateReport(reportParams);
    });

    expect(onSuccess).toHaveBeenCalledWith({
      id: 123,
      status: 'processing',
      name: 'Generated Report'
    });
  });

  it('calls onError callback', async () => {
    const error = new Error('Generation failed');
    const onError = vi.fn();
    reportingService.generateReport.mockRejectedValue(error);

    const { result } = renderHook(() => useReportGeneration({ onError }), {
      wrapper: createWrapper()
    });

    const reportParams = {
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF'
    };

    await expect(result.current.generateReport(reportParams)).rejects.toThrow();
    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe('useScheduledReports Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportingService.getScheduledReports.mockResolvedValue(mockSchedules);
    reportingService.createSchedule.mockResolvedValue({ id: 2, name: 'New Schedule' });
    reportingService.updateSchedule.mockResolvedValue({ id: 1, enabled: false });
    reportingService.deleteSchedule.mockResolvedValue({ success: true });
  });

  it('fetches scheduled reports successfully', async () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSchedules);
    expect(reportingService.getScheduledReports).toHaveBeenCalled();
  });

  it('provides create schedule mutation', async () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const scheduleData = {
      name: 'New Schedule',
      type: 'revenue',
      frequency: 'weekly'
    };

    await waitFor(async () => {
      await result.current.createSchedule(scheduleData);
    });

    expect(reportingService.createSchedule).toHaveBeenCalledWith(scheduleData);
  });

  it('provides update schedule mutation', async () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updateData = { enabled: false };

    await waitFor(async () => {
      await result.current.updateSchedule(1, updateData);
    });

    expect(reportingService.updateSchedule).toHaveBeenCalledWith(1, updateData);
  });

  it('provides delete schedule mutation', async () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(async () => {
      await result.current.deleteSchedule(1);
    });

    expect(reportingService.deleteSchedule).toHaveBeenCalledWith(1);
  });

  it('invalidates queries after mutations', async () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Create schedule should trigger refetch
    await waitFor(async () => {
      await result.current.createSchedule({ name: 'Test' });
    });

    // Should call getScheduledReports again
    expect(reportingService.getScheduledReports).toHaveBeenCalledTimes(2);
  });

  it('handles mutation errors', async () => {
    const error = new Error('Create failed');
    reportingService.createSchedule.mockRejectedValue(error);

    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      result.current.createSchedule({ name: 'Test' })
    ).rejects.toThrow('Create failed');
  });

  it('tracks mutation loading states', async () => {
    let resolveCreate;
    reportingService.createSchedule.mockImplementation(
      () => new Promise(resolve => {
        resolveCreate = resolve;
      })
    );

    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Start creation
    const createPromise = result.current.createSchedule({ name: 'Test' });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(true);
    });

    // Complete creation
    resolveCreate({ id: 2, name: 'Test' });
    await createPromise;

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });
});

// Integration tests
describe('Hooks Integration', () => {
  it('works together for complete report workflow', async () => {
    const wrapper = createWrapper();

    // Use reports hook
    const { result: reportsResult } = renderHook(() => useReports(), { wrapper });
    
    // Use generation hook
    const { result: generationResult } = renderHook(() => useReportGeneration(), { wrapper });

    await waitFor(() => {
      expect(reportsResult.current.isLoading).toBe(false);
    });

    // Generate new report
    await waitFor(async () => {
      await generationResult.current.generateReport({
        type: 'revenue',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'PDF'
      });
    });

    expect(reportingService.generateReport).toHaveBeenCalled();
    expect(reportingService.getReports).toHaveBeenCalled();
  });
});