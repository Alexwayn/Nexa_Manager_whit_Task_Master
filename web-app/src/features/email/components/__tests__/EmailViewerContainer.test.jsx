/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import EmailViewerContainer from '../EmailViewerContainer';

// Mock the useEmailViewer hook
import useEmailViewer from '@/features/email/hooks/useEmailViewer';

const mockEmailViewerReturn = {
  loading: false,
  error: null,
  threadEmails: [],
  showThread: false,
  markAsRead: jest.fn(),
  toggleStar: jest.fn(),
  archiveEmail: jest.fn(),
  deleteEmail: jest.fn(),
  flagEmail: jest.fn(),
  replyToEmail: jest.fn(),
  forwardEmail: jest.fn(),
  moveToFolder: jest.fn(),
  applyLabel: jest.fn(),
  removeLabel: jest.fn(),
  downloadAttachment: jest.fn(),
  toggleThreadView: jest.fn(),
};

jest.mock('@/features/email/hooks/useEmailViewer', () => jest.fn());

jest.mock('@components/email/EmailViewer', () => {
  return function MockEmailViewer({ 
    email, 
    onReply, 
    onReplyAll, 
    onForward, 
    onArchive,
    onDelete,
    onStar,
    onFlag,
    onMarkAsRead,
    labels,
    showThread,
    threadEmails,
    onThreadToggle,
    className
  }) {
    if (!email) return <div data-testid="no-email">No email selected</div>;
    
    return (
      <div data-testid="email-viewer" className={className}>
        <div>Important Meeting</div>
        <div>From: john@example.com</div>
        
        <button data-testid="reply-button" onClick={() => onReply(email.id, 'Test reply')}>
          Reply
        </button>
        <button data-testid="reply-all-button" onClick={() => onReplyAll(email.id)}>
          Reply All
        </button>
        <button data-testid="forward-button" onClick={() => onForward(email.id)}>
          Forward
        </button>
        <button data-testid="archive-button" onClick={() => onArchive(email.id)}>
          Archive
        </button>
        <button data-testid="delete-button" onClick={() => onDelete(email.id)}>
          Delete
        </button>
        <button data-testid="star-button" onClick={() => onStar(email.id)}>
          Star
        </button>
        <button data-testid="flag-button" onClick={() => onFlag(email.id)}>
          Flag
        </button>
        <button data-testid="mark-read-button" onClick={() => onMarkAsRead(email.id, true)}>
          Mark Read
        </button>
        
        {showThread && threadEmails && threadEmails.length > 0 && (
          <div data-testid="thread-emails">
            {threadEmails.map((threadEmail, index) => (
              <div key={threadEmail.id} data-testid={`thread-email-${index}`}>
                {threadEmail.subject}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('EmailViewerContainer', () => {
  const sampleEmail = {
    id: '1',
    subject: 'Important Meeting',
    sender: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    recipients: {
      to: [{ email: 'user@example.com' }],
      cc: [{ email: 'manager@example.com' }],
      bcc: []
    },
    receivedAt: '2024-01-15T10:00:00Z',
    content: {
      text: 'Please join the meeting at 2 PM today. We will discuss the project timeline.',
      html: '<p>Please join the meeting at 2 PM today. We will discuss the project timeline.</p>'
    },
    folder: 'inbox',
    isRead: false,
    isStarred: true,
    isImportant: false,
    hasAttachments: true,
    labels: ['work', 'urgent'],
    priority: 'high',
    threadId: 'thread-1',
    threadKey: 'thread-key-1',
  };

  const sampleThread = [
    {
      id: '1',
      subject: 'Important Meeting',
      sender: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      receivedAt: '2024-01-15T10:00:00Z',
      content: {
        text: 'Please join the meeting at 2 PM today.'
      },
      isRead: false,
    },
    {
      id: '2',
      subject: 'Re: Important Meeting',
      sender: {
        name: 'User',
        email: 'user@example.com'
      },
      receivedAt: '2024-01-15T10:30:00Z',
      content: {
        text: 'I will be there. Thanks for the reminder.'
      },
      isRead: true,
    },
  ];

  const defaultProps = {
    email: sampleEmail,
    labels: ['work', 'urgent'],
    showThread: false,
    onEmailUpdate: jest.fn(),
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock return values
    mockEmailViewerReturn.loading = false;
    mockEmailViewerReturn.error = null;
    mockEmailViewerReturn.threadEmails = sampleThread;
  });

  describe('Rendering', () => {
        test('should render email viewer container', async () => {
            useEmailViewer.mockReturnValue(mockEmailViewerReturn);
      render(<EmailViewerContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('email-viewer')).toBeInTheDocument();
        expect(screen.getByText('Important Meeting')).toBeInTheDocument();
        expect(screen.getByText('From: john@example.com')).toBeInTheDocument();
      });
    });

        test('should render with no email', async () => {
            useEmailViewer.mockReturnValue(mockEmailViewerReturn);
      render(<EmailViewerContainer {...defaultProps} email={null} />);

      await waitFor(() => {
        expect(screen.getByTestId('no-email')).toBeInTheDocument();
        expect(screen.getByText('No email selected')).toBeInTheDocument();
      });
    });

        test('should apply custom className', async () => {
            useEmailViewer.mockReturnValue(mockEmailViewerReturn);
      render(<EmailViewerContainer {...defaultProps} className="custom-class" />);

      await waitFor(() => {
        const container = screen.getByTestId('email-viewer');
        expect(container).toHaveClass('custom-class');
      });
    });

    test('should show thread emails when showThread is true', () => {
      render(<EmailViewerContainer {...defaultProps} showThread={true} />);

      expect(screen.getByTestId('thread-emails')).toBeInTheDocument();
      expect(screen.getByTestId('thread-email-0')).toBeInTheDocument();
      expect(screen.getByTestId('thread-email-1')).toBeInTheDocument();
    });
  });

  describe('Email Actions', () => {
    test('should handle reply action', async () => {
      mockEmailViewerReturn.replyToEmail.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const replyButton = screen.getByTestId('reply-button');
      await user.click(replyButton);

      expect(mockEmailViewerReturn.replyToEmail).toHaveBeenCalled();
    });

    test('should handle reply all action', async () => {
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const replyAllButton = screen.getByTestId('reply-all-button');
      await user.click(replyAllButton);

      expect(defaultProps.onEmailUpdate).toHaveBeenCalledWith('replyAll', { emailId: sampleEmail.id });
    });

    test('should handle forward action', async () => {
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const forwardButton = screen.getByTestId('forward-button');
      await user.click(forwardButton);

      expect(defaultProps.onEmailUpdate).toHaveBeenCalledWith('forward', { emailId: sampleEmail.id });
    });

    test('should handle archive action', async () => {
      mockEmailViewerReturn.archiveEmail.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const archiveButton = screen.getByTestId('archive-button');
      await user.click(archiveButton);

      expect(mockEmailViewerReturn.archiveEmail).toHaveBeenCalledWith(sampleEmail.id);
    });

    test('should handle delete action', async () => {
      mockEmailViewerReturn.deleteEmail.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      expect(mockEmailViewerReturn.deleteEmail).toHaveBeenCalledWith(sampleEmail.id);
    });

    test('should handle star action', async () => {
      mockEmailViewerReturn.toggleStar.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const starButton = screen.getByTestId('star-button');
      await user.click(starButton);

      expect(mockEmailViewerReturn.toggleStar).toHaveBeenCalledWith(sampleEmail.id);
    });

    test('should handle flag action', async () => {
      mockEmailViewerReturn.flagEmail.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const flagButton = screen.getByTestId('flag-button');
      await user.click(flagButton);

      expect(mockEmailViewerReturn.flagEmail).toHaveBeenCalledWith(sampleEmail.id);
    });

    test('should handle mark as read action', async () => {
      const user = userEvent.setup();
      render(<EmailViewerContainer {...defaultProps} />);

      const markReadButton = screen.getByTestId('mark-read-button');
      await user.click(markReadButton);

      expect(mockEmailViewerReturn.markAsRead).toHaveBeenCalledWith(sampleEmail.id, true);
    });
  });
});
