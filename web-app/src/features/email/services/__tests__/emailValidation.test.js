import EmailManagementService from '../emailManagementService';

// Create a service instance and adapters to match expected boolean returns in tests
const emailService = new EmailManagementService();
const validateEmailData = (data) => {
  const result = emailService.validateEmailData(data);
  if (typeof result === 'boolean') return result;
  return !!(result && result.isValid);
};
const isValidEmail = (email) => emailService.isValidEmail(email);

describe('Email Validation', () => {
  describe('isValidEmail', () => {
    test('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test123+tag@example.org',
        'user+filter@company.com',
        'firstname.lastname@example.com',
        'test-email@domain-name.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    test('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        'test@',
        '@example.com',
        'test..email@example.com',
        '',
        null,
        undefined,
        'test@example',
        'test@.com',
        '.test@example.com',
        'test.@example.com',
        'test@example.',
        'test email@example.com',
        'test@exam ple.com',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    test('handles edge cases', () => {
      expect(isValidEmail('a@b.co')).toBe(true); // Minimal valid email
      expect(isValidEmail('very.long.email.address@very.long.domain.name.com')).toBe(true);
      expect(isValidEmail('test@123.456.789.012')).toBe(false); // Invalid IP format
      expect(isValidEmail('test@[IPv6:2001:db8::1]')).toBe(false); // IPv6 not supported by basic regex
    });
  });

  describe('validateEmailData', () => {
    test('validates complete email data object', () => {
      const validEmailData = {
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: 'Test email body content',
      };

      expect(validateEmailData(validEmailData)).toBe(true);
    });

    test('validates email data with optional fields', () => {
      const emailDataWithOptionals = {
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: 'Test email body content',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        attachments: [],
      };

      expect(validateEmailData(emailDataWithOptionals)).toBe(true);
    });

    test('rejects email data with invalid to address', () => {
      const invalidEmailData = {
        to: 'invalid-email',
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: 'Test email body content',
      };

      expect(validateEmailData(invalidEmailData)).toBe(false);
    });

    test('rejects email data with invalid from address', () => {
      const invalidEmailData = {
        to: 'recipient@example.com',
        from: 'invalid-sender',
        subject: 'Test Subject',
        body: 'Test email body content',
      };

      expect(validateEmailData(invalidEmailData)).toBe(false);
    });

    test('rejects email data with missing required fields', () => {
      const missingToField = {
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: 'Test email body content',
      };

      const missingFromField = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test email body content',
      };

      const missingSubject = {
        to: 'recipient@example.com',
        from: 'sender@example.com',
        body: 'Test email body content',
      };

      expect(validateEmailData(missingToField)).toBe(false);
      expect(validateEmailData(missingFromField)).toBe(false);
      expect(validateEmailData(missingSubject)).toBe(false);
    });

    test('handles empty or null input', () => {
      expect(validateEmailData(null)).toBe(false);
      expect(validateEmailData(undefined)).toBe(false);
      expect(validateEmailData({})).toBe(false);
    });

    test('validates multiple recipients in to field', () => {
      const multipleRecipients = {
        to: 'recipient1@example.com,recipient2@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: 'Test email body content',
      };

      // Assuming validateEmailData supports comma-separated emails
      expect(validateEmailData(multipleRecipients)).toBe(true);
    });

    test('rejects email data with one invalid recipient among valid ones', () => {
      const mixedRecipients = {
        to: 'valid@example.com,invalid-email,another@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: 'Test email body content',
      };

      expect(validateEmailData(mixedRecipients)).toBe(false);
    });

    test('validates email data with empty body', () => {
      const emptyBodyEmail = {
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: '',
      };

      // Assuming empty body is allowed
      expect(validateEmailData(emptyBodyEmail)).toBe(true);
    });

    test('validates email data with HTML content in body', () => {
      const htmlBodyEmail = {
        to: 'recipient@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        body: '<p>HTML <strong>content</strong> in email</p>',
      };

      expect(validateEmailData(htmlBodyEmail)).toBe(true);
    });
  });
});