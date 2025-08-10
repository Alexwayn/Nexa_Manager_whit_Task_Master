/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import EmailErrorBoundary from '../EmailErrorBoundary';

// Mock dependencies (match the component's actual imports)
jest.mock('../../../../utils/Logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../shared/services/errorReportingService', () => ({
  __esModule: true,
  default: {
    reportError: jest.fn(),
    reportUserFeedback: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockLogger = require('../../../../utils/Logger').default;
const mockErrorReporting = require('../../../../shared/services/errorReportingService').default;

// Test component that throws errors
const ThrowError = ({ shouldThrow, errorType = 'generic' }) => {
  if (shouldThrow) {
    if (errorType === 'network') {
      throw new Error('Network request failed');
    } else if (errorType === 'permission') {
      throw new Error('Permission denied');
    } else if (errorType === 'validation') {
      throw new Error('Validation failed: Invalid email format');
    } else {
      throw new Error('Something went wrong');
    }
  }
  return <div>Working component</div>;
};

describe('EmailErrorBoundary', () => {
  const defaultProps = {
    fallback: null,
    onError: jest.fn(),
    showDetails: true,
    allowRetry: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Normal Operation', () => {
    test('should render children when no error occurs', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={false} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    test('should not interfere with normal component lifecycle', () => {
      const { rerender } = render(
        <EmailErrorBoundary {...defaultProps}>
          <div>Initial content</div>
        </EmailErrorBoundary>
      );

      rerender(
        <EmailErrorBoundary {...defaultProps}>
          <div>Updated content</div>
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Updated content')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should catch and display error when child component throws', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/email system error/i)).toBeInTheDocument();
    });

    test('should log error details', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'EmailErrorBoundary caught an error:',
        expect.objectContaining({
          message: 'Something went wrong',
          stack: expect.any(String),
        })
      );
    });

    test('should report error to error reporting service', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(mockErrorReporting.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Something went wrong',
        }),
        expect.objectContaining({
          component: 'EmailErrorBoundary',
          context: 'email-system',
        })
      );
    });

    test('should call onError callback when provided', () => {
      const onError = jest.fn();

      render(
        <EmailErrorBoundary {...defaultProps} onError={onError}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Something went wrong',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Types', () => {
    test('should handle network errors with specific message', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} errorType="network" />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/network connection issue/i)).toBeInTheDocument();
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    });

    test('should handle permission errors with specific message', () => {
      render(
        <EmailErrorBoundary {...defaultProps} showDetails={false}>
          <ThrowError shouldThrow={true} errorType="permission" />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
      expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
    });

    test('should handle validation errors with specific message', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} errorType="validation" />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/validation error/i)).toBeInTheDocument();
      expect(screen.getByText(/please check your input/i)).toBeInTheDocument();
    });

    test('should show generic error message for unknown error types', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} errorType="unknown" />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    test('should show error details when showDetails is true', () => {
      render(
        <EmailErrorBoundary {...defaultProps} showDetails={true}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/error details/i)).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    test('should hide error details when showDetails is false', () => {
      render(
        <EmailErrorBoundary {...defaultProps} showDetails={false}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.queryByText(/error details/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    test('should toggle error details visibility', async () => {
      const user = userEvent.setup();
      render(
        <EmailErrorBoundary {...defaultProps} showDetails={true}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const toggleButton = screen.getByRole('button', { name: /hide details/i });
      await user.click(toggleButton);

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
    });

    test('should show stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <EmailErrorBoundary {...defaultProps} showDetails={true}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/stack trace/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Retry Functionality', () => {
    test('should show retry button when allowRetry is true', () => {
      render(
        <EmailErrorBoundary {...defaultProps} allowRetry={true}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('should hide retry button when allowRetry is false', () => {
      render(
        <EmailErrorBoundary {...defaultProps} allowRetry={false}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    test('should reset error state when retry button is clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <EmailErrorBoundary {...defaultProps} allowRetry={true}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/email system error/i)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Re-render with working component
      rerender(
        <EmailErrorBoundary {...defaultProps} allowRetry={true}>
          <ThrowError shouldThrow={false} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    test('should track retry attempts', async () => {
      const user = userEvent.setup();
      render(
        <EmailErrorBoundary {...defaultProps} allowRetry={true}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'User retried after error in EmailErrorBoundary',
        expect.objectContaining({
          retryCount: 1,
        })
      );
    });

    test('should limit retry attempts', async () => {
      const user = userEvent.setup();
      
      // Create a component that always throws errors
      const AlwaysThrowError = () => {
        throw new Error('Something went wrong');
      };
      
      render(
        <EmailErrorBoundary {...defaultProps} allowRetry={true} maxRetries={2}>
          <AlwaysThrowError />
        </EmailErrorBoundary>
      );

      // Should show error and retry button initially
      expect(screen.getByText(/email system error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      // First retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);
      
      // Wait for component to re-enter error state and show retry button
      await screen.findByRole('button', { name: /try again/i });
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      // Second retry - should reach max retries
      const retryButton2 = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton2);
      
      // Wait for component to re-enter error state and show max retries message
      await screen.findByText(/maximum retry attempts reached/i);
      expect(screen.getByText(/maximum retry attempts reached/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    test('should render custom fallback component', () => {
      const CustomFallback = ({ error, retry }) => (
        <div>
          <h2>Custom Error UI</h2>
          <p>Error: {error.message}</p>
          <button onClick={retry}>Custom Retry</button>
        </div>
      );

      render(
        <EmailErrorBoundary {...defaultProps} fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
    });

    test('should pass error and retry function to custom fallback', async () => {
      const user = userEvent.setup();
      const CustomFallback = ({ error, retry }) => (
        <button onClick={retry}>Retry: {error.message}</button>
      );

      const { rerender } = render(
        <EmailErrorBoundary {...defaultProps} fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry: something went wrong/i });
      await user.click(retryButton);

      rerender(
        <EmailErrorBoundary {...defaultProps} fallback={CustomFallback}>
          <ThrowError shouldThrow={false} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });
  });

  describe('User Feedback', () => {
    test('should show feedback form', async () => {
      const user = userEvent.setup();
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const feedbackButton = screen.getByRole('button', { name: /report issue/i });
      await user.click(feedbackButton);

      expect(screen.getByText(/help us improve/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/describe what happened/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
    });

    test('should submit user feedback', async () => {
      const user = userEvent.setup();
      mockErrorReporting.reportUserFeedback.mockResolvedValue({ success: true });

      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const feedbackButton = screen.getByRole('button', { name: /report issue/i });
      await user.click(feedbackButton);

      const descriptionInput = screen.getByLabelText(/describe what happened/i);
      await user.type(descriptionInput, 'The email list stopped working');

      const emailInput = screen.getByLabelText(/your email/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /send feedback/i });
      await user.click(submitButton);

      expect(mockErrorReporting.reportUserFeedback).toHaveBeenCalledWith({
        description: 'The email list stopped working',
        email: 'user@example.com',
        error: expect.objectContaining({
          message: 'Something went wrong',
        }),
        context: 'email-system',
      });

      expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument();
    });

    test('should handle feedback submission errors', async () => {
      const user = userEvent.setup();
      mockErrorReporting.reportUserFeedback.mockRejectedValue(
        new Error('Failed to submit feedback')
      );

      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const feedbackButton = screen.getByRole('button', { name: /report issue/i });
      await user.click(feedbackButton);

      const descriptionInput = screen.getByLabelText(/describe what happened/i);
      await user.type(descriptionInput, 'Test feedback');

      const submitButton = screen.getByRole('button', { name: /send feedback/i });
      await user.click(submitButton);

      expect(screen.getByText(/failed to submit feedback/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
      expect(screen.getByRole('button', { name: /try again/i })).toHaveAttribute('aria-label');
    });

    test('should announce error to screen readers', () => {
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveTextContent(/email system error/i);
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      retryButton.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: /report issue/i })).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: /hide details/i })).toHaveFocus();
    });
  });

  describe('Error Recovery', () => {
    test('should reset error state when children change', () => {
      const { rerender } = render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/email system error/i)).toBeInTheDocument();

      rerender(
        <EmailErrorBoundary {...defaultProps}>
          <div>New component</div>
        </EmailErrorBoundary>
      );

      expect(screen.getByText('New component')).toBeInTheDocument();
    });

    test('should maintain error state for same children', () => {
      const { rerender } = render(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/email system error/i)).toBeInTheDocument();

      rerender(
        <EmailErrorBoundary {...defaultProps}>
          <ThrowError shouldThrow={true} />
        </EmailErrorBoundary>
      );

      expect(screen.getByText(/email system error/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <div>Test</div>;
      };

      const { rerender } = render(
        <EmailErrorBoundary {...defaultProps}>
          <TestComponent />
        </EmailErrorBoundary>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(
        <EmailErrorBoundary {...defaultProps}>
          <TestComponent />
        </EmailErrorBoundary>
      );

      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle rapid error occurrences', () => {
      // Simulate rapid errors
      for (let i = 0; i < 5; i++) {
        render(
          <EmailErrorBoundary {...defaultProps}>
            <ThrowError shouldThrow={true} />
          </EmailErrorBoundary>
        );
      }

      // Should still handle errors gracefully
      expect(mockLogger.error).toHaveBeenCalledTimes(5);
      expect(mockErrorReporting.reportError).toHaveBeenCalledTimes(5);
    });
  });
});
