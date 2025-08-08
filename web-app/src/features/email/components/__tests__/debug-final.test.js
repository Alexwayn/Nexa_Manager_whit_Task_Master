/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailErrorBoundary from '../EmailErrorBoundary';

// Mock dependencies
jest.mock('@lib/logger');
jest.mock('@lib/errorReportingService');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Something went wrong');
  }
  return <div>Working component</div>;
};

const defaultProps = {
  context: 'email-system',
  onError: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

test('debug retry behavior', async () => {
  const user = userEvent.setup();
  render(
    <EmailErrorBoundary {...defaultProps} allowRetry={true} maxRetries={2}>
      <ThrowError shouldThrow={true} />
    </EmailErrorBoundary>
  );

  console.log('Initial render:');
  console.log(document.body.innerHTML);

  const retryButton = screen.getByRole('button', { name: /try again/i });

  // First retry
  await user.click(retryButton);
  console.log('After first retry:');
  console.log(document.body.innerHTML);

  // Second retry
  await user.click(retryButton);
  console.log('After second retry:');
  console.log(document.body.innerHTML);

  // Check what text is actually present
  const allText = document.body.textContent;
  console.log('All text content:', allText);
  
  // Check for various possible text patterns
  console.log('Contains "maximum":', allText.includes('maximum'));
  console.log('Contains "Maximum":', allText.includes('Maximum'));
  console.log('Contains "retry":', allText.includes('retry'));
  console.log('Contains "attempts":', allText.includes('attempts'));
  console.log('Contains "reached":', allText.includes('reached'));
});
