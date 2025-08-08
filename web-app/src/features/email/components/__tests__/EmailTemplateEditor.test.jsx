/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock the emailTemplateService - Jest will automatically use the __mocks__ version
jest.mock('@lib/emailTemplateService');

// Mock the email attachment service
jest.mock('@lib/emailAttachmentService');

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  CodeBracketIcon: () => <div data-testid="code-bracket-icon" />,
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  CloudArrowUpIcon: () => <div data-testid="cloud-arrow-up-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle-icon" />,
  CheckCircleIcon: () => <div data-testid="check-circle-icon" />,
}));

// Mock ReactQuill
jest.mock('react-quill', () => {
  return function MockReactQuill({ value, onChange, ...props }) {
    return (
      <textarea
        data-testid="rich-text-editor"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        {...props}
      />
    );
  };
});

// Mock CSS import
jest.mock('react-quill/dist/quill.snow.css', () => ({}));

// Mock EmailAttachmentManager
jest.mock('../EmailAttachmentManager', () => {
  const React = require('react');
  
  return function MockEmailAttachmentManager({ attachments = [], onAttachmentsChange }) {
    const [currentAttachments, setCurrentAttachments] = React.useState(attachments);
    
    const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      const newAttachments = files.map((file, index) => ({
        id: `mock-${index}`,
        name: file.name,
        size: file.size,
        type: file.type
      }));
      const updatedAttachments = [...currentAttachments, ...newAttachments];
      setCurrentAttachments(updatedAttachments);
      onAttachmentsChange?.(updatedAttachments);
    };

    return React.createElement('div', { 'data-testid': 'attachment-manager' }, [
      React.createElement('input', { 
        key: 'file-input',
        type: 'file', 
        multiple: true, 
        onChange: handleFileChange 
      }),
      React.createElement('div', { 
        key: 'attachment-count',
        'data-testid': 'attachment-count' 
      }, currentAttachments.length),
      'Mock Attachment Manager'
    ]);
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Import the component and service
import EmailTemplateEditor from '../EmailTemplateEditor';
import emailTemplateService from '@/lib/emailTemplateService';

describe('EmailTemplateEditor', () => {
  const defaultProps = {
    templateId: null,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onPreview: jest.fn(),
    isOpen: true,
  };

  const sampleTemplate = {
    id: '1',
    name: 'Invoice Template',
    description: 'Standard invoice template',
    subject: 'Invoice {{invoiceNumber}} - {{clientName}}',
    html: '<p>Dear {{clientName}},</p><p>Please find your invoice attached.</p>',
    category: 'invoice',
    variables: ['invoiceNumber', 'clientName', 'amount'],
    attachments: [],
    active: true,
  };

  beforeEach(() => {
    const emailTemplateService = require('@lib/emailTemplateService').default;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    emailTemplateService.saveTemplate.mockResolvedValue({ success: true });
    emailTemplateService.validateTemplate.mockReturnValue({ isValid: true, issues: [] });
    emailTemplateService.renderTemplate.mockReturnValue('<p>Rendered template</p>');
  });
  
  describe('Rendering', () => {
    test('should render template editor form', () => {
      render(<EmailTemplateEditor {...defaultProps} />);

      expect(screen.getByPlaceholderText('Template name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Template description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email subject with {variables}')).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    });

    test('should render action buttons', () => {
      render(<EmailTemplateEditor {...defaultProps} />);

      expect(screen.getByText('Save Template')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    test('should render with initial template data when provided', () => {
      render(<EmailTemplateEditor {...defaultProps} template={sampleTemplate} />);

      expect(screen.getByDisplayValue('Invoice Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Standard invoice template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Invoice {{invoiceNumber}} - {{clientName}}')).toBeInTheDocument();
    });
  });

  describe('Form Input', () => {
    test('should update template name', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Template name');
      await user.type(nameInput, 'New Template');

      expect(nameInput).toHaveValue('New Template');
    });

    test('should update description', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const descriptionInput = screen.getByPlaceholderText('Template description');
      await user.type(descriptionInput, 'New Description');

      expect(descriptionInput).toHaveValue('New Description');
    });

    test('should update subject line', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const subjectInput = screen.getByPlaceholderText('Email subject with {variables}');
      await user.clear(subjectInput);
      
      // Use fireEvent.change for special characters like double braces
      fireEvent.change(subjectInput, { target: { value: 'Test Subject {{variable}}' } });

      expect(subjectInput).toHaveValue('Test Subject {{variable}}');
    });

    test('should update template body', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const bodyEditor = screen.getByTestId('rich-text-editor');
      fireEvent.change(bodyEditor, { target: { value: 'Template body content' } });
    
    expect(bodyEditor).toHaveValue('Template body content');
    });

    test('should update category', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      // Find all select elements and look for the one with category options
      const selects = screen.getAllByRole('combobox');
      const categorySelect = selects.find(select => 
        select.querySelector('option[value="custom"]') && 
        select.querySelector('option[value="invoice"]')
      );
      
      expect(categorySelect).toBeTruthy();
      expect(categorySelect).toHaveValue('custom');
      
      await user.selectOptions(categorySelect, 'invoice');

      expect(categorySelect).toHaveValue('invoice');
    });
  });

  describe('Template Loading', () => {
    test('should load predefined template', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      // Look for the predefined template button by its name
      const loadButton = screen.getByText('Invoice Template');
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Invoice Template')).toBeInTheDocument();
      });
    });
  });

  describe('Variable Management', () => {
    test('should show available variables', async () => {
      render(<EmailTemplateEditor {...defaultProps} />);

      const variablesButton = screen.getByText('Variables');
      await userEvent.click(variablesButton);

      await waitFor(() => {
        expect(screen.getByText('Available Variables')).toBeInTheDocument();
      });
    });

    test('should insert variable into content', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      // Show variables panel
      const variablesButton = screen.getByText('Variables');
      await user.click(variablesButton);

      // Focus on the editor
      const bodyEditor = screen.getByTestId('rich-text-editor');
      await user.click(bodyEditor);

      // Insert a variable (this would be handled by the component's variable insertion logic)
    fireEvent.change(bodyEditor, { target: { value: '{{client_name}}' } });
    
    expect(bodyEditor).toHaveValue('{{client_name}}');
    });
  });

  describe('Template Preview', () => {
    test('should show preview mode', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const previewButton = screen.getByText('Preview');
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Email Preview')).toBeInTheDocument();
      });
    });

    test('should render template with sample data', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      // Add some content first
      const subjectInput = screen.getByPlaceholderText('Email subject with {variables}');
      fireEvent.change(subjectInput, { target: { value: 'Hello {{client_name}}' } });

      const bodyEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(bodyEditor, { target: { value: '<p>Dear {{client_name}}</p>' } });

      // Toggle preview
      const previewButton = screen.getByText('Preview');
      await user.click(previewButton);

      await waitFor(() => {
        const emailTemplateService = require('@lib/emailTemplateService').default;
        expect(emailTemplateService.renderTemplate).toHaveBeenCalled();
      });
    });
  });

  describe('Template Validation', () => {
    test('should disable save button when name is empty', async () => {
      render(<EmailTemplateEditor {...defaultProps} />);

      const saveButton = screen.getByText('Save Template');
      expect(saveButton).toBeDisabled();
    });

    test('should enable save button when name is provided', async () => {
      render(<EmailTemplateEditor {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Template name');
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      const saveButton = screen.getByText('Save Template');
      expect(saveButton).not.toBeDisabled();
    });

    test('should validate HTML syntax', async () => {
    const emailTemplateService = require('@lib/emailTemplateService').default;
    emailTemplateService.validateTemplate.mockReturnValue({
      isValid: false,
      issues: ['Invalid HTML syntax'],
    });

    render(<EmailTemplateEditor {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Template name');
    fireEvent.change(nameInput, { target: { value: 'Test Template' } });

    // Add HTML content to trigger validation
    const bodyEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(bodyEditor, { target: { value: '<p>Invalid HTML<p>' } });

    await waitFor(() => {
      expect(emailTemplateService.validateTemplate).toHaveBeenCalledWith('<p>Invalid HTML<p>');
    });
  });
  });

  describe('Template Saving', () => {
    test('should save new template', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Template name');
      fireEvent.change(nameInput, { target: { value: 'New Template' } });

      const descriptionInput = screen.getByPlaceholderText('Template description');
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

      const subjectInput = screen.getByPlaceholderText('Email subject with {variables}');
      fireEvent.change(subjectInput, { target: { value: 'New Subject' } });

      const bodyEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(bodyEditor, { target: { value: '<p>New content</p>' } });
    
    const saveButton = screen.getByText('Save Template');
      await user.click(saveButton);

      await waitFor(() => {
        const emailTemplateService = require('@lib/emailTemplateService').default;
        expect(emailTemplateService.saveTemplate).toHaveBeenCalledWith({
          id: null,
          name: 'New Template',
          description: 'New Description',
          subject: 'New Subject',
          htmlContent: '<p>New content</p>',
          category: 'custom',
          variables: [],
          attachments: [],
        });
      });
    });

    test('should update existing template', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} template={sampleTemplate} />);

      // Verify template data is loaded
      expect(screen.getByDisplayValue('Invoice Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Standard invoice template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Invoice {{invoiceNumber}} - {{clientName}}')).toBeInTheDocument();

      // Update template name
      const nameInput = screen.getByDisplayValue('Invoice Template');
      await user.clear(nameInput);
      fireEvent.change(nameInput, { target: { value: 'Updated Invoice Template' } });

      // Save the template
      const saveButton = screen.getByText('Save Template');
      await user.click(saveButton);

      await waitFor(() => {
        const emailTemplateService = require('@lib/emailTemplateService').default;
        expect(emailTemplateService.saveTemplate).toHaveBeenCalledWith({
          id: '1',
          name: 'Updated Invoice Template',
          description: 'Standard invoice template',
          subject: 'Invoice {{invoiceNumber}} - {{clientName}}',
          htmlContent: '<p>Dear {{clientName}},</p><p>Please find your invoice attached.</p>',
          category: 'invoice',
          variables: ['invoiceNumber', 'clientName', 'amount'],
          attachments: []
        });
      });
    });

    test('should handle save errors', async () => {
      const emailTemplateService = require('@lib/emailTemplateService').default;
      emailTemplateService.saveTemplate.mockRejectedValue(new Error('Save failed'));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Template name');
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      const saveButton = screen.getByText('Save Template');
      await user.click(saveButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error saving template: Save failed');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Attachment Management', () => {
    test('should render attachment manager', () => {
      render(<EmailTemplateEditor {...defaultProps} />);

      expect(screen.getByTestId('attachment-manager')).toBeInTheDocument();
    });

    test('should handle file attachments', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      // Find the hidden file input using document.querySelector
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      // Use fireEvent for file input since it's hidden
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTestId('attachment-count')).toHaveTextContent('1');
      });
    });
  });



  describe('Accessibility', () => {
    test('should have proper form labels and inputs', () => {
      render(<EmailTemplateEditor {...defaultProps} />);

      // Check that form labels exist
      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Subject Line')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();

      // Check that corresponding inputs exist
      expect(screen.getByPlaceholderText('Template name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Template description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email subject with {variables}')).toBeInTheDocument();
      
      // Check that category select exists with options
      const categorySelect = screen.getByRole('combobox');
      expect(categorySelect).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    test('should have accessible save button states', async () => {
      const user = userEvent.setup();
      render(<EmailTemplateEditor {...defaultProps} />);

      const saveButton = screen.getByText('Save Template');
      expect(saveButton).toBeDisabled();

      const nameInput = screen.getByPlaceholderText('Template name');
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      expect(saveButton).not.toBeDisabled();
    });
  });
});
