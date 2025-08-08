/**
 * React Hot Toast Mock
 * Provides mock implementation for react-hot-toast library
 */

// Mock toast functions
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn(),
  remove: jest.fn()
};

// Mock Toaster component
const MockToaster = ({ children, ...props }) => {
  return null; // Don't render anything in tests
};

// Export as both default and named export to match react-hot-toast API
module.exports = {
  __esModule: true,
  default: mockToast,
  toast: mockToast,
  Toaster: MockToaster
};