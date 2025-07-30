// Mock for financial services
export const useReports = jest.fn(() => ({
  reports: [],
  loading: false,
  error: null,
  generateReport: jest.fn(),
  downloadReport: jest.fn(),
  deleteReport: jest.fn()
}));

export const useFinancialData = jest.fn(() => ({
  data: {},
  loading: false,
  error: null,
  refresh: jest.fn()
}));

export const financialService = {
  getReports: jest.fn(() => Promise.resolve([])),
  generateReport: jest.fn(() => Promise.resolve({})),
  downloadReport: jest.fn(() => Promise.resolve()),
  deleteReport: jest.fn(() => Promise.resolve())
};

export default {
  useReports,
  useFinancialData,
  financialService
};