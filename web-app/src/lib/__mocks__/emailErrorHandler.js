// Mock for emailErrorHandler.js
const emailErrorHandler = {
  withErrorHandling: jest.fn().mockImplementation(async (fn, options = {}) => {
    try {
      return await fn();
    } catch (error) {
      return options.fallbackValue || { success: false, error: error.message };
    }
  }),
  
  handleError: jest.fn().mockReturnValue({
    success: false,
    error: 'Mock error',
  }),
  
  logError: jest.fn(),
};

export default emailErrorHandler;
