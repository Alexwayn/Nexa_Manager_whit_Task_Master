/**
 * Test Data Factories Tests
 * Validates that all factory functions work correctly and produce consistent data
 */

import {
  // User and Auth
  createMockUser,
  createMockOrganization,
  createAuthenticatedState,
  createUnauthenticatedState,
  createLoadingState,
  
  // Business Entities
  createMockClient,
  createMockClients,
  createMockInvoice,
  createMockInvoices,
  createMockInvoiceItem,
  createMockPayment,
  createMockProduct,
  createMockDocument,
  createMockCalendarEvent,
  
  // Email
  createMockEmail,
  createMockEmailAddress,
  createMockEmailRecipients,
  createMockEmailAttachment,
  createMockEmailTemplate,
  
  // Scanner
  createMockProcessedDocument,
  createMockOCRResult,
  
  // Analytics
  createMockAnalyticsMetrics,
  createMockTrendData,
  
  // API
  createMockApiResponse,
  createMockApiError,
  createMockPaginatedResponse,
  
  // Forms
  createMockFormState,
  createMockFormStateWithErrors,
  
  // Utilities
  createMultiple,
  createWithRelations,
  resetTestDataSeed,
  generateTestId,
  generateTimestamp,
} from './testDataFactories';

describe('Test Data Factories', () => {
  beforeEach(() => {
    // Reset seed for consistent test results
    resetTestDataSeed(12345);
  });

  describe('Utility Functions', () => {
    test('generateTestId should create unique IDs', () => {
      const id1 = generateTestId('test');
      const id2 = generateTestId('test');
      
      expect(id1).toMatch(/^test_[a-f0-9-]{36}$/);
      expect(id2).toMatch(/^test_[a-f0-9-]{36}$/);
      expect(id1).not.toBe(id2);
    });

    test('generateTimestamp should create valid ISO timestamps', () => {
      const timestamp = generateTimestamp(0);
      const pastTimestamp = generateTimestamp(5);
      
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
      expect(new Date(pastTimestamp).getTime()).toBeLessThan(new Date(timestamp).getTime());
    });

    test('resetTestDataSeed should make data reproducible', () => {
      resetTestDataSeed(999);
      const user1 = createMockUser();
      
      resetTestDataSeed(999);
      const user2 = createMockUser();
      
      expect(user1.first_name).toBe(user2.first_name);
      expect(user1.email).toBe(user2.email);
    });
  });

  describe('User and Auth Factories', () => {
    test('createMockUser should create valid user object', () => {
      const user = createMockUser();
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('role', 'user');
      expect(user).toHaveProperty('is_active', true);
      expect(user).toHaveProperty('preferences');
      expect(user.preferences).toHaveProperty('theme');
      expect(user.preferences).toHaveProperty('notifications');
      
      // Validate email format
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('createMockUser should accept overrides', () => {
      const user = createMockUser({
        first_name: 'John',
        role: 'admin',
        preferences: { theme: 'dark' }
      });
      
      expect(user.first_name).toBe('John');
      expect(user.role).toBe('admin');
      expect(user.preferences.theme).toBe('dark');
      // Should still have other default properties
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('is_active', true);
    });

    test('createMockOrganization should create valid organization', () => {
      const org = createMockOrganization();
      
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('slug');
      expect(org).toHaveProperty('created_at');
      expect(org).toHaveProperty('updated_at');
      
      expect(org.slug).toMatch(/^[a-z0-9-]+$/);
    });

    test('createAuthenticatedState should create valid auth state', () => {
      const state = createAuthenticatedState({ first_name: 'Test User' });
      
      expect(state.isLoaded).toBe(true);
      expect(state.isSignedIn).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.organization).toBeTruthy();
      expect(state.user.first_name).toBe('Test User');
    });

    test('createUnauthenticatedState should create valid unauth state', () => {
      const state = createUnauthenticatedState();
      
      expect(state.isLoaded).toBe(true);
      expect(state.isSignedIn).toBe(false);
      expect(state.user).toBeNull();
      expect(state.organization).toBeNull();
    });

    test('createLoadingState should create valid loading state', () => {
      const state = createLoadingState();
      
      expect(state.isLoaded).toBe(false);
      expect(state.isSignedIn).toBe(false);
      expect(state.user).toBeNull();
      expect(state.organization).toBeNull();
    });
  });

  describe('Client Factories', () => {
    test('createMockClient should create valid client', () => {
      const client = createMockClient();
      
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('email');
      expect(client).toHaveProperty('status', 'active');
      expect(client).toHaveProperty('tags');
      expect(Array.isArray(client.tags)).toBe(true);
      
      expect(client.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('createMockClients should create multiple clients', () => {
      const clients = createMockClients(3);
      
      expect(clients).toHaveLength(3);
      expect(clients[0]).toHaveProperty('id');
      expect(clients[1]).toHaveProperty('id');
      expect(clients[2]).toHaveProperty('id');
      
      // Should have unique IDs
      const ids = clients.map(c => c.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('Invoice Factories', () => {
    test('createMockInvoiceItem should create valid item', () => {
      const item = createMockInvoiceItem();
      
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('unit_price');
      expect(item).toHaveProperty('total');
      
      expect(typeof item.quantity).toBe('number');
      expect(typeof item.unit_price).toBe('number');
      expect(item.total).toBe(item.quantity * item.unit_price);
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
      
      expect(Array.isArray(invoice.items)).toBe(true);
      expect(invoice.items.length).toBeGreaterThan(0);
      expect(invoice.total_amount).toBe(invoice.amount + invoice.tax_amount);
    });

    test('createMockInvoices should create multiple invoices', () => {
      const invoices = createMockInvoices(2);
      
      expect(invoices).toHaveLength(2);
      expect(invoices[0].invoice_number).toBe('INV-000001');
      expect(invoices[1].invoice_number).toBe('INV-000002');
    });
  });

  describe('Payment Factories', () => {
    test('createMockPayment should create valid payment', () => {
      const payment = createMockPayment();
      
      expect(payment).toHaveProperty('id');
      expect(payment).toHaveProperty('invoice_id');
      expect(payment).toHaveProperty('amount');
      expect(payment).toHaveProperty('currency', 'EUR');
      expect(payment).toHaveProperty('method');
      expect(payment).toHaveProperty('status', 'completed');
      
      expect(typeof payment.amount).toBe('number');
      expect(['cash', 'check', 'bank_transfer', 'credit_card', 'paypal']).toContain(payment.method);
    });
  });

  describe('Product Factories', () => {
    test('createMockProduct should create valid product', () => {
      const product = createMockProduct();
      
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('currency', 'EUR');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('is_active', true);
      expect(product).toHaveProperty('tax_rate', 0.21);
      
      expect(typeof product.price).toBe('number');
      expect(product.sku).toMatch(/^[A-Z0-9]{8}$/);
    });
  });

  describe('Document Factories', () => {
    test('createMockDocument should create valid document', () => {
      const document = createMockDocument();
      
      expect(document).toHaveProperty('id');
      expect(document).toHaveProperty('name');
      expect(document).toHaveProperty('file_path');
      expect(document).toHaveProperty('file_size');
      expect(document).toHaveProperty('mime_type', 'application/pdf');
      expect(document).toHaveProperty('category');
      expect(document).toHaveProperty('tags');
      expect(document).toHaveProperty('is_public', false);
      
      expect(Array.isArray(document.tags)).toBe(true);
      expect(typeof document.file_size).toBe('number');
      expect(['invoice', 'receipt', 'contract', 'other']).toContain(document.category);
    });
  });

  describe('Calendar Event Factories', () => {
    test('createMockCalendarEvent should create valid event', () => {
      const event = createMockCalendarEvent();
      
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('start_time');
      expect(event).toHaveProperty('end_time');
      expect(event).toHaveProperty('all_day', false);
      expect(event).toHaveProperty('status', 'scheduled');
      expect(event).toHaveProperty('attendees');
      expect(event).toHaveProperty('reminder_minutes', 15);
      
      expect(Array.isArray(event.attendees)).toBe(true);
      expect(new Date(event.start_time).getTime()).toBeLessThan(new Date(event.end_time).getTime());
    });
  });

  describe('Email Factories', () => {
    test('createMockEmailAddress should create valid email address', () => {
      const emailAddr = createMockEmailAddress();
      
      expect(emailAddr).toHaveProperty('name');
      expect(emailAddr).toHaveProperty('email');
      expect(emailAddr.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('createMockEmailRecipients should create valid recipients', () => {
      const recipients = createMockEmailRecipients();
      
      expect(recipients).toHaveProperty('to');
      expect(recipients).toHaveProperty('cc');
      expect(recipients).toHaveProperty('bcc');
      expect(Array.isArray(recipients.to)).toBe(true);
      expect(recipients.to.length).toBeGreaterThan(0);
    });

    test('createMockEmailAttachment should create valid attachment', () => {
      const attachment = createMockEmailAttachment();
      
      expect(attachment).toHaveProperty('id');
      expect(attachment).toHaveProperty('filename');
      expect(attachment).toHaveProperty('content_type');
      expect(attachment).toHaveProperty('size_bytes');
      expect(attachment).toHaveProperty('is_inline', false);
      
      expect(typeof attachment.size_bytes).toBe('number');
      expect(['application/pdf', 'image/jpeg', 'text/plain']).toContain(attachment.content_type);
    });

    test('createMockEmail should create valid email', () => {
      const email = createMockEmail();
      
      expect(email).toHaveProperty('id');
      expect(email).toHaveProperty('message_id');
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('sender_name');
      expect(email).toHaveProperty('sender_email');
      expect(email).toHaveProperty('recipients');
      expect(email).toHaveProperty('content_text');
      expect(email).toHaveProperty('attachments');
      expect(email).toHaveProperty('labels');
      expect(email).toHaveProperty('is_read', false);
      expect(email).toHaveProperty('is_starred', false);
      expect(email).toHaveProperty('is_draft', false);
      
      expect(Array.isArray(email.attachments)).toBe(true);
      expect(Array.isArray(email.labels)).toBe(true);
      expect(email.sender_email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('createMockEmailTemplate should create valid template', () => {
      const template = createMockEmailTemplate();
      
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('content_text');
      expect(template).toHaveProperty('variables');
      expect(template).toHaveProperty('is_system', false);
      
      expect(Array.isArray(template.variables)).toBe(true);
      expect(['invoice', 'quote', 'reminder', 'welcome']).toContain(template.category);
    });
  });

  describe('Scanner Factories', () => {
    test('createMockProcessedDocument should create valid processed document', () => {
      const doc = createMockProcessedDocument();
      
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('category');
      expect(doc).toHaveProperty('tags');
      expect(doc).toHaveProperty('originalFile');
      expect(doc).toHaveProperty('enhancedFile');
      expect(doc).toHaveProperty('textContent');
      expect(doc).toHaveProperty('ocrConfidence');
      expect(doc).toHaveProperty('status', 'complete');
      expect(doc).toHaveProperty('sharingSettings');
      
      expect(Array.isArray(doc.tags)).toBe(true);
      expect(typeof doc.ocrConfidence).toBe('number');
      expect(doc.ocrConfidence).toBeGreaterThanOrEqual(0.7);
      expect(doc.ocrConfidence).toBeLessThanOrEqual(1.0);
      expect(['invoice', 'receipt', 'contract', 'other']).toContain(doc.category);
    });

    test('createMockOCRResult should create valid OCR result', () => {
      const result = createMockOCRResult();
      
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('provider', 'openai');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('blocks');
      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('error', null);
      
      expect(Array.isArray(result.blocks)).toBe(true);
      expect(Array.isArray(result.tables)).toBe(true);
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.processingTime).toBe('number');
    });
  });

  describe('Analytics Factories', () => {
    test('createMockAnalyticsMetrics should create valid metrics', () => {
      const metrics = createMockAnalyticsMetrics();
      
      expect(metrics).toHaveProperty('revenue');
      expect(metrics).toHaveProperty('clients');
      expect(metrics).toHaveProperty('invoices');
      expect(metrics).toHaveProperty('payments');
      
      expect(metrics.revenue).toHaveProperty('total');
      expect(metrics.revenue).toHaveProperty('monthly');
      expect(metrics.revenue).toHaveProperty('growth');
      
      expect(metrics.clients).toHaveProperty('total');
      expect(metrics.clients).toHaveProperty('active');
      expect(metrics.clients).toHaveProperty('new');
      
      expect(typeof metrics.revenue.total).toBe('number');
      expect(typeof metrics.clients.total).toBe('number');
    });

    test('createMockTrendData should create valid trend data', () => {
      const trendData = createMockTrendData(6);
      
      expect(trendData).toHaveLength(6);
      expect(trendData[0]).toHaveProperty('date');
      expect(trendData[0]).toHaveProperty('value');
      expect(trendData[0]).toHaveProperty('label');
      
      expect(typeof trendData[0].value).toBe('number');
      expect(trendData[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('API Response Factories', () => {
    test('createMockApiResponse should create valid success response', () => {
      const data = { id: 1, name: 'Test' };
      const response = createMockApiResponse(data);
      
      expect(response).toHaveProperty('data', data);
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('meta');
      
      expect(response.meta).toHaveProperty('total');
      expect(response.meta).toHaveProperty('page', 1);
      expect(response.meta).toHaveProperty('limit', 10);
    });

    test('createMockApiError should create valid error response', () => {
      const error = createMockApiError();
      
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode', 400);
      expect(error).toHaveProperty('details');
      
      expect(typeof error.message).toBe('string');
    });

    test('createMockPaginatedResponse should create valid paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const response = createMockPaginatedResponse(data);
      
      expect(response).toHaveProperty('data', data);
      expect(response).toHaveProperty('pagination');
      
      expect(response.pagination).toHaveProperty('page', 1);
      expect(response.pagination).toHaveProperty('limit', 10);
      expect(response.pagination).toHaveProperty('total', 3);
      expect(response.pagination).toHaveProperty('totalPages', 1);
      expect(response.pagination).toHaveProperty('hasNext', false);
      expect(response.pagination).toHaveProperty('hasPrev', false);
    });
  });

  describe('Form State Factories', () => {
    test('createMockFormState should create valid form state', () => {
      const data = { name: 'Test', email: 'test@example.com' };
      const formState = createMockFormState(data);
      
      expect(formState).toHaveProperty('data', data);
      expect(formState).toHaveProperty('errors', {});
      expect(formState).toHaveProperty('isSubmitting', false);
      expect(formState).toHaveProperty('isValid', true);
      expect(formState).toHaveProperty('isDirty', false);
    });

    test('createMockFormStateWithErrors should create form state with errors', () => {
      const data = { name: '', email: 'invalid' };
      const errors = { name: 'Name is required', email: 'Invalid email' };
      const formState = createMockFormStateWithErrors(data, errors);
      
      expect(formState).toHaveProperty('data', data);
      expect(formState).toHaveProperty('errors', errors);
      expect(formState).toHaveProperty('isSubmitting', false);
      expect(formState).toHaveProperty('isValid', false);
      expect(formState).toHaveProperty('isDirty', true);
    });
  });

  describe('Utility Factory Functions', () => {
    test('createMultiple should create multiple instances', () => {
      const users = createMultiple(createMockUser, 3, { role: 'admin' });
      
      expect(users).toHaveLength(3);
      expect(users[0].role).toBe('admin');
      expect(users[1].role).toBe('admin');
      expect(users[2].role).toBe('admin');
      
      // Should have unique IDs
      const ids = users.map(u => u.id);
      expect(new Set(ids).size).toBe(3);
    });

    test('createWithRelations should create object with relations', () => {
      const invoice = createWithRelations(createMockInvoice, {
        client: () => createMockClient({ name: 'Related Client' }),
        payments: () => [createMockPayment(), createMockPayment()]
      });
      
      expect(invoice).toHaveProperty('client');
      expect(invoice).toHaveProperty('payments');
      expect(invoice.client.name).toBe('Related Client');
      expect(Array.isArray(invoice.payments)).toBe(true);
      expect(invoice.payments).toHaveLength(2);
    });
  });

  describe('Factory Consistency', () => {
    test('factories should produce consistent data with same seed', () => {
      resetTestDataSeed(555);
      const user1 = createMockUser();
      const client1 = createMockClient();
      
      resetTestDataSeed(555);
      const user2 = createMockUser();
      const client2 = createMockClient();
      
      expect(user1.first_name).toBe(user2.first_name);
      expect(user1.email).toBe(user2.email);
      expect(client1.name).toBe(client2.name);
      expect(client1.email).toBe(client2.email);
    });

    test('factories should produce different data with different seeds', () => {
      resetTestDataSeed(111);
      const user1 = createMockUser();
      
      resetTestDataSeed(222);
      const user2 = createMockUser();
      
      expect(user1.first_name).not.toBe(user2.first_name);
      expect(user1.email).not.toBe(user2.email);
    });
  });

  describe('Data Validation', () => {
    test('all factories should produce objects with required fields', () => {
      const factories = [
        createMockUser,
        createMockClient,
        createMockInvoice,
        createMockPayment,
        createMockProduct,
        createMockDocument,
        createMockCalendarEvent,
        createMockEmail,
        createMockProcessedDocument,
        createMockOCRResult,
      ];

      factories.forEach(factory => {
        const result = factory();
        expect(result).toHaveProperty('id');
        expect(typeof result.id).toBe('string');
        expect(result.id.length).toBeGreaterThan(0);
      });
    });

    test('timestamp fields should be valid ISO strings', () => {
      const user = createMockUser();
      const client = createMockClient();
      const invoice = createMockInvoice();
      
      expect(() => new Date(user.created_at)).not.toThrow();
      expect(() => new Date(client.updated_at)).not.toThrow();
      expect(() => new Date(invoice.due_date)).not.toThrow();
      
      expect(new Date(user.created_at).toISOString()).toBe(user.created_at);
      expect(new Date(client.updated_at).toISOString()).toBe(client.updated_at);
      expect(new Date(invoice.due_date).toISOString()).toBe(invoice.due_date);
    });

    test('email fields should be valid email addresses', () => {
      const user = createMockUser();
      const client = createMockClient();
      const email = createMockEmail();
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(user.email).toMatch(emailRegex);
      expect(client.email).toMatch(emailRegex);
      expect(email.sender_email).toMatch(emailRegex);
    });
  });
});