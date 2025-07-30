// Mock for shared services index
export const errorReportingService = {
  reportError: jest.fn(),
  reportWarning: jest.fn(),
  reportInfo: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback({})),
  startTransaction: jest.fn(() => ({
    setTag: jest.fn(),
    setData: jest.fn(),
    finish: jest.fn()
  }))
};

export const analyticsService = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  group: jest.fn(),
  alias: jest.fn()
};

export const notificationService = {
  show: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
};

export const authService = {
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(() => true),
  getToken: jest.fn(() => 'mock-token')
};

export default {
  errorReportingService,
  analyticsService,
  notificationService,
  authService
};