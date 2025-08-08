/**
 * Test Utilities Index
 * Central export point for all test utilities
 */

// Core test utilities
export * from './testHelpers';
export * from './testWrappers';
export * from './assertionHelpers';
export * from './testDataFactories';

// Default exports with aliases for convenience
export { default as testHelpers } from './testHelpers';
export { default as assertionHelpers } from './assertionHelpers';
export { default as testDataFactories } from './testDataFactories';
export { default as testWrappers } from './testWrappers';

// Commonly used utilities (re-exported for convenience)
export {
  customRender,
  renderWithProviders,
  renderWithAllProviders,
  renderWithMinimalProviders,
  renderWithTheme,
  renderWithUI,
} from './testWrappers';

export {
  createMockUser,
  createMockClient,
  createMockInvoice,
  createMockApiResponse,
  createMockApiError,
  createAuthenticatedState,
  createUnauthenticatedState,
} from './testDataFactories';

export {
  expectToHaveClasses,
  expectToBeVisible,
  expectToHaveText,
  expectFieldValue,
  expectLoadingState,
  expectErrorMessage,
  expectApiResponse,
  expectValidClient,
  expectElementToAppear,
  expectMockCalledWith,
} from './assertionHelpers';

export {
  waitForAsync,
  mockConsole,
  createMockFunction,
  createMockAsyncFunction,
  mockLocalStorage,
  mockSessionStorage,
  mockFetch,
  createMockFile,
  waitForNextTick,
  flushPromises,
} from './testHelpers';