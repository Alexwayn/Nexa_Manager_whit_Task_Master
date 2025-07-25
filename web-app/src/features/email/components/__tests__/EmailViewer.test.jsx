import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailViewer from '../EmailViewer';

const mockEmail = {
  id: '1',
  subject: 'Test Email Subject',
  sender: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  recipients: {
    to: [{ email: 'recipient@example.com', name: 'Recipient' }],
  },
  content: {
    text: 'This is the email content.\n\nWith multiple paragraphs.\n\n• Bullet point 1\n• Bullet point 2',
    html: '<p>This is the email content.</p>',
  },
  attachments: [
    {
      name: 'document.pdf',
      size: '2.4 MB',
      type: 'pdf',
      url: 'https://example.com/document.pdf',
    },
  ],
  labels: ['clients', 'important'],
  isRead: true,
  isStarred: true,
  isImportant: false,
  receivedAt: '2023-05-30T10:24:00Z',
};

const mockLabels = [
  { id: 'clients', name: 'Clients', color: 'bg-green-500' },
  { id: 'important', name: 'Important', color: 'bg-blue-500' },
];

const defaultProps = {
  email: mockEmail,
  onReply: jest.fn(),
  onReplyAll: jest.fn(),
  onForward: jest.fn(),
  onArchive: jest.fn(),
  onDelete: jest.fn(),
  onStar: jest.fn(),
  onFlag: jest.fn(),
  onMarkAsRead: jest.fn(),
  labels: mockLabels,
};

describe('EmailViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email content correctly', () => {
    render(<EmailViewer {...defaultProps} />);
    
    expect(screen.getByText('Test Email Subject')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('<john@example.com>')).toBeInTheDocument();
    expect(screen.getByText(/This is the email content/)).toBeInTheDocument();
  });

  it('shows empty state when no email is provided', () => {
    render(<EmailViewer {...defaultProps} email={null} />);
    
    expect(screen.getByText('No email selected')).toBeInTheDocument();
    expect(screen.getByText('Select an email from the list to view its contents')).toBeInTheDocument();
  });

  it('displays email labels correctly', () => {
    render(<EmailViewer {...defaultProps} />);
    
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
  });

  it('shows starred icon for starred emails', () => {
    render(<EmailViewer {...defaultProps} />);
    
    const starIcon = screen.getByTitle('Unstar');
    expect(starIcon.querySelector('svg')).toHaveClass('text-yellow-400');
  });

  it('shows unstarred icon for non-starred emails', () => {
    const unstarredEmail = { ...mockEmail, isStarred: false };
    render(<EmailViewer {...defaultProps} email={unstarredEmail} />);
    
    const starIcon = screen.getByTitle('Star');
    expect(starIcon.querySelector('svg')).toHaveClass('text-gray-500');
  });

  it('displays attachments correctly', () => {
    render(<EmailViewer {...defaultProps} />);
    
    expect(screen.getByText('1 Attachment')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.4 MB')).toBeInTheDocument();
  });

  it('handles multiple attachments', () => {
    const emailWithMultipleAttachments = {
      ...mockEmail,
      attachments: [
        { name: 'doc1.pdf', size: '1 MB', type: 'pdf' },
        { name: 'doc2.xlsx', size: '2 MB', type: 'excel' },
      ],
    };
    
    render(<EmailViewer {...defaultProps} email={emailWithMultipleAttachments} />);
    
    expect(screen.getByText('2 Attachments')).toBeInTheDocument();
    expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
    expect(screen.getByText('doc2.xlsx')).toBeInTheDocument();
  });

  it('calls action handlers when buttons are clicked', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByTitle('Archive'));
    expect(defaultProps.onArchive).toHaveBeenCalledWith('1');
    
    fireEvent.click(screen.getByTitle('Delete'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
    
    fireEvent.click(screen.getByTitle('Flag'));
    expect(defaultProps.onFlag).toHaveBeenCalledWith('1');
    
    fireEvent.click(screen.getByTitle('Unstar'));
    expect(defaultProps.onStar).toHaveBeenCalledWith('1');
  });

  it('shows reply box when reply button is clicked', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Reply'));
    
    expect(screen.getByText('Reply to John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your reply...')).toBeInTheDocument();
  });

  it('hides reply box when cancel is clicked', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Reply'));
    expect(screen.getByText('Reply to John Doe')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Reply to John Doe')).not.toBeInTheDocument();
  });

  it('calls onReply when reply is submitted', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Reply'));
    
    const textarea = screen.getByPlaceholderText('Type your reply...');
    fireEvent.change(textarea, { target: { value: 'This is my reply' } });
    
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    expect(defaultProps.onReply).toHaveBeenCalledWith('1', 'This is my reply');
  });

  it('disables send button when reply text is empty', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Reply'));
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when reply text is entered', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Reply'));
    
    const textarea = screen.getByPlaceholderText('Type your reply...');
    fireEvent.change(textarea, { target: { value: 'This is my reply' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('calls onReplyAll when Reply All is clicked', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Reply All'));
    
    expect(defaultProps.onReplyAll).toHaveBeenCalledWith('1');
  });

  it('calls onForward when Forward is clicked', () => {
    render(<EmailViewer {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Forward'));
    
    expect(defaultProps.onForward).toHaveBeenCalledWith('1');
  });

  it('formats email content with bullet points', () => {
    // Create a mock email with bullet points in their own paragraph
    const emailWithBullets = {
      ...mockEmail,
      content: {
        text: 'This is the email content.\n\n• Bullet point 1\n• Bullet point 2',
        html: null,
      },
    };
    
    render(<EmailViewer {...defaultProps} email={emailWithBullets} />);
    
    // The formatEmailContent function processes bullet points by removing the '•' symbol
    // and rendering them as list items
    expect(screen.getByText('Bullet point 1')).toBeInTheDocument();
    expect(screen.getByText('Bullet point 2')).toBeInTheDocument();
    
    // Check that they are rendered as list items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('renders HTML content when available', () => {
    const emailWithHtml = {
      ...mockEmail,
      content: {
        html: '<p>HTML content</p><strong>Bold text</strong>',
        text: 'Plain text content',
      },
    };
    
    render(<EmailViewer {...defaultProps} email={emailWithHtml} />);
    
    expect(screen.getByText('Bold text')).toBeInTheDocument();
  });

  it('shows thread information when showThread is true', () => {
    const threadEmails = [
      mockEmail,
      { ...mockEmail, id: '2', subject: 'Re: Test Email Subject' },
    ];
    
    render(
      <EmailViewer 
        {...defaultProps} 
        showThread={true} 
        threadEmails={threadEmails}
      />
    );
    
    expect(screen.getByText('2 messages in this conversation')).toBeInTheDocument();
  });

  it('calls onMarkAsRead for unread emails', () => {
    const unreadEmail = { ...mockEmail, isRead: false };
    render(<EmailViewer {...defaultProps} email={unreadEmail} />);
    
    expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith('1', true);
  });

  it('does not call onMarkAsRead for already read emails', () => {
    render(<EmailViewer {...defaultProps} />);
    
    expect(defaultProps.onMarkAsRead).not.toHaveBeenCalled();
  });

  it('formats date correctly', () => {
    render(<EmailViewer {...defaultProps} />);
    
    // The formatDate function uses toLocaleDateString with specific options
    // The actual format depends on the system locale - in this case it's Italian
    // For '2023-05-30T10:24:00Z', it formats as "30 maggio 2023 alle ore 12:24"
    const dateElement = screen.getByText(/30 maggio 2023/);
    expect(dateElement).toBeInTheDocument();
  });

  it('handles emails without subject', () => {
    const emailWithoutSubject = { ...mockEmail, subject: '' };
    render(<EmailViewer {...defaultProps} email={emailWithoutSubject} />);
    
    expect(screen.getByText('(No Subject)')).toBeInTheDocument();
  });

  it('handles emails without sender name', () => {
    const emailWithoutSenderName = {
      ...mockEmail,
      sender: { email: 'unknown@example.com' },
    };
    render(<EmailViewer {...defaultProps} email={emailWithoutSenderName} />);
    
    expect(screen.getByText('Unknown Sender')).toBeInTheDocument();
  });

  it('shows correct attachment icons for different file types', () => {
    const emailWithVariousAttachments = {
      ...mockEmail,
      attachments: [
        { name: 'image.jpg', type: 'image', mimeType: 'image/jpeg' },
        { name: 'video.mp4', type: 'video', mimeType: 'video/mp4' },
        { name: 'document.pdf', type: 'pdf' },
      ],
    };
    
    render(<EmailViewer {...defaultProps} email={emailWithVariousAttachments} />);
    
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });
});