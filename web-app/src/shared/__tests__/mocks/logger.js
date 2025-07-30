/**
 * Mock for Logger in Jest tests
 */

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  log: jest.fn(),
};

export default mockLogger;