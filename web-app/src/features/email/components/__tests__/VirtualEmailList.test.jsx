import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualEmailList from '../VirtualEmailList';

// Simple mocks that avoid complex React interactions
jest.mock('react-window', () => ({
  FixedSizeList: function MockFixedSizeList({ children, itemCount }) {
    return (
      <div data-testid="virtual-list">
        {Array.from({ length: Math.min(itemCount, 2) }, (_, index) => (
          <div key={index}>
            {children({ index, style: {} })}
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock('react-window-infinite-loader', () => ({
  __esModule: true,
  default: function MockInfiniteLoader({ children }) {
    return children({
      onItemsRendered: () => {},
      ref: () => {},
    });
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('@/components/EmailSecurityIndicator', () => {
  return function MockEmailSecurityIndicator() {
    return <div data-testid="security-indicator" />;
  };
});

jest.mock('@heroicons/react/24/outline', () => ({
  StarIcon: () => <svg data-testid="star-outline" />,
  PaperClipIcon: () => <svg data-testid="paperclip" />,
  CheckIcon: () => <svg data-testid="check" />,
  ArchiveBoxIcon: () => <svg data-testid="archive" />,
  TrashIcon: () => <svg data-testid="trash" />,
  EllipsisHorizontalIcon: () => <svg data-testid="ellipsis" />,
}));

jest.mock('@heroicons/react/24/solid', () => ({
  StarIcon: () => <svg data-testid="star-solid" />,
}));

describe('VirtualEmailList', () => {
  const sampleEmails = [
    {
      id: '1',
      subject: 'Test Subject 1',
      sender: { name: 'John Doe', email: 'john@example.com' },
      received_at: '2023-01-01T10:00:00Z',
      is_read: false,
      is_starred: false,
      preview: 'This is a test email preview...',
    },
  ];

  const defaultProps = {
    emails: sampleEmails,
    onEmailSelect: jest.fn(),
    onEmailCheck: jest.fn(),
    onStarToggle: jest.fn(),
    containerHeight: 600,
    itemHeight: 120,
    loading: false,
    hasMore: false,
    onLoadMore: jest.fn(),
    selectedEmails: new Set(),
    labels: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<VirtualEmailList {...defaultProps} />);
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  it('shows loading state when loading and no emails', () => {
    render(<VirtualEmailList {...defaultProps} emails={[]} loading={true} />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows empty state when no emails', () => {
    render(<VirtualEmailList {...defaultProps} emails={[]} />);
    
    expect(screen.getByText('noEmails')).toBeInTheDocument();
  });

  it('displays email content', () => {
    render(<VirtualEmailList {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Subject 1')).toBeInTheDocument();
  });
});
