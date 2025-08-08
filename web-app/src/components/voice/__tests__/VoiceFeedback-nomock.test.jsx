// Test without any mocks to see the actual component behavior
// This test bypasses all Jest mocks to test the real component

// Temporarily disable all mocks for this test
const jestConfig = require('../../../../../.config/jest/jest.config.cjs');
let originalModuleNameMapper;

// Import the actual modules
const actualReact = require('react');
const actualTestingLibrary = require('@testing-library/react');
const actualFireEvent = require('@testing-library/user-event');

// Import the component directly
import VoiceFeedbackModal from '../VoiceFeedbackModal';
import fs from 'fs';

describe('VoiceFeedbackModal - No Mock Test', () => {
  beforeAll(() => {
    // Store original module mapper
    originalModuleNameMapper = jestConfig.moduleNameMapper;
    // Temporarily disable module name mapper
    jestConfig.moduleNameMapper = {};
  });

  let mockOnClose;

  beforeEach(() => {
    mockOnClose = jest.fn();
    // Clear any previous debug output
    if (fs.existsSync('debug-nomock-output.txt')) {
      fs.unlinkSync('debug-nomock-output.txt');
    }
  });

  afterAll(() => {
    // Restore original module mapper
    jestConfig.moduleNameMapper = originalModuleNameMapper;
  });

  test('should render the actual component without mocks', () => {
    const { container } = actualTestingLibrary.render(
      actualReact.createElement(VoiceFeedbackModal, {
        isOpen: true,
        onClose: mockOnClose,
        sessionId: "test-session",
        command: "test command",
        response: "test response"
      })
    );

    // Debug: log what's being rendered
    const debugOutput = 
      'Container HTML:\n' + container.innerHTML + '\n\n' +
      'All buttons:\n' + Array.from(container.querySelectorAll('button')).map(btn => 
        `Button: ${btn.outerHTML}\nText: "${btn.textContent}"\nDisabled: ${btn.disabled}\n`
      ).join('\n') + '\n\n' +
      'All divs with click handlers:\n' + Array.from(container.querySelectorAll('div[onclick], div[data-testid]')).map(div => 
        `Div: ${div.outerHTML}\nText: "${div.textContent}"\n`
      ).join('\n');

    fs.writeFileSync('debug-nomock-output.txt', debugOutput);

    // Basic assertion that something was rendered
    expect(container.innerHTML).not.toBe('<div>MockComponent(VoiceFeedbackModal)</div>');
    expect(container.innerHTML.length).toBeGreaterThan(100);
  });
});