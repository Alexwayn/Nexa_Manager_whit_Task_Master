// Shared Test Utilities Public API
// This file exports shared testing utilities and mocks

// Test utilities
export { default as TestWrapper } from './utils/TestWrapper';
export { default as MockProviders } from './utils/MockProviders';
export { default as TestQueryClient } from './utils/TestQueryClient';

// Mock data and services
export * from './mocks';

// Test helpers
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user'
});

export const createMockClient = () => ({
  id: 'test-client-id',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+1234567890',
  status: 'active'
});

export const createMockInvoice = () => ({
  id: 'test-invoice-id',
  number: 'INV-001',
  clientId: 'test-client-id',
  amount: 1000,
  status: 'pending',
  dueDate: new Date().toISOString()
});

// Test constants
export const TEST_TIMEOUT = 10000;
export const MOCK_API_DELAY = 100;