// Mock for emailAnalyticsService.js
const mockEmailAnalyticsService = {
  trackEmailEvent: jest.fn().mockResolvedValue({ success: true }),
  
  getEmailAnalytics: jest.fn().mockResolvedValue({
    success: true,
    data: {
      totalSent: 0,
      totalReceived: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
    },
  }),
  
  generateReport: jest.fn().mockResolvedValue({
    success: true,
    data: {
      reportId: 'mock-report-id',
      generatedAt: new Date().toISOString(),
    },
  }),
  
  getReports: jest.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
};

export const getEmailAnalyticsService = () => mockEmailAnalyticsService;
export const emailAnalyticsService = mockEmailAnalyticsService;
export default getEmailAnalyticsService;
