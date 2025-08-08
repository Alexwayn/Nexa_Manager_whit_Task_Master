/**
 * Assertion Helpers
 * Custom assertion utilities to make tests more readable and maintainable
 * These helpers extend Jest's built-in assertions with domain-specific logic
 */

// =============================================================================
// DOM ASSERTION HELPERS
// =============================================================================

/**
 * Assert that an element has specific CSS classes
 * @param {HTMLElement} element - The DOM element to check
 * @param {string|string[]} classes - Class name(s) to check for
 * @param {string} [message] - Custom error message
 */
export const expectToHaveClasses = (element, classes, message) => {
  const classArray = Array.isArray(classes) ? classes : [classes];
  const customMessage = message || `Expected element to have classes: ${classArray.join(', ')}`;
  
  classArray.forEach(className => {
    expect(element).toHaveClass(className);
  });
};

/**
 * Assert that an element does not have specific CSS classes
 * @param {HTMLElement} element - The DOM element to check
 * @param {string|string[]} classes - Class name(s) to check against
 * @param {string} [message] - Custom error message
 */
export const expectNotToHaveClasses = (element, classes, message) => {
  const classArray = Array.isArray(classes) ? classes : [classes];
  const customMessage = message || `Expected element not to have classes: ${classArray.join(', ')}`;
  
  classArray.forEach(className => {
    expect(element).not.toHaveClass(className);
  });
};

/**
 * Assert that an element has specific attributes with expected values
 * @param {HTMLElement} element - The DOM element to check
 * @param {Object} attributes - Object with attribute names as keys and expected values
 */
export const expectToHaveAttributes = (element, attributes) => {
  Object.entries(attributes).forEach(([attr, value]) => {
    if (value === null || value === undefined) {
      expect(element).toHaveAttribute(attr);
    } else {
      expect(element).toHaveAttribute(attr, value);
    }
  });
};

/**
 * Assert that an element is visible (not hidden by CSS)
 * @param {HTMLElement} element - The DOM element to check
 */
export const expectToBeVisible = (element) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

/**
 * Assert that an element is hidden (display: none, visibility: hidden, etc.)
 * @param {HTMLElement} element - The DOM element to check
 */
export const expectToBeHidden = (element) => {
  expect(element).not.toBeVisible();
};

/**
 * Assert that an element has specific text content (exact or partial match)
 * @param {HTMLElement} element - The DOM element to check
 * @param {string|RegExp} text - Expected text content
 * @param {boolean} [exact=false] - Whether to match exactly or partially
 */
export const expectToHaveText = (element, text, exact = false) => {
  if (exact) {
    expect(element).toHaveTextContent(text);
  } else {
    expect(element.textContent).toContain(text);
  }
};

/**
 * Assert that multiple elements exist with specific text content
 * @param {string|RegExp} text - Text to search for
 * @param {number} [expectedCount] - Expected number of elements (optional)
 */
export const expectMultipleElementsWithText = (text, expectedCount) => {
  const elements = screen.getAllByText(text);
  
  if (expectedCount !== undefined) {
    expect(elements).toHaveLength(expectedCount);
  } else {
    expect(elements.length).toBeGreaterThan(0);
  }
  
  return elements;
};

// =============================================================================
// FORM ASSERTION HELPERS
// =============================================================================

/**
 * Assert that a form field has a specific value
 * @param {HTMLElement} field - The form field element
 * @param {string} expectedValue - Expected field value
 */
export const expectFieldValue = (field, expectedValue) => {
  expect(field).toHaveValue(expectedValue);
};

/**
 * Assert that a form field is required
 * @param {HTMLElement} field - The form field element
 */
export const expectFieldToBeRequired = (field) => {
  expect(field).toBeRequired();
};

/**
 * Assert that a form field is disabled
 * @param {HTMLElement} field - The form field element
 */
export const expectFieldToBeDisabled = (field) => {
  expect(field).toBeDisabled();
};

/**
 * Assert that a form field is enabled
 * @param {HTMLElement} field - The form field element
 */
export const expectFieldToBeEnabled = (field) => {
  expect(field).toBeEnabled();
};

/**
 * Assert that a form has validation errors
 * @param {HTMLElement} form - The form element
 * @param {string[]} [expectedErrors] - Expected error messages (optional)
 */
export const expectFormToHaveErrors = (form, expectedErrors) => {
  const errorElements = form.querySelectorAll('[role="alert"], .error, .invalid');
  expect(errorElements.length).toBeGreaterThan(0);
  
  if (expectedErrors) {
    expectedErrors.forEach(errorText => {
      expect(form).toHaveTextContent(errorText);
    });
  }
};

