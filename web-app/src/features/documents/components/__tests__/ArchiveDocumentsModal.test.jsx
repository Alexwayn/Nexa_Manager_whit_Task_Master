import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/features\i18n';
import ArchiveDocumentsModal from '../ArchiveDocumentsModal';

// Mock documents data
const mockDocuments = [
  {
    id: 1,
    name: 'Test Document 1.pdf',
    type: 'PDF',
    size: '2.1 MB',
    date: '2023-06-10',
    owner: 'John Doe',
    status: 'Private'
  },
  {
    id: 2,
    name: 'Test Document 2.docx',
    type: 'Word',
    size: '1.5 MB',
    date: '2023-06-09',
    owner: 'Jane Smith',
    status: 'Shared'
  },
  {
    id: 3,
    name: 'Archived Document.pdf',
    type: 'PDF',
    size: '3.2 MB',
    date: '2023-06-08',
    owner: 'Bob Johnson',
    status: 'Archived'
  }
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onArchiveDocuments: jest.fn(),
  availableDocuments: mockDocuments,
  preSelectedDocuments: []
};

const renderWithI18n = (component) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('ArchiveDocumentsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    expect(screen.getByText('Archive Documents')).toBeInTheDocument();
    expect(screen.getByText('Archive documents you no longer need')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Archive Documents')).not.toBeInTheDocument();
  });

  it('displays available documents', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    expect(screen.getByText('Test Document 2.docx')).toBeInTheDocument();
    expect(screen.getByText('Archived Document.pdf')).toBeInTheDocument();
  });

  it('allows document selection', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    expect(checkbox).toBeChecked();
    expect(screen.getByText('1 documents selected')).toBeInTheDocument();
  });

  it('filters documents based on search query', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'Test Document 1' } });
    
    expect(screen.getByText('Test Document 1.pdf')).toBeInTheDocument();
    expect(screen.queryByText('Test Document 2.docx')).not.toBeInTheDocument();
  });

  it('shows validation error when no documents selected', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);
    
    expect(screen.getByText('Please select at least one document')).toBeInTheDocument();
  });

  it('prevents selection of already archived documents', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    const archivedDocumentCheckbox = checkboxes[2]; // Third document is archived
    
    expect(archivedDocumentCheckbox).toBeDisabled();
  });

  it('shows confirmation step after selecting documents', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    // Select a document
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    // Click continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);
    
    expect(screen.getByText('Confirm Archive')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to archive 1 documents?')).toBeInTheDocument();
  });

  it('calls onArchiveDocuments when confirmed', async () => {
    const mockOnArchive = jest.fn().mockResolvedValue();
    renderWithI18n(
      <ArchiveDocumentsModal {...defaultProps} onArchiveDocuments={mockOnArchive} />
    );
    
    // Select a document
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    // Click continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);
    
    // Click archive
    const archiveButton = screen.getByText('Archive Documents');
    fireEvent.click(archiveButton);
    
    await waitFor(() => {
      expect(mockOnArchive).toHaveBeenCalledWith({
        documentIds: [1],
        archivedAt: expect.any(String),
        reason: undefined,
        originalStatus: 'active',
        canRestore: true
      });
    });
  });

  it('handles select all functionality', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    
    // Should select non-archived documents (first two)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked(); // Archived document should remain unchecked
  });

  it('handles clear all functionality', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    // First select some documents
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    // Then clear all
    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);
    
    expect(checkbox).not.toBeChecked();
  });

  it('allows going back from confirmation step', () => {
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} />);
    
    // Select a document and go to confirmation
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);
    
    // Go back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    expect(screen.getByText('Archive Documents')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Archive')).not.toBeInTheDocument();
  });

  it('closes modal when close button clicked', () => {
    const mockOnClose = jest.fn();
    renderWithI18n(<ArchiveDocumentsModal {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});