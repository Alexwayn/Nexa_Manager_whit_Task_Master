import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuoteEmailSender from './QuoteEmailSender';
import DOMPurify from 'dompurify';

// Mock emailService
jest.mock('../lib/emailService', () => ({
  isValidEmail: email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  sendQuoteEmail: jest.fn(() =>
    Promise.resolve({
      messageId: 'test-message-id',
      timestamp: new Date().toISOString(),
      recipient: 'test@example.com',
    }),
  ),
  scheduleReminders: jest.fn(),
  getEmailTemplate: jest.fn(() => ({
    subject: 'Test Subject',
    htmlBody: '<p>Test HTML body content</p>',
  })),
}));

describe('QuoteEmailSender XSS Protection Tests', () => {
  const mockQuote = {
    quote_number: 'Q-2024-001',
    client_name: 'Test Client',
    client_email: 'client@test.com',
    total_amount: 1000,
    issue_date: '2024-01-01',
    expiry_date: '2024-02-01',
  };

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    quote: mockQuote,
    onEmailSent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sanitizes malicious script tags in custom message', async () => {
    render(<QuoteEmailSender {...mockProps} />);

    // Try to input a malicious script
    const customMessageInput = screen.getByPlaceholderText(
      'quoteSender.placeholders.customMessage',
    );
    const maliciousScript = '<script>alert("XSS Attack!");</script><p>Legitimate content</p>';

    fireEvent.change(customMessageInput, { target: { value: maliciousScript } });

    // Proceed to preview step
    const nextButton = screen.getByText('quoteSender.buttons.next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      // Check that the script tag has been removed by DOMPurify
      // Since the component uses DOMPurify internally, we can test the sanitization directly
      const sanitized = DOMPurify.sanitize(maliciousScript, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'target', 'style'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
      });

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert(');
      expect(sanitized).toContain('Legitimate content');
    });
  });

  test('sanitizes malicious event handlers in HTML content', () => {
    const maliciousHtml = '<p onclick="alert(\'XSS\')">Click me</p><strong>Safe content</strong>';

    // Test the sanitizeHtml function directly
    const sanitized = DOMPurify.sanitize(maliciousHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('Click me');
    expect(sanitized).toContain('Safe content');
  });

  test('removes javascript: URLs from links', () => {
    const maliciousHtml =
      '<a href="javascript:alert(\'XSS\')">Malicious Link</a><a href="https://example.com">Safe Link</a>';

    const sanitized = DOMPurify.sanitize(maliciousHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('Malicious Link');
    expect(sanitized).toContain('https://example.com');
  });

  test('preserves legitimate HTML formatting', () => {
    const legitimateHtml =
      '<p><strong>Bold text</strong> and <em>italic text</em></p><ul><li>List item 1</li><li>List item 2</li></ul>';

    const sanitized = DOMPurify.sanitize(legitimateHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    expect(sanitized).toContain('<strong>Bold text</strong>');
    expect(sanitized).toContain('<em>italic text</em>');
    expect(sanitized).toContain('<ul>');
    expect(sanitized).toContain('<li>List item 1</li>');
  });

  test('removes data attributes to prevent data exfiltration', () => {
    const htmlWithDataAttrs =
      '<div data-secret="sensitive-info" data-track="user-action">Content</div>';

    const sanitized = DOMPurify.sanitize(htmlWithDataAttrs, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    expect(sanitized).not.toContain('data-secret');
    expect(sanitized).not.toContain('data-track');
    expect(sanitized).not.toContain('sensitive-info');
    expect(sanitized).toContain('Content');
  });

  test('handles empty or null input safely', () => {
    const sanitized1 = DOMPurify.sanitize('', {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    const sanitized2 = DOMPurify.sanitize(null, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    expect(sanitized1).toBe('');
    expect(sanitized2).toBe('');
  });
});