/**
 * Assert that a form is valid (no error messages)
 * @param {HTMLElement} form - The form element
 */
export const expectFormToBeValid = (form) => {
  const errorElements = form.querySelectorAll('[role="alert"], .error, .invalid');
  expect(errorElements).toHaveLength(0);
};

/**
 * Assert that a checkbox or radio button is checked
 * @param {HTMLElement} input - The input element
 */
export const expectToBeChecked = (input) => {
  expect(input).toBeChecked();
};

/**
 * Assert that a checkbox or radio button is not checked
 * @param {HTMLElement} input - The input element
 */
export const expectNotToBeChecked = (input) => {
  expect(input).not.toBeChecked();
};

// =============================================================================
// LOADING STATE ASSERTION HELPERS
// =============================================================================

/**
 * Assert that a loading indicator is present
 * @param {HTMLElement} [container] - Container to search within (optional)
 */
export const expectLoadingState = (container = document.body) => {
  const loadingIndicators = [
    'Loading...',
    'Please wait...',
    /loading/i,
    '[data-testid="loading"]',
    '.loading',
    '.spinner'
  ];
  
  let found = false;
  for (const indicator of loadingIndicators) {
    try {
      if (typeof indicator === 'string' && indicator.startsWith('[')) {
        // CSS selector
        const element = container.querySelector(indicator);
        if (element) {
          found = true;
          break;
        }
      } else {
        // Text content
        const element = within(container).queryByText(indicator);
        if (element) {
          found = true;
          break;
        }
      }
    } catch (error) {
      // Continue checking other indicators
    }
  }
  
  expect(found).toBe(true);
};

/**
 * Assert that no loading indicator is present
 * @param {HTMLElement} [container] - Container to search within (optional)
 */
export const expectNotLoadingState = (container = document.body) => {
  const loadingIndicators = [
    'Loading...',
    'Please wait...',
    /loading/i
  ];
  
  loadingIndicators.forEach(indicator => {
    expect(within(container).queryByText(indicator)).not.toBeInTheDocument();
  });
};

// =============================================================================
// ERROR STATE ASSERTION HELPERS
// =============================================================================

/**
 * Assert that an error message is displayed
 * @param {string|RegExp} errorMessage - Expected error message
 * @param {HTMLElement} [container] - Container to search within (optional)
 */
export const expectErrorMessage = (errorMessage, container = document.body) => {
  const errorElement = within(container).getByText(errorMessage);
  expect(errorElement).toBeInTheDocument();
  expect(errorElement).toBeVisible();
};

/**
 * Assert that no error message is displayed
 * @param {string|RegExp} [errorMessage] - Specific error message to check against (optional)
 * @param {HTMLElement} [container] - Container to search within (optional)
 */
export const expectNoErrorMessage = (errorMessage, container = document.body) => {
  if (errorMessage) {
    expect(within(container).queryByText(errorMessage)).not.toBeInTheDocument();
  } else {
    // Check for common error indicators
    const errorSelectors = ['[role="alert"]', '.error', '.alert-error', '[data-testid="error"]'];
    errorSelectors.forEach(selector => {
      const errorElements = container.querySelectorAll(selector);
      expect(errorElements).toHaveLength(0);
    });
  }
};

/**
 * Assert that a success message is displayed
 * @param {string|RegExp} successMessage - Expected success message
 * @param {HTMLElement} [container] - Container to search within (optional)
 */
export const expectSuccessMessage = (successMessage, container = document.body) => {
  const successElement = within(container).getByText(successMessage);
  expect(successElement).toBeInTheDocument();
  expect(successElement).toBeVisible();
};

// =============================================================================
// DATA ASSERTION HELPERS
// =============================================================================

/**
 * Assert that an array contains items with specific properties
 * @param {Array} array - Array to check
 * @param {Object} properties - Properties that items should have
 * @param {number} [minCount=1] - Minimum number of matching items
 */
export const expectArrayToContainItemsWithProperties = (array, properties, minCount = 1) => {
  expect(Array.isArray(array)).toBe(true);
  
  const matchingItems = array.filter(item => {
    return Object.entries(properties).every(([key, value]) => {
      if (typeof value === 'function') {
        return value(item[key]);
      }
      return item[key] === value;
    });
  });
  
  expect(matchingItems.length).toBeGreaterThanOrEqual(minCount);
  return matchingItems;
};

/**
 * Assert that an object has the expected structure
 * @param {Object} obj - Object to check
 * @param {Object} expectedStructure - Expected structure with property names and types
 */
export const expectObjectStructure = (obj, expectedStructure) => {
  expect(typeof obj).toBe('object');
  expect(obj).not.toBeNull();
  
  Object.entries(expectedStructure).forEach(([key, expectedType]) => {
    expect(obj).toHaveProperty(key);
    
    if (typeof expectedType === 'string') {
      expect(typeof obj[key]).toBe(expectedType);
    } else if (typeof expectedType === 'function') {
      expect(expectedType(obj[key])).toBe(true);
    } else if (Array.isArray(expectedType)) {
      expect(Array.isArray(obj[key])).toBe(true);
      if (expectedType.length > 0) {
        // Check array item structure
        obj[key].forEach(item => {
          expectObjectStructure(item, expectedType[0]);
        });
      }
    } else if (typeof expectedType === 'object') {
      expectObjectStructure(obj[key], expectedType);
    }
  });
};

/**
 * Assert that a date string is valid and within expected range
 * @param {string} dateString - Date string to validate
 * @param {Object} [options] - Validation options
 * @param {Date} [options.after] - Date should be after this date
 * @param {Date} [options.before] - Date should be before this date
 * @param {boolean} [options.allowFuture=true] - Whether future dates are allowed
 */
export const expectValidDate = (dateString, options = {}) => {
  const { after, before, allowFuture = true } = options;
  
  expect(typeof dateString).toBe('string');
  
  const date = new Date(dateString);
  expect(date.toString()).not.toBe('Invalid Date');
  
  if (after) {
    expect(date.getTime()).toBeGreaterThan(after.getTime());
  }
  
  if (before) {
    expect(date.getTime()).toBeLessThan(before.getTime());
  }
  
  if (!allowFuture) {
    expect(date.getTime()).toBeLessThanOrEqual(Date.now());
  }
};

// =============================================================================
// API RESPONSE ASSERTION HELPERS
// =============================================================================

/**
 * Assert that an API response has the expected structure
 * @param {Object} response - API response object
 * @param {Object} [options] - Assertion options
 * @param {boolean} [options.expectSuccess=true] - Whether to expect success response
 * @param {boolean} [options.expectData=true] - Whether to expect data property
 * @param {boolean} [options.expectMeta=false] - Whether to expect meta property
 */
export const expectApiResponse = (response, options = {}) => {
  const { expectSuccess = true, expectData = true, expectMeta = false } = options;
  
  expect(typeof response).toBe('object');
  expect(response).not.toBeNull();
  
  if (expectSuccess) {
    expect(response).toHaveProperty('success', true);
  }
  
  if (expectData) {
    expect(response).toHaveProperty('data');
  }
  
  if (expectMeta) {
    expect(response).toHaveProperty('meta');
    expect(typeof response.meta).toBe('object');
  }
};

/**
 * Assert that an API error response has the expected structure
 * @param {Object} errorResponse - API error response object
 * @param {number} [expectedStatusCode] - Expected HTTP status code
 */
export const expectApiError = (errorResponse, expectedStatusCode) => {
  expect(typeof errorResponse).toBe('object');
  expect(errorResponse).not.toBeNull();
  
  expect(errorResponse).toHaveProperty('error');
  expect(errorResponse).toHaveProperty('message');
  
  if (expectedStatusCode) {
    expect(errorResponse).toHaveProperty('statusCode', expectedStatusCode);
  }
};

/**
 * Assert that a paginated response has the expected structure
 * @param {Object} response - Paginated response object
 * @param {Object} [options] - Assertion options
 * @param {number} [options.expectedPage] - Expected current page
 * @param {number} [options.expectedLimit] - Expected page limit
 * @param {number} [options.minTotal] - Minimum expected total items
 */
export const expectPaginatedResponse = (response, options = {}) => {
  const { expectedPage, expectedLimit, minTotal } = options;
  
  expectApiResponse(response, { expectData: true, expectMeta: false });
  expect(response).toHaveProperty('pagination');
  
  const pagination = response.pagination;
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(pagination).toHaveProperty('totalPages');
  
  if (expectedPage) {
    expect(pagination.page).toBe(expectedPage);
  }
  
  if (expectedLimit) {
    expect(pagination.limit).toBe(expectedLimit);
  }
  
  if (minTotal !== undefined) {
    expect(pagination.total).toBeGreaterThanOrEqual(minTotal);
  }
  
  expect(Array.isArray(response.data)).toBe(true);
};

// =============================================================================
// BUSINESS LOGIC ASSERTION HELPERS
// =============================================================================

/**
 * Assert that a client object has the expected structure
 * @param {Object} client - Client object to validate
 */
export const expectValidClient = (client) => {
  expectObjectStructure(client, {
    id: 'string',
    name: 'string',
    email: 'string',
    status: 'string',
    created_at: 'string',
    updated_at: 'string'
  });
  
  // Validate email format
  expect(client.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  
  // Validate status
  expect(['active', 'inactive', 'pending']).toContain(client.status);
  
  // Validate dates
  expectValidDate(client.created_at, { allowFuture: false });
  expectValidDate(client.updated_at, { allowFuture: false });
};

/**
 * Assert that an invoice object has the expected structure
 * @param {Object} invoice - Invoice object to validate
 */
export const expectValidInvoice = (invoice) => {
  expectObjectStructure(invoice, {
    id: 'string',
    invoice_number: 'string',
    client_id: 'string',
    amount: 'number',
    total_amount: 'number',
    currency: 'string',
    status: 'string',
    due_date: 'string',
    issued_date: 'string',
    items: (items) => Array.isArray(items) && items.length > 0
  });
  
  // Validate amounts
  expect(invoice.amount).toBeGreaterThan(0);
  expect(invoice.total_amount).toBeGreaterThanOrEqual(invoice.amount);
  
  // Validate currency
  expect(['EUR', 'USD', 'GBP']).toContain(invoice.currency);
  
  // Validate status
  expect(['draft', 'sent', 'paid', 'overdue', 'cancelled']).toContain(invoice.status);
  
  // Validate dates
  expectValidDate(invoice.due_date);
  expectValidDate(invoice.issued_date, { allowFuture: false });
  
  // Validate items
  invoice.items.forEach(item => {
    expectObjectStructure(item, {
      description: 'string',
      quantity: 'number',
      unit_price: 'number',
      total: 'number'
    });
    
    expect(item.quantity).toBeGreaterThan(0);
    expect(item.unit_price).toBeGreaterThan(0);
    expect(item.total).toBe(item.quantity * item.unit_price);
  });
};

/**
 * Assert that a user object has the expected structure
 * @param {Object} user - User object to validate
 */
export const expectValidUser = (user) => {
  expectObjectStructure(user, {
    id: 'string',
    email: 'string',
    first_name: 'string',
    last_name: 'string',
    role: 'string',
    is_active: 'boolean',
    created_at: 'string'
  });
  
  // Validate email format
  expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  
  // Validate role
  expect(['admin', 'user', 'viewer']).toContain(user.role);
  
  // Validate dates
  expectValidDate(user.created_at, { allowFuture: false });
};

// =============================================================================
// ASYNC ASSERTION HELPERS
// =============================================================================

/**
 * Wait for an element to appear and assert its presence
 * @param {Function} getElement - Function that returns the element
 * @param {Object} [options] - Wait options
 * @param {number} [options.timeout=5000] - Timeout in milliseconds
 */
export const expectElementToAppear = async (getElement, options = {}) => {
  const { timeout = 5000 } = options;
  
  await waitFor(() => {
    const element = getElement();
    expect(element).toBeInTheDocument();
    return element;
  }, { timeout });
};

/**
 * Wait for an element to disappear and assert its absence
 * @param {Function} getElement - Function that returns the element
 * @param {Object} [options] - Wait options
 * @param {number} [options.timeout=5000] - Timeout in milliseconds
 */
export const expectElementToDisappear = async (getElement, options = {}) => {
  const { timeout = 5000 } = options;
  
  await waitFor(() => {
    const element = getElement();
    expect(element).not.toBeInTheDocument();
  }, { timeout });
};

/**
 * Wait for a condition to be true and assert it
 * @param {Function} condition - Function that returns a boolean
 * @param {string} [message] - Custom error message
 * @param {Object} [options] - Wait options
 * @param {number} [options.timeout=5000] - Timeout in milliseconds
 */
export const expectConditionToBecomeTrue = async (condition, message, options = {}) => {
  const { timeout = 5000 } = options;
  
  await waitFor(() => {
    const result = condition();
    expect(result).toBe(true);
  }, { timeout });
};

// =============================================================================
// MOCK ASSERTION HELPERS
// =============================================================================

/**
 * Assert that a mock function was called with specific arguments
 * @param {jest.MockedFunction} mockFn - Mock function to check
 * @param {Array} expectedArgs - Expected arguments
 * @param {number} [callIndex=0] - Which call to check (0-based)
 */
export const expectMockCalledWith = (mockFn, expectedArgs, callIndex = 0) => {
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn.mock.calls[callIndex]).toEqual(expectedArgs);
};

/**
 * Assert that a mock function was called a specific number of times
 * @param {jest.MockedFunction} mockFn - Mock function to check
 * @param {number} expectedCalls - Expected number of calls
 */
export const expectMockCallCount = (mockFn, expectedCalls) => {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls);
};

/**
 * Assert that multiple mock functions were called in a specific order
 * @param {jest.MockedFunction[]} mockFns - Array of mock functions
 */
export const expectMocksCalledInOrder = (mockFns) => {
  const allCalls = [];
  
  mockFns.forEach((mockFn, index) => {
    if (mockFn.mock && mockFn.mock.invocationCallOrder) {
      mockFn.mock.invocationCallOrder.forEach(callOrder => {
        allCalls.push({ mockIndex: index, callOrder });
      });
    }
  });
  
  // Sort by call order
  allCalls.sort((a, b) => a.callOrder - b.callOrder);
  
  // Verify the order matches the expected sequence
  let expectedMockIndex = 0;
  allCalls.forEach(call => {
    if (call.mockIndex < expectedMockIndex) {
      throw new Error(`Mock functions were not called in the expected order`);
    }
    expectedMockIndex = call.mockIndex;
  });
};

// =============================================================================
// ADDITIONAL UTILITY ASSERTIONS
// =============================================================================

/**
 * Assert that a component renders without crashing
 * @param {React.ComponentType} Component - Component to test
 * @param {Object} [props={}] - Props to pass to component
 */
export const expectComponentToRender = (Component, props = {}) => {
  expect(() => {
    const { render } = require('@testing-library/react');
    render(<Component {...props} />);
  }).not.toThrow();
};

/**
 * Assert that a hook returns expected values
 * @param {Function} hook - Hook function to test
 * @param {Array} expectedValues - Expected return values
 * @param {Array} [args=[]] - Arguments to pass to hook
 */
export const expectHookToReturn = (hook, expectedValues, args = []) => {
  const { renderHook } = require('@testing-library/react');
  const { result } = renderHook(() => hook(...args));
  
  if (Array.isArray(expectedValues)) {
    expectedValues.forEach((expectedValue, index) => {
      expect(result.current[index]).toEqual(expectedValue);
    });
  } else {
    expect(result.current).toEqual(expectedValues);
  }
};

/**
 * Assert that a URL is valid
 * @param {string} url - URL to validate
 */
export const expectValidUrl = (url) => {
  expect(() => new URL(url)).not.toThrow();
  expect(url).toMatch(/^https?:\/\/.+/);
};

/**
 * Assert that a color value is valid (hex, rgb, rgba, hsl, etc.)
 * @param {string} color - Color value to validate
 */
export const expectValidColor = (color) => {
  const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\)|[a-zA-Z]+)$/;
  expect(color).toMatch(colorRegex);
};

/**
 * Assert that a component has proper accessibility attributes
 * @param {HTMLElement} element - Element to check
 * @param {Object} [options={}] - Accessibility options
 */
export const expectAccessibleElement = (element, options = {}) => {
  const { 
    hasRole = false, 
    hasLabel = false, 
    hasDescription = false,
    isFocusable = false 
  } = options;
  
  if (hasRole) {
    expect(element).toHaveAttribute('role');
  }
  
  if (hasLabel) {
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasLabel = element.closest('label') !== null;
    
    expect(hasAriaLabel || hasAriaLabelledBy || hasLabel).toBe(true);
  }
  
  if (hasDescription) {
    expect(element).toHaveAttribute('aria-describedby');
  }
  
  if (isFocusable) {
    const tabIndex = element.getAttribute('tabindex');
    const isFocusableElement = ['input', 'button', 'select', 'textarea', 'a'].includes(
      element.tagName.toLowerCase()
    );
    
    expect(isFocusableElement || tabIndex === '0').toBe(true);
  }
};

/**
 * Assert that a component follows responsive design patterns
 * @param {HTMLElement} element - Element to check
 */
export const expectResponsiveElement = (element) => {
  const computedStyle = window.getComputedStyle(element);
  
  // Check for responsive units (%, vw, vh, em, rem)
  const responsiveUnits = /%|vw|vh|em|rem/;
  const hasResponsiveWidth = responsiveUnits.test(computedStyle.width);
  const hasResponsiveHeight = responsiveUnits.test(computedStyle.height);
  const hasResponsiveFontSize = responsiveUnits.test(computedStyle.fontSize);
  
  expect(
    hasResponsiveWidth || hasResponsiveHeight || hasResponsiveFontSize
  ).toBe(true);
};

// =============================================================================
// IMPORTS
// =============================================================================

// Import required testing library functions
import { screen, within, waitFor } from '@testing-library/react';

// =============================================================================
// EXPORTS
// =============================================================================

export default {
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
};