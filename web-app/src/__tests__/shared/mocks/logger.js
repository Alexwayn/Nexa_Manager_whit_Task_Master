/**
 * Mock Logger utility for Jest tests
 */

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

test('logger mocks load', () => {
  expect(typeof mockLogger.error).toBe('function');
});

export default mockLogger;

export const Logger = mockLogger;
