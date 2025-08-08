import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailSearchResults from '../EmailSearchResults';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'search.searching': 'Loading...',
        'search.noResults': 'No results found',
        'search.noResultsDescription': 'Try adjusting your search criteria',
        'search.showingResults': `Showing ${options?.start || 1}-${options?.end || 10} of ${options?.total || 0} results`,
        'common.previous': 'Previous',
        'common.next': 'Next',
        'email.content': 'Content',
        'email.attachments': 'Attachments',
        'email.recipients': 'Recipients',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock UI components
jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../../ui/Badge', () => ({
  Badge: ({ children, ...props }) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock('../../ui/Checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}));

// Sample test data
const sampleEmail = {
  id: 1,
  sender_name: 'Test User',
  sender_email: 'test@example.com',
  subject: 'Test Email',
  preview: 'This is a test email preview',
  content: 'This is the full content of the test email',
  received_at: '2024-01-15T10:30:00Z',
  is_read: false,
  is_starred: false,
  is_important: false,
  labels: ['work', 'urgent'],
  attachments: [],
  recipients: ['recipient@example.com'],
};

const defaultProps = {
  results: [sampleEmail],
  totalResults: 1,
  currentPage: 1,
  pageSize: 20,
  isLoading: false,
  searchQuery: '',
  onPageChange: jest.fn(),
  onEmailSelect: jest.fn(),
  onEmailAction: jest.fn(),
  selectedEmails: [],
};

describe('EmailSearchResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<EmailSearchResults {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders no results message', () => {
    render(<EmailSearchResults {...defaultProps} results={[]} totalResults={0} />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
  });

  it('renders email results', () => {
    render(<EmailSearchResults {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test Email')).toBeInTheDocument();
    expect(screen.getByText('This is a test email preview')).toBeInTheDocument();
  });

  it('handles email selection', () => {
    const onEmailSelect = jest.fn();
    render(<EmailSearchResults {...defaultProps} onEmailSelect={onEmailSelect} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onEmailSelect).toHaveBeenCalledWith(sampleEmail, true);
  });

  it('shows pagination when needed', () => {
    render(<EmailSearchResults {...defaultProps} totalResults={50} />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});
