/**
 * Simple Test Data Factories Validation
 * A standalone test that can be run without complex Jest configuration
 */

// Simple test runner
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to be ${expected}`);
    }
  },
  toMatch: (regex) => {
    if (!regex.test(actual)) {
      throw new Error(`Expected ${actual} to match ${regex}`);
    }
  },
  toHaveProperty: (prop, value) => {
    if (!(prop in actual)) {
      throw new Error(`Expected object to have property ${prop}`);
    }
    if (value !== undefined && actual[prop] !== value) {
      throw new Error(`Expected ${prop} to be ${value}, got ${actual[prop]}`);
    }
  },
  toHaveLength: (length) => {
    if (actual.length !== length) {
      throw new Error(`Expected length ${length}, got ${actual.length}`);
    }
  },
  toBeGreaterThan: (value) => {
    if (actual <= value) {
      throw new Error(`Expected ${actual} to be greater than ${value}`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected ${actual} to be truthy`);
    }
  },
  toBeNull: () => {
    if (actual !== null) {
      throw new Error(`Expected ${actual} to be null`);
    }
  }
});

// Import the factories
import {
  createMockUser,
  createMockClient,
  createMockInvoice,
  createMockEmail,
  createMockApiResponse,
  createAuthenticatedState,
  createUnauthenticatedState,
  resetTestDataSeed,
  generateTestId,
  generateTimestamp,
} from './testDataFactories.js';

// Test cases
test('generateTestId should create valid IDs', () => {
  const id1 = generateTestId('test');
  const id2 = generateTestId('test');
  
  expect(id1).toMatch(/^test_[a-f0-9-]{36}$/);
  expect(id2).toMatch(/^test_[a-f0-9-]{36}$/);
  
  if (id1 === id2) {
    throw new Error('IDs should be unique');
  }
});

test('generateTimestamp should create valid ISO timestamps', () => {
  const timestamp = generateTimestamp(0);
  const pastTimestamp = generateTimestamp(5);
  
  // Should be valid ISO string
  const date = new Date(timestamp);
  if (date.toISOString() !== timestamp) {
    throw new Error('Should create valid ISO timestamp');
  }
  
  // Past timestamp should be earlier
  if (new Date(pastTimestamp) >= new Date(timestamp)) {
    throw new Error('Past timestamp should be earlier');
  }
});

test('createMockUser should create valid user', () => {
  const user = createMockUser();
  
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('first_name');
  expect(user).toHaveProperty('last_name');
  expect(user).toHaveProperty('role', 'user');
  expect(user).toHaveProperty('is_active', true);
  expect(user).toHaveProperty('preferences');
  
  // Validate email format
  expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});

test('createMockUser should accept overrides', () => {
  const user = createMockUser({
    first_name: 'John',
    role: 'admin'
  });
  
  expect(user).toHaveProperty('first_name', 'John');
  expect(user).toHaveProperty('role', 'admin');
  expect(user).toHaveProperty('email'); // Should still have default properties
});

test('createMockClient should create valid client', () => {
  const client = createMockClient();
  
  expect(client).toHaveProperty('id');
  expect(client).toHaveProperty('name');
  expect(client).toHaveProperty('email');
  expect(client).toHaveProperty('status', 'active');
  expect(client).toHaveProperty('tags');
  
  if (!Array.isArray(client.tags)) {
    throw new Error('Tags should be an array');
  }
  
  expect(client.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});

test('createMockInvoice should create valid invoice', () => {
  const invoice = createMockInvoice();
  
  expect(invoice).toHaveProperty('id');
  expect(invoice).toHaveProperty('invoice_number');
  expect(invoice).toHaveProperty('client_id');
  expect(invoice).toHaveProperty('amount');
  expect(invoice).toHaveProperty('tax_amount');
  expect(invoice).toHaveProperty('total_amount');
  expect(invoice).toHaveProperty('currency', 'EUR');
  expect(invoice).toHaveProperty('status', 'sent');
  expect(invoice).toHaveProperty('items');
  
  if (!Array.isArray(invoice.items)) {
    throw new Error('Items should be an array');
  }
  
  if (invoice.items.length === 0) {
    throw new Error('Invoice should have at least one item');
  }
  
  // Check calculation
  const expectedTotal = invoice.amount + invoice.tax_amount;
  if (Math.abs(invoice.total_amount - expectedTotal) > 0.01) {
    throw new Error(`Total amount calculation incorrect: ${invoice.total_amount} !== ${expectedTotal}`);
  }
});

test('createMockEmail should create valid email', () => {
  const email = createMockEmail();
  
  expect(email).toHaveProperty('id');
  expect(email).toHaveProperty('subject');
  expect(email).toHaveProperty('sender_email');
  expect(email).toHaveProperty('recipients');
  expect(email).toHaveProperty('content_text');
  expect(email).toHaveProperty('is_read', false);
  expect(email).toHaveProperty('is_starred', false);
  
  expect(email.sender_email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  
  if (!email.recipients || !Array.isArray(email.recipients.to)) {
    throw new Error('Recipients should have a "to" array');
  }
});

test('createMockApiResponse should create valid API response', () => {
  const data = { id: 1, name: 'Test' };
  const response = createMockApiResponse(data);
  
  expect(response).toHaveProperty('data', data);
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('message');
  expect(response).toHaveProperty('meta');
  
  expect(response.meta).toHaveProperty('total');
  expect(response.meta).toHaveProperty('page', 1);
});

test('createAuthenticatedState should create valid auth state', () => {
  const state = createAuthenticatedState({ first_name: 'Test User' });
  
  expect(state).toHaveProperty('isLoaded', true);
  expect(state).toHaveProperty('isSignedIn', true);
  expect(state).toHaveProperty('user');
  expect(state).toHaveProperty('organization');
  
  expect(state.user).toBeTruthy();
  expect(state.organization).toBeTruthy();
  expect(state.user).toHaveProperty('first_name', 'Test User');
});

test('createUnauthenticatedState should create valid unauth state', () => {
  const state = createUnauthenticatedState();
  
  expect(state).toHaveProperty('isLoaded', true);
  expect(state).toHaveProperty('isSignedIn', false);
  expect(state.user).toBeNull();
  expect(state.organization).toBeNull();
});

test('resetTestDataSeed should make data reproducible', () => {
  resetTestDataSeed(999);
  const user1 = createMockUser();
  
  resetTestDataSeed(999);
  const user2 = createMockUser();
  
  expect(user1).toHaveProperty('first_name', user2.first_name);
  expect(user1).toHaveProperty('email', user2.email);
});

// Run tests
async function runTests() {
  console.log('🧪 Running Test Data Factories validation...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Test data factories are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Export for potential use in other contexts
export { runTests };

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}