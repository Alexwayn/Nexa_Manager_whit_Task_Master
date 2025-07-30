// Mock for ErrorMonitor
export const errorMonitor = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  withScope: jest.fn((callback) => callback({})),
  configureScope: jest.fn(),
  startTransaction: jest.fn(() => ({
    setTag: jest.fn(),
    setData: jest.fn(),
    finish: jest.fn()
  })),
  getCurrentHub: jest.fn(() => ({
    getScope: jest.fn(() => ({
      setTag: jest.fn(),
      setContext: jest.fn()
    }))
  }))
};

export default errorMonitor;