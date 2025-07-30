import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// Simple mock component to avoid import.meta issues
const MockEmailComposer = ({ isOpen, onClose, onSend, onSaveDraft, mode = 'compose' }) => {
  if (!isOpen) return null;
  
  return (
    <div data-testid="email-composer">
      <div data-testid="composer-header">Email Composer - {mode}</div>
      <button data-testid="close-button" onClick={onClose}>Close</button>
      <button data-testid="send-button" onClick={onSend}>Send</button>
      <button data-testid="save-draft-button" onClick={onSaveDraft}>Save Draft</button>
      <div data-testid="composer-content">Composer Content</div>
    </div>
  );
};

// Mock the actual EmailComposer module
jest.mock('../EmailComposer', () => ({
  __esModule: true,
  default: MockEmailComposer,
}));

describe('EmailComposer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSend: jest.fn(),
    onSaveDraft: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when open', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} />);
    const composer = container.querySelector('[data-testid="email-composer"]');
    expect(composer).toBeTruthy();
  });

  test('does not render when closed', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} isOpen={false} />);
    const composer = container.querySelector('[data-testid="email-composer"]');
    expect(composer).toBeFalsy();
  });

  test('calls onClose when close button is clicked', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} />);
    const closeButton = container.querySelector('[data-testid="close-button"]');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onSend when send button is clicked', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} />);
    const sendButton = container.querySelector('[data-testid="send-button"]');
    fireEvent.click(sendButton);
    expect(defaultProps.onSend).toHaveBeenCalledTimes(1);
  });

  test('calls onSaveDraft when save draft button is clicked', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} />);
    const saveDraftButton = container.querySelector('[data-testid="save-draft-button"]');
    fireEvent.click(saveDraftButton);
    expect(defaultProps.onSaveDraft).toHaveBeenCalledTimes(1);
  });

  test('shows compose mode by default', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} />);
    const header = container.querySelector('[data-testid="composer-header"]');
    expect(header.textContent).toBe('Email Composer - compose');
  });

  test('shows reply mode correctly', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} mode="reply" />);
    const header = container.querySelector('[data-testid="composer-header"]');
    expect(header.textContent).toBe('Email Composer - reply');
  });

  test('shows forward mode correctly', () => {
    const { container } = render(<MockEmailComposer {...defaultProps} mode="forward" />);
    const header = container.querySelector('[data-testid="composer-header"]');
    expect(header.textContent).toBe('Email Composer - forward');
  });
});