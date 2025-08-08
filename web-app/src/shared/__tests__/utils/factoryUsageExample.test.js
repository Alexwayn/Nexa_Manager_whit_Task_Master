/**
 * Test Data Factories Usage Example
 * This file demonstrates how to use the test data factories in real tests
 */

import {
  createMockUser,
  createMockClient,
  createMockInvoice,
  createMockEmail,
  createMockApiResponse,
  createAuthenticatedState,
  createUnauthenticatedState,
  createMultiple,
  createWithRelations,
  resetTestDataSeed,
} from './testDataFactories';

describe('Test Data Factories Usage Examples', () => {
  beforeEach(() => {
    // Reset seed for consistent test data
    resetTestDataSeed(12345);
  });

  describe('Basic Factory Usage', () => {
    test('should create mock user for component testing', () => {
      // Create a basic user
      const user = createMockUser();
      
      // Verify it has the expected structure
      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        first_name: expect.any(String),
        last_name: expect.any(String),
        role: 'user',
        is_active: true,
        preferences: expect.any(Object),
      });
    });

    test('should create mock user with custom properties', () => {
      // Create a user with specific properties for testing
      const adminUser = createMockUser({
        first_name: 'John',
        last_name: 'Admin',
        role: 'admin',
        email: 'john.admin@company.com',
      });

      expect(adminUser.first_name).toBe('John');
      expect(adminUser.last_name).toBe('Admin');
      expect(adminUser.role).toBe('admin');
      expect(adminUser.email).toBe('john.admin@company.com');
      // Should still have default properties
      expect(adminUser.is_active).toBe(true);
      expect(adminUser.preferences).toBeDefined();
    });
  });

  describe('Business Entity Factories', () => {
    test('should create mock client for CRM testing', () => {
      const client = createMockClient({
        name: 'ACME Corporation',
        status: 'active',
        tags: ['enterprise', 'priority'],
      });

      expect(client.name).toBe('ACME Corporation');
      expect(client.status).toBe('active');
      expect(client.tags).toEqual(['enterprise', 'priority']);
      expect(client.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('should create mock invoice with calculated totals', () => {
      const invoice = createMockInvoice({
        invoice_number: 'INV-TEST-001',
        status: 'paid',
      });

      expect(invoice.invoice_number).toBe('INV-TEST-001');
      expect(invoice.status).toBe('paid');
      expect(invoice.total_amount).toBe(invoice.amount + invoice.tax_amount);
      expect(invoice.items).toHaveLength(expect.any(Number));
      expect(invoice.items.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication State Factories', () => {
    test('should create authenticated state for protected route testing', () => {
      const authState = createAuthenticatedState({
        first_name: 'Test',
        role: 'admin',
      });

      expect(authState.isLoaded).toBe(true);
      expect(authState.isSignedIn).toBe(true);
      expect(authState.user.first_name).toBe('Test');
      expect(authState.user.role).toBe('admin');
      expect(authState.organization).toBeDefined();
    });

    test('should create unauthenticated state for login testing', () => {
      const unauthState = createUnauthenticatedState();

      expect(unauthState.isLoaded).toBe(true);
      expect(unauthState.isSignedIn).toBe(false);
      expect(unauthState.user).toBeNull();
      expect(unauthState.organization).toBeNull();
    });
  });

  describe('API Response Factories', () => {
    test('should create mock API success response', () => {
      const userData = createMockUser({ first_name: 'API User' });
      const response = createMockApiResponse(userData, {
        message: 'User created successfully',
      });

      expect(response.success).toBe(true);
      expect(response.data.first_name).toBe('API User');
      expect(response.message).toBe('User created successfully');
      expect(response.meta).toBeDefined();
    });
  });

  describe('Advanced Factory Usage', () => {
    test('should create multiple entities with createMultiple', () => {
      const clients = createMultiple(createMockClient, 3, {
        status: 'active',
      });

      expect(clients).toHaveLength(3);
      clients.forEach(client => {
        expect(client.status).toBe('active');
        expect(client.id).toBeDefined();
      });

      // Should have unique IDs
      const ids = clients.map(c => c.id);
      expect(new Set(ids).size).toBe(3);
    });

    test('should create entities with relations using createWithRelations', () => {
      const invoiceWithRelations = createWithRelations(createMockInvoice, {
        client: () => createMockClient({ name: 'Related Client' }),
        payments: () => [
          { id: 'payment-1', amount: 500, status: 'completed' },
          { id: 'payment-2', amount: 300, status: 'pending' },
        ],
      });

      expect(invoiceWithRelations.client.name).toBe('Related Client');
      expect(invoiceWithRelations.payments).toHaveLength(2);
      expect(invoiceWithRelations.payments[0].amount).toBe(500);
      expect(invoiceWithRelations.payments[1].status).toBe('pending');
    });
  });

  describe('Email System Factories', () => {
    test('should create mock email for email service testing', () => {
      const email = createMockEmail({
        subject: 'Test Email Subject',
        sender_email: 'sender@test.com',
        is_read: true,
      });

      expect(email.subject).toBe('Test Email Subject');
      expect(email.sender_email).toBe('sender@test.com');
      expect(email.is_read).toBe(true);
      expect(email.recipients.to).toHaveLength(expect.any(Number));
    });
  });

  describe('Consistent Data Generation', () => {
    test('should generate consistent data with same seed', () => {
      resetTestDataSeed(999);
      const user1 = createMockUser();
      const client1 = createMockClient();

      resetTestDataSeed(999);
      const user2 = createMockUser();
      const client2 = createMockClient();

      expect(user1.first_name).toBe(user2.first_name);
      expect(user1.email).toBe(user2.email);
      expect(client1.name).toBe(client2.name);
      expect(client1.email).toBe(client2.email);
    });

    test('should generate different data with different seeds', () => {
      resetTestDataSeed(111);
      const user1 = createMockUser();

      resetTestDataSeed(222);
      const user2 = createMockUser();

      expect(user1.first_name).not.toBe(user2.first_name);
      expect(user1.email).not.toBe(user2.email);
    });
  });

  describe('Real-world Test Scenarios', () => {
    test('should test user profile component with mock data', () => {
      const user = createMockUser({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
      });

      // This would be used in a component test like:
      // render(<UserProfile user={user} />);
      // expect(screen.getByText('John Doe')).toBeInTheDocument();

      expect(user).toMatchObject({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
      });
    });

    test('should test invoice calculation logic with mock data', () => {
      const invoice = createMockInvoice({
        amount: 1000,
        tax_amount: 210, // 21% tax
      });

      // Test business logic
      const expectedTotal = invoice.amount + invoice.tax_amount;
      expect(invoice.total_amount).toBe(expectedTotal);

      // Test that items sum to amount
      const itemsTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      expect(itemsTotal).toBe(invoice.amount);
    });

    test('should test API service with mock responses', () => {
      const mockClient = createMockClient({ name: 'Test Client' });
      const mockResponse = createMockApiResponse(mockClient);

      // This would be used to mock an API service:
      // jest.spyOn(clientService, 'create').mockResolvedValue(mockResponse);

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.name).toBe('Test Client');
    });
  });
});