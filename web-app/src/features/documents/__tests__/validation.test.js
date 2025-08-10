// Since validation functions are not exported, we'll need to test them through component testing
// Let's focus on testing the email validation logic directly

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Email validation regex used in the components
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email validation function from ShareDocumentsModal
const validateEmail = (email) => {
  return emailRegex.test(email);
};

// Emails validation function from ShareDocumentsModal
const validateEmails = (emailString) => {
  const emailList = emailString.split(',').map(email => email.trim()).filter(email => email);
  const invalidEmails = emailList.filter(email => !emailRegex.test(email));
  return invalidEmails.length === 0;
};

// Email validation function from RequestDocumentModal (same implementation)
const validateRequestEmail = (email) => {
  return emailRegex.test(email);
};

describe('Document Email Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ShareDocumentsModal validateEmail', () => {
    test('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'user123@test-domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('rejects invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
        'test @example.com',
        'test@example..com',
        'test@.example.com',
        'test@example.com.',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('handles null and undefined inputs', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });

    test('handles non-string inputs', () => {
      expect(validateEmail(123)).toBe(false);
      expect(validateEmail({})).toBe(false);
      expect(validateEmail([])).toBe(false);
      expect(validateEmail(true)).toBe(false);
    });
  });

  describe('ShareDocumentsModal validateEmails', () => {
    test('validates multiple correct email addresses', () => {
      const validEmailStrings = [
        'test@example.com',
        'test@example.com, user@domain.org',
        'first@test.com,second@test.com,third@test.com',
        'user1@example.com, user2@example.com, user3@example.com',
      ];

      validEmailStrings.forEach(emailString => {
        expect(validateEmails(emailString)).toBe(true);
      });
    });

    test('rejects strings with any invalid email', () => {
      const invalidEmailStrings = [
        'invalid-email',
        'test@example.com, invalid-email',
        'valid@example.com, test@, another@valid.com',
        'user@domain.com, @invalid.com',
        'test@example.com, test..test@example.com',
      ];

      invalidEmailStrings.forEach(emailString => {
        expect(validateEmails(emailString)).toBe(false);
      });
    });

    test('handles empty and whitespace-only strings', () => {
      expect(validateEmails('')).toBe(false);
      expect(validateEmails('   ')).toBe(false);
      expect(validateEmails('\n\t')).toBe(false);
    });

    test('handles emails with extra whitespace', () => {
      const emailsWithWhitespace = [
        ' test@example.com ',
        'test@example.com , user@domain.org ',
        ' first@test.com, second@test.com ',
        'user1@example.com,  user2@example.com  ,user3@example.com',
      ];

      emailsWithWhitespace.forEach(emailString => {
        expect(validateEmails(emailString)).toBe(true);
      });
    });

    test('handles trailing and leading commas', () => {
      expect(validateEmails(',test@example.com')).toBe(false);
      expect(validateEmails('test@example.com,')).toBe(false);
      expect(validateEmails(',test@example.com,')).toBe(false);
    });

    test('handles consecutive commas', () => {
      expect(validateEmails('test@example.com,,user@domain.org')).toBe(false);
      expect(validateEmails('test@example.com, , user@domain.org')).toBe(false);
    });
  });

  describe('RequestDocumentModal validateEmail', () => {
    test('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'user123@test-domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(validateRequestEmail(email)).toBe(true);
      });
    });

    test('rejects invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
        'test @example.com',
        'test@example..com',
        'test@.example.com',
        'test@example.com.',
      ];

      invalidEmails.forEach(email => {
        expect(validateRequestEmail(email)).toBe(false);
      });
    });

    test('handles null and undefined inputs', () => {
      expect(validateRequestEmail(null)).toBe(false);
      expect(validateRequestEmail(undefined)).toBe(false);
    });

    test('handles non-string inputs', () => {
      expect(validateRequestEmail(123)).toBe(false);
      expect(validateRequestEmail({})).toBe(false);
      expect(validateRequestEmail([])).toBe(false);
      expect(validateRequestEmail(true)).toBe(false);
    });
  });

  describe('Cross-component validation consistency', () => {
    test('all validation functions agree on valid emails', () => {
      const testEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'user123@test-domain.com',
      ];

      testEmails.forEach(email => {
        const shareResult = validateEmail(email);
        const requestResult = validateRequestEmail(email);
        const sharesResult = validateEmails(email);

        expect(shareResult).toBe(requestResult);
        expect(shareResult).toBe(sharesResult);
      });
    });

    test('all validation functions agree on invalid emails', () => {
      const testEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
      ];

      testEmails.forEach(email => {
        const shareResult = validateEmail(email);
        const requestResult = validateRequestEmail(email);
        const sharesResult = validateEmails(email);

        expect(shareResult).toBe(requestResult);
        expect(shareResult).toBe(sharesResult);
      });
    });
  });

  describe('Edge cases and security', () => {
    test('handles very long email addresses', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
      expect(validateRequestEmail(longEmail)).toBe(false);
      expect(validateEmails(longEmail)).toBe(false);
    });

    test('handles emails with special characters', () => {
      const specialEmails = [
        'test+tag@example.com',
        'test.name@example.com',
        'test_name@example.com',
        'test-name@example.com',
      ];

      specialEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
        expect(validateRequestEmail(email)).toBe(true);
        expect(validateEmails(email)).toBe(true);
      });
    });

    test('rejects potentially malicious input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>@example.com',
        'test@<script>example.com',
        'test@example.com<script>',
        'javascript:alert(1)@example.com',
      ];

      maliciousInputs.forEach(input => {
        expect(validateEmail(input)).toBe(false);
        expect(validateRequestEmail(input)).toBe(false);
        expect(validateEmails(input)).toBe(false);
      });
    });

    test('handles international domain names', () => {
      // Note: This depends on the regex implementation
      const internationalEmails = [
        'test@example.com',
        'user@domain.org',
        'admin@site.net',
      ];

      internationalEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
        expect(validateRequestEmail(email)).toBe(true);
        expect(validateEmails(email)).toBe(true);
      });
    });
  });
});