// Mock for reportingService
console.log('🔧 Loading reportingService mock');
const reportingService = {
  // Report generation
  generateReport: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'report_123',
      downloadUrl: '/api/reports/download/report_123.pdf',
      filename: 'report_123.pdf'
    }
  }),

  // Report types
  getReportTypes: jest.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 'revenue', name: 'Revenue Report', description: 'Financial revenue analysis' },
      { id: 'expenses', name: 'Expense Report', description: 'Expense tracking and analysis' },
      { id: 'clients', name: 'Client Report', description: 'Client activity and metrics' }
    ]
  }),

  // Report scheduling
  getSchedules: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        name: 'Weekly Revenue Report',
        type: 'revenue',
        frequency: 'weekly',
        enabled: true,
        dayOfWeek: 1,
        time: '09:00',
        email: 'admin@company.com',
        format: 'PDF'
      },
      {
        id: 2,
        name: 'Monthly Client Report',
        type: 'clients',
        frequency: 'monthly',
        enabled: false,
        dayOfMonth: 1,
        time: '08:00',
        email: 'manager@company.com',
        format: 'Excel'
      }
    ]
  }),

  // Alternative method name that ReportScheduler tests expect
  getScheduledReports: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Weekly Revenue Report',
      type: 'revenue',
      frequency: 'weekly',
      enabled: true,
      dayOfWeek: 1,
      time: '09:00',
      email: 'admin@company.com',
      format: 'PDF'
    },
    {
      id: 2,
      name: 'Monthly Client Report',
      type: 'clients',
      frequency: 'monthly',
      enabled: false,
      dayOfMonth: 1,
      time: '08:00',
      email: 'manager@company.com',
      format: 'Excel'
    }
  ]),

  createSchedule: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 3,
      name: 'Daily Expense Report',
      type: 'expenses',
      frequency: 'daily',
      enabled: true,
      time: '08:00',
      email: 'finance@company.com',
      format: 'PDF'
    }
  }),

  updateSchedule: jest.fn().mockResolvedValue({
    success: true
  }),

  deleteSchedule: jest.fn().mockResolvedValue({
    success: true
  }),

  // Report history
  getReportHistory: jest.fn().mockResolvedValue({
    success: true,
    data: []
  }),

  downloadReport: jest.fn().mockResolvedValue({
    success: true,
    data: new Blob(['mock report data'], { type: 'application/pdf' })
  })
};

module.exports = reportingService;