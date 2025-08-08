// Mock for errorReportingService
export default {
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
