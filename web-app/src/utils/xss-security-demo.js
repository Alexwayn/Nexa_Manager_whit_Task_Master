// For Node.js environment, we need to create a DOM implementation
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import Logger from '@utils/Logger';

// Create DOMPurify instance for Node.js
const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

/**
 * XSS Security Demonstration for QuoteEmailSender Component
 *
 * This file demonstrates how DOMPurify sanitization prevents XSS attacks
 * in the QuoteEmailSender.jsx component while preserving legitimate HTML.
 */

// Configuration matching the one used in QuoteEmailSender.jsx
const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
  ALLOWED_ATTR: ['href', 'target'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_ATTR: ['style'], // Remove style attribute to prevent CSS-based XSS
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML content using DOMPurify with the same configuration as QuoteEmailSender
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML content
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  return DOMPurifyInstance.sanitize(html, SANITIZATION_CONFIG);
};

/**
 * Test cases demonstrating XSS protection
 */
export const XSS_TEST_CASES = [
  {
    name: 'Script Tag Injection',
    maliciousInput: '<script>alert("XSS Attack!");</script><p>Legitimate content</p>',
    expectedBehavior: 'Script tags are completely removed, legitimate content preserved',
  },
  {
    name: 'Event Handler Injection',
    maliciousInput: '<p onclick="alert(\'XSS\')">Click me</p><strong>Safe content</strong>',
    expectedBehavior: 'Event handlers are removed, content and formatting preserved',
  },
  {
    name: 'Javascript URL Injection',
    maliciousInput:
      '<a href="javascript:alert(\'XSS\')">Malicious Link</a><a href="https://example.com">Safe Link</a>',
    expectedBehavior: 'Javascript URLs are removed, HTTPS URLs are preserved',
  },
  {
    name: 'Data Attribute Injection',
    maliciousInput: '<div data-secret="sensitive-info" data-track="user-action">Content</div>',
    expectedBehavior: 'Data attributes are removed to prevent data exfiltration',
  },
  {
    name: 'Iframe Injection',
    maliciousInput: '<iframe src="javascript:alert(\'XSS\')"></iframe><p>Content</p>',
    expectedBehavior: 'Iframe tags are completely removed as they are not in ALLOWED_TAGS',
  },
  {
    name: 'Style Injection',
    maliciousInput: '<p style="background: url(javascript:alert(\'XSS\'))">Styled content</p>',
    expectedBehavior: 'Style attributes are completely removed to prevent CSS-based XSS attacks',
  },
];

/**
 * Run all XSS test cases and return results
 * @returns {Array} Array of test results
 */
export const runXSSTests = () => {
  const results = [];

  Logger.debug('🔒 Running XSS Security Tests for QuoteEmailSender');
  Logger.debug('==================================================');

  XSS_TEST_CASES.forEach((testCase, index) => {
    const sanitizedOutput = sanitizeHtml(testCase.maliciousInput);
    const containsScript =
      sanitizedOutput.includes('<script>') || sanitizedOutput.includes('javascript:');
    const containsEventHandlers = /on\w+\s*=/.test(sanitizedOutput);
    const containsDataAttributes = /data-\w+/.test(sanitizedOutput);
    const containsStyleAttributes = /style\s*=/.test(sanitizedOutput);

    const result = {
      testNumber: index + 1,
      name: testCase.name,
      originalInput: testCase.maliciousInput,
      sanitizedOutput: sanitizedOutput,
      isSecure:
        !containsScript &&
        !containsEventHandlers &&
        !containsDataAttributes &&
        !containsStyleAttributes,
      expectedBehavior: testCase.expectedBehavior,
    };

    results.push(result);

    // Console output
    Logger.debug(`\n${index + 1}. ${testCase.name}`);
    Logger.error(`   Input:  ${testCase.maliciousInput}`);
    Logger.error(`   Output: ${sanitizedOutput}`);
    Logger.error(`   Secure: ${result.isSecure ? '✅ PASS' : '❌ FAIL'}`);
    Logger.error(`   Note:   ${testCase.expectedBehavior}`);
  });

  const allTestsPass = results.every((result) => result.isSecure);

  Logger.error('\n==================================================');
  Logger.error(`Overall Result: ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
  Logger.info(
    `XSS Vulnerability Status: ${allTestsPass ? '🔒 MITIGATED' : '⚠️  NOT FULLY PROTECTED'}`,
  );

  return results;
};

/**
 * Demonstrate legitimate HTML preservation
 */
export const runLegitimateHTMLTests = () => {
  const legitimateHTML = `
    <div>
      <p><strong>Important Notice:</strong> Your quote is ready for review.</p>
      <p>Please review the following details:</p>
      <ul>
        <li><em>Quote Number:</em> Q-2024-001</li>
        <li><strong>Amount:</strong> €1,000.00</li>
        <li><a href="https://example.com/quote" target="_blank">View Quote</a></li>
      </ul>
      <p>This quote expires in 30 days.</p>
    </div>
  `;

  const sanitized = sanitizeHtml(legitimateHTML);

  Logger.debug('\n🎨 Testing Legitimate HTML Preservation');
  Logger.debug('=====================================');
  Logger.debug('Input:', legitimateHTML);
  Logger.debug('Output:', sanitized);

  const preservesFormatting =
    sanitized.includes('<strong>') &&
    sanitized.includes('<em>') &&
    sanitized.includes('<ul>') &&
    sanitized.includes('<a href="https://example.com/quote"');

  Logger.info(`Formatting Preserved: ${preservesFormatting ? '✅ YES' : '❌ NO'}`);

  return { input: legitimateHTML, output: sanitized, preservesFormatting };
};

// Export for use in tests and demonstrations
export default {
  sanitizeHtml,
  XSS_TEST_CASES,
  runXSSTests,
  runLegitimateHTMLTests,
  SANITIZATION_CONFIG,
};
