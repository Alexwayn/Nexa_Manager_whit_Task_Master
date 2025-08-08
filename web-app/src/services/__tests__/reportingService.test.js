import * as reportingService from '../reportingService';
import { supabase } from '@/lib/supabaseClient';

// Mock data
const mockReports = [
  {
    id: 1,
    name: 'Revenue Report Q1',
    type: 'revenue',
    status: 'completed',
    format: 'PDF',
    created_at: '2024-01-15T10:00:00Z',
    file_path: '/reports/revenue_q1_2024.pdf',
    size: 2048576
  },
  {
    id: 2,
    name: 'Client Analysis',
    type: 'client',
    status: 'processing',
    format: 'Excel',
    created_at: '2024-01-10T14:30:00Z',
    file_path: null,
    size: null
  }
];

const mockMetrics = {
  total_revenue: 150000,
  total_expenses: 80000,
  net_profit: 70000,
  total_clients: 45,
  active_projects: 12,
  completed_reports: 28
};

const mockChartData = {
  revenue_by_month: [
    { month: '2024-01', revenue: 12000 },
    { month: '2024-02', revenue: 15000 },
    { month: '2024-03', revenue: 18000 }
  ],
  expenses_by_category: [
    { category: 'Marketing', amount: 5000 },
    { category: 'Operations', amount: 8000 },
    { category: 'Personnel', amount: 12000 }
  ]
};

const mockSchedules = [
  {
    id: 1,
    name: 'Weekly Revenue Report',
    type: 'revenue',
    frequency: 'weekly',
    day_of_week: 1,
    time: '09:00:00',
    format: 'PDF',
    email: 'admin@company.com',
    enabled: true,
    next_run: '2024-01-22T09:00:00Z'
  }
];

describe('reportingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReports', () => {
    it('fetches reports successfully', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ data: mockReports, error: null });

      const result = await reportingService.getReports();

      expect(supabase.from).toHaveBeenCalledWith('reports');
      expect(result).toEqual(mockReports);
    });

    it('filters reports by type', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ data: [mockReports[0]], error: null });

      const result = await reportingService.getReports({ type: 'revenue' });

      expect(result).toEqual([mockReports[0]]);
    });

    it('filters reports by status', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ data: [mockReports[0]], error: null });

      const result = await reportingService.getReports({ status: 'completed' });

      expect(result).toEqual([mockReports[0]]);
    });

    it('handles database errors', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ data: null, error: { message: 'Database connection failed' } });

      await expect(reportingService.getReports()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getReportMetrics', () => {
    it('fetches report metrics successfully', async () => {
      supabase.rpc.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await reportingService.getReportMetrics();

      expect(supabase.rpc).toHaveBeenCalledWith('get_report_metrics');
      expect(result).toEqual(mockMetrics);
    });

    it('fetches metrics for date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      supabase.rpc.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await reportingService.getReportMetrics({ startDate, endDate });

      expect(supabase.rpc).toHaveBeenCalledWith('get_report_metrics', {
        start_date: startDate,
        end_date: endDate
      });
      expect(result).toEqual(mockMetrics);
    });

    it('handles errors when fetching metrics', async () => {
      const mockError = new Error('RPC error');
      supabase.rpc.mockResolvedValue({ data: null, error: mockError });

      await expect(reportingService.getReportMetrics()).rejects.toThrow('RPC error');
    });
  });

  describe('generateReport', () => {
    const reportParams = {
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF',
      name: 'Revenue Report January'
    };

    it('generates report successfully', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({
        data: [{ id: 123, status: 'processing' }],
        error: null
      });

      const result = await reportingService.generateReport(reportParams);

      expect(supabase.from).toHaveBeenCalledWith('reports');
      expect(result).toEqual({ id: 123, status: 'processing' });
    });

    it('validates required parameters', async () => {
      await expect(reportingService.generateReport({})).rejects.toThrow('Missing required parameters');
      
      await expect(reportingService.generateReport({ type: 'revenue' })).rejects.toThrow('Missing required parameters');
    });

    it('handles generation errors', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ 
        data: null, 
        error: { message: 'Insert failed' } 
      });

      await expect(reportingService.generateReport(reportParams)).rejects.toThrow('Insert failed');
    });
  });

  describe('getChartData', () => {
    it('fetches chart data successfully', async () => {
      supabase.rpc.mockResolvedValue({ data: mockChartData, error: null });

      const result = await reportingService.getChartData('revenue', {
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_chart_data', {
        chart_type: 'revenue',
        start_date: '2024-01-01',
        end_date: '2024-03-31'
      });
      expect(result).toEqual(mockChartData);
    });

    it('handles invalid chart type', async () => {
      await expect(reportingService.getChartData('invalid_type')).rejects.toThrow('Invalid chart type');
    });
  });

  describe('downloadReport', () => {
    it('downloads report successfully', async () => {
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: new Blob(['PDF content']), 
        error: null 
      });
      
      supabase.storage.from.mockReturnValue({
        download: mockDownload
      });

      const result = await reportingService.downloadReport('report_123.pdf');

      expect(supabase.storage.from).toHaveBeenCalledWith('reports');
      expect(mockDownload).toHaveBeenCalledWith('report_123.pdf');
      expect(result).toBeInstanceOf(Blob);
    });

    it('handles download errors', async () => {
      const mockDownload = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'File not found' } 
      });
      
      supabase.storage.from.mockReturnValue({
        download: mockDownload
      });

      await expect(reportingService.downloadReport('nonexistent.pdf')).rejects.toThrow('File not found');
    });
  });

  describe('getScheduledReports', () => {
    it('fetches scheduled reports successfully', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ data: mockSchedules, error: null });

      const result = await reportingService.getScheduledReports();

      expect(supabase.from).toHaveBeenCalledWith('report_schedules');
      expect(result).toEqual(mockSchedules);
    });
  });

  describe('createSchedule', () => {
    const scheduleData = {
      name: 'Weekly Revenue Report',
      type: 'revenue',
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      format: 'PDF',
      email: 'admin@company.com',
      enabled: true
    };

    it('creates schedule successfully', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ 
        data: [{ id: 1, ...scheduleData }], 
        error: null 
      });

      const result = await reportingService.createSchedule(scheduleData);

      expect(supabase.from).toHaveBeenCalledWith('report_schedules');
      expect(result).toEqual({ id: 1, ...scheduleData });
    });

    it('validates schedule data', async () => {
      await expect(reportingService.createSchedule({})).rejects.toThrow('Missing required schedule parameters');
    });
  });

  describe('updateSchedule', () => {
    it('updates schedule successfully', async () => {
      const updateData = { enabled: false };
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ 
        data: [{ id: 1, ...updateData }], 
        error: null 
      });

      const result = await reportingService.updateSchedule(1, updateData);

      expect(supabase.from).toHaveBeenCalledWith('report_schedules');
      expect(result).toEqual({ id: 1, ...updateData });
    });
  });

  describe('deleteSchedule', () => {
    it('deletes schedule successfully', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ error: null });

      const result = await reportingService.deleteSchedule(1);

      expect(supabase.from).toHaveBeenCalledWith('report_schedules');
      expect(result).toEqual({ success: true });
    });

    it('handles delete errors', async () => {
      const mockQuery = supabase.from();
      mockQuery.__setMockResponse({ 
        error: { message: 'Delete failed' } 
      });

      await expect(reportingService.deleteSchedule(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('exportReportData', () => {
    const exportData = {
      type: 'revenue',
      format: 'CSV',
      data: [
        { month: 'January', revenue: 12000 },
        { month: 'February', revenue: 15000 }
      ]
    };

    it('exports data as CSV', async () => {
      const result = await reportingService.exportReportData(exportData);

      expect(result).toContain('month,revenue');
      expect(result).toContain('January,12000');
      expect(result).toContain('February,15000');
    });

    it('exports data as JSON', async () => {
      const jsonExportData = { ...exportData, format: 'JSON' };
      const result = await reportingService.exportReportData(jsonExportData);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(exportData.data);
    });

    it('handles unsupported format', async () => {
      const invalidExportData = { ...exportData, format: 'XML' };
      
      await expect(reportingService.exportReportData(invalidExportData))
        .rejects.toThrow('Unsupported export format');
    });
  });

  describe('validateReportParams', () => {
    it('validates valid parameters', async () => {
      const validParams = {
        type: 'revenue',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'PDF'
      };

      const result = await reportingService.validateReportParams(validParams);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates invalid date range', async () => {
      const invalidParams = {
        type: 'revenue',
        startDate: '2024-01-31',
        endDate: '2024-01-01',
        format: 'PDF'
      };

      const result = await reportingService.validateReportParams(invalidParams);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    it('validates missing required fields', async () => {
      const incompleteParams = {
        type: 'revenue'
      };

      const result = await reportingService.validateReportParams(incompleteParams);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Start date is required');
      expect(result.errors).toContain('End date is required');
    });
  });
});

// Integration tests
describe('reportingService Integration', () => {
  it('generates and downloads report end-to-end', async () => {
    // Mock successful generation
    const mockQuery = supabase.from();
    mockQuery.__setMockResponse({ 
      data: [{ id: 123, status: 'completed', file_path: 'report_123.pdf' }], 
      error: null 
    });

    // Mock successful download
    const mockDownload = jest.fn().mockResolvedValue({ 
      data: new Blob(['PDF content']), 
      error: null 
    });
    
    supabase.storage.from.mockReturnValue({
      download: mockDownload
    });

    // Generate report
    const report = await reportingService.generateReport({
      type: 'revenue',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      format: 'PDF',
      name: 'Test Report'
    });

    expect(report.id).toBe(123);

    // Download report
    const blob = await reportingService.downloadReport(report.file_path);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('creates schedule and generates first report', async () => {
    // Mock schedule creation
    const mockQuery = supabase.from();
    mockQuery.__setMockResponse({ 
      data: [{ id: 1, name: 'Test Schedule' }], 
      error: null 
    });

    const schedule = await reportingService.createSchedule({
      name: 'Test Schedule',
      type: 'revenue',
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      format: 'PDF',
      email: 'test@company.com',
      enabled: true
    });

    expect(schedule.id).toBe(1);
    expect(schedule.name).toBe('Test Schedule');
  });
});
