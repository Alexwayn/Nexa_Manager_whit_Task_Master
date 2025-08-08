import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import EmailRecipientInput from '../EmailRecipientInput';

// Mock the useClients hook
jest.mock('@hooks/useClients', () => ({
  useClients: () => ({
    clients: [
      {
        id: '1',
        email: 'john@example.com',
        full_name: 'John Doe',
      },
      {
        id: '2',
        email: 'jane@company.com',
        company_name: 'Jane Company',
      },
    ],
  }),
}));

describe('EmailRecipientInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Enter email addresses',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input field with placeholder', () => {
    render(<EmailRecipientInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Enter email addresses')).toBeInTheDocument();
  });

  test('displays existing recipients as tags', () => {
    render(
      <EmailRecipientInput 
        {...defaultProps} 
        value="john@example.com, jane@company.com" 
      />
    );
    
    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/jane@company.com/)).toBeInTheDocument();
  });

  test('adds recipient when Enter is pressed', () => {
    const onChange = jest.fn();
    render(<EmailRecipientInput {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter email addresses');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(onChange).toHaveBeenCalledWith('test@example.com');
  });

  test('shows error message when provided', () => {
    render(
      <EmailRecipientInput 
        {...defaultProps} 
        error="Invalid email format" 
      />
    );
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  test('disables input when disabled prop is true', () => {
    render(<EmailRecipientInput {...defaultProps} disabled={true} />);
    
    const input = screen.getByPlaceholderText('Enter email addresses');
    expect(input).toBeDisabled();
  });
});
