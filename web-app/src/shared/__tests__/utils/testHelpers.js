/**
 * Test Helpers
 * Utility functions to help with testing
 */

import React from 'react';
import { act, waitFor } from '@testing-library/react';

/**
 * Wait for async operations to complete
 */
export const waitForAsync = async (callback, timeout = 5000) => {
  await waitFor(callback, { timeout });
};

/**
 * Mock console methods to avoid noise in tests
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
    console.info.mockRestore();
  });
  
  return originalConsole;
};

/**
 * Create a mock function with predefined return values
 */
export const createMockFunction = (returnValues = []) => {
  const mockFn = jest.fn();
  
  returnValues.forEach((value) => {
    mockFn.mockReturnValueOnce(value);
  });
  
  return mockFn;
};

/**
 * Create a mock async function with predefined resolved values
 */
export const createMockAsyncFunction = (resolvedValues = []) => {
  const mockFn = jest.fn();
  
  resolvedValues.forEach((value) => {
    mockFn.mockResolvedValueOnce(value);
  });
  
  return mockFn;
};

/**
 * Create a mock function that rejects with an error
 */
export const createMockRejectedFunction = (error = new Error('Test error')) => {
  return jest.fn().mockRejectedValue(error);
};

/**
 * Simulate user typing in an input field
 */
export const typeInInput = async (input, text) => {
  input.focus();
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

/**
 * Simulate form submission
 */
export const submitForm = async (form) => {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
};

/**
 * Wait for element to appear with custom timeout
 */
export const waitForElement = async (getElement, timeout = 5000) => {
  return waitFor(getElement, { timeout });
};

/**
 * Wait for element to disappear
 */
export const waitForElementToDisappear = async (getElement, timeout = 5000) => {
  return waitFor(() => {
    expect(getElement()).not.toBeInTheDocument();
  }, { timeout });
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  
  return localStorageMock;
};

/**
 * Mock sessionStorage
 */
export const mockSessionStorage = () => {
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });
  
  return sessionStorageMock;
};

/**
 * Mock window.location
 */
export const mockLocation = (url = 'http://localhost:3000') => {
  const locationMock = new URL(url);
  
  Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
  });
  
  return locationMock;
};

/**
 * Mock window.matchMedia
 */
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Mock IntersectionObserver
 */
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  
  return mockIntersectionObserver;
};

/**
 * Mock ResizeObserver
 */
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver,
  });
  
  return mockResizeObserver;
};

/**
 * Create a test wrapper for async components
 */
export const createAsyncWrapper = (Component, props = {}) => {
  return () => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 * Mock fetch API for testing
 */
export const mockFetch = (mockResponse = {}, shouldReject = false) => {
  const mockFn = jest.fn();
  
  if (shouldReject) {
    mockFn.mockRejectedValue(new Error('Network error'));
  } else {
    mockFn.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    });
  }
  
  global.fetch = mockFn;
  return mockFn;
};

/**
 * Restore original fetch after mocking
 */
export const restoreFetch = () => {
  if (global.fetch && global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
};

/**
 * Mock URL.createObjectURL for file testing
 */
export const mockCreateObjectURL = () => {
  const mockFn = jest.fn(() => 'blob:mock-url');
  global.URL.createObjectURL = mockFn;
  return mockFn;
};

/**
 * Mock URL.revokeObjectURL for file testing
 */
export const mockRevokeObjectURL = () => {
  const mockFn = jest.fn();
  global.URL.revokeObjectURL = mockFn;
  return mockFn;
};

/**
 * Setup file API mocks
 */
export const setupFileAPIMocks = () => {
  const createObjectURL = mockCreateObjectURL();
  const revokeObjectURL = mockRevokeObjectURL();
  
  return { createObjectURL, revokeObjectURL };
};

/**
 * Create a mock file for testing file uploads
 */
export const createMockFile = (name = 'test.txt', content = 'test content', type = 'text/plain') => {
  const file = new File([content], name, { type });
  return file;
};

/**
 * Create a mock image file for testing
 */
export const createMockImageFile = (name = 'test.jpg', width = 100, height = 100) => {
  // Create a simple canvas and convert to blob
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, width, height);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], name, { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg');
  });
};

/**
 * Wait for next tick (useful for async operations)
 */
export const waitForNextTick = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * Flush all promises (useful for testing async operations)
 */
export const flushPromises = () => {
  return new Promise(resolve => setImmediate(resolve));
};

/**
 * Get all text content from an element and its children
 */
export const getAllTextContent = (element) => {
  return element.textContent || element.innerText || '';
};

/**
 * Check if element is visible (not hidden by CSS)
 */
export const isElementVisible = (element) => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
};

/**
 * Simulate network delay for testing loading states
 */
export const simulateNetworkDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create a mock timer for testing time-dependent code
 */
export const createMockTimer = () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  
  return {
    advanceTime: (ms) => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
  };
};

// =============================================================================
// ASSERTION HELPERS INTEGRATION
// =============================================================================

/**
 * Re-export assertion helpers for convenience
 * Import comprehensive assertion utilities from the dedicated module
 */
export {
  // DOM assertions
  expectToHaveClasses,
  expectNotToHaveClasses,
  expectToHaveAttributes,
  expectToBeVisible,
  expectToBeHidden,
  expectToHaveText,
  expectMultipleElementsWithText,
  
  // Form assertions
  expectFieldValue,
  expectFieldToBeRequired,
  expectFieldToBeDisabled,
  expectFieldToBeEnabled,
  expectFormToHaveErrors,
  expectFormToBeValid,
  expectToBeChecked,
  expectNotToBeChecked,
  
  // State assertions
  expectLoadingState,
  expectNotLoadingState,
  expectErrorMessage,
  expectNoErrorMessage,
  expectSuccessMessage,
  
  // Data assertions
  expectArrayToContainItemsWithProperties,
  expectObjectStructure,
  expectValidDate,
  
  // API assertions
  expectApiResponse,
  expectApiError,
  expectPaginatedResponse,
  
  // Business logic assertions
  expectValidClient,
  expectValidInvoice,
  expectValidUser,
  
  // Async assertions
  expectElementToAppear,
  expectElementToDisappear,
  expectConditionToBecomeTrue,
  
  // Mock assertions
  expectMockCalledWith,
  expectMockCallCount,
  expectMocksCalledInOrder,
  
  // Additional utility assertions
  expectComponentToRender,
  expectHookToReturn,
  expectValidUrl,
  expectValidColor,
  expectAccessibleElement,
  expectResponsiveElement,
} from './assertionHelpers';