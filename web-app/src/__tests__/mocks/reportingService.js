// Mock for reportingService to match test expectations
const mockReportingService = {
  // Mock methods that the test expects
  getReports: jest.fn(),
  getReportMetrics: jest.fn(),
  generateReport: jest.fn(),
  getChartData: jest.fn(),
  downloadReport: jest.fn(),
  getScheduledReports: jest.fn(),
  createSchedule: jest.fn(),
  updateSchedule: jest.fn(),
  deleteSchedule: jest.fn(),
  exportReportData: jest.fn(),
  validateReportParams: jest.fn(),
};

// Set up default mock implementations
mockReportingService.getReports.mockResolvedValue({
  success: true,
  data: [
    {
      id: '1',
      title: 'Monthly Revenue Report',
      type: 'revenue',
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
});

mockReportingService.getReportMetrics.mockResolvedValue({
  success: true,
  data: {
    totalReports: 10,
    completedReports: 8,
    pendingReports: 2,
    averageGenerationTime: 5.2,
  },
});

mockReportingService.generateReport.mockResolvedValue({
  success: true,
  data: {
    id: 'report-123',
    url: 'https://example.com/report.pdf',
    status: 'completed',
  },
});

mockReportingService.getChartData.mockResolvedValue({
  success: true,
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Revenue',
        data: [1000, 1500, 1200],
      },
    ],
  },
});

mockReportingService.downloadReport.mockResolvedValue({
  success: true,
  data: {
    url: 'https://example.com/download/report.pdf',
    filename: 'report.pdf',
  },
});

mockReportingService.getScheduledReports.mockResolvedValue({
  success: true,
  data: [
    {
      id: 'schedule-1',
      name: 'Monthly Revenue',
      frequency: 'monthly',
      next_run: '2024-02-01T00:00:00Z',
    },
  ],
});

mockReportingService.createSchedule.mockResolvedValue({
  success: true,
  data: {
    id: 'schedule-new',
    name: 'New Schedule',
    frequency: 'weekly',
  },
});

mockReportingService.updateSchedule.mockResolvedValue({
  success: true,
  data: {
    id: 'schedule-1',
    name: 'Updated Schedule',
    frequency: 'monthly',
  },
});

mockReportingService.deleteSchedule.mockResolvedValue({
  success: true,
});

mockReportingService.exportReportData.mockResolvedValue({
  success: true,
  data: {
    url: 'https://example.com/export.csv',
    format: 'csv',
  },
});

mockReportingService.validateReportParams.mockReturnValue({
  isValid: true,
  errors: [],
});

// Export both as default and named exports to handle different import styles
export default mockReportingService;

// Also export all methods as named exports for * as import style
export const getReports = mockReportingService.getReports;
export const getReportMetrics = mockReportingService.getReportMetrics;
export const generateReport = mockReportingService.generateReport;
export const getChartData = mockReportingService.getChartData;
export const downloadReport = mockReportingService.downloadReport;
export const getScheduledReports = mockReportingService.getScheduledReports;
export const createSchedule = mockReportingService.createSchedule;
export const updateSchedule = mockReportingService.updateSchedule;
export const deleteSchedule = mockReportingService.deleteSchedule;
export const exportReportData = mockReportingService.exportReportData;
export const validateReportParams = mockReportingService.validateReportParams;

// Export the entire mock object for namespace imports
export const reportingService = mockReportingService;