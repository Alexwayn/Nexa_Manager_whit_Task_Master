import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailTemplateManager from '../EmailTemplateManager';

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  PlusIcon: () => <div data-testid="plus-icon" />,
  MagnifyingGlassIcon: () => <div data-testid="magnifying-glass-icon" />,
  FunnelIcon: () => <div data-testid="funnel-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
  SparklesIcon: () => <div data-testid="sparkles-icon" />
}));

// Mock emailTemplateService
jest.mock('@lib/emailTemplateService', () => ({
  getTemplates: jest.fn(),
  saveTemplate: jest.fn(),
  deleteTemplate: jest.fn()
}));

// Mock EmailTemplateEditor
jest.mock('../EmailTemplateEditor', () => {
  return function MockEmailTemplateEditor({ onSave, onCancel }) {
    return (
      <div data-testid="email-template-editor">
        <button onClick={() => onSave({ id: 1, name: 'Test Template' })}>
          Save Template
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));

const emailTemplateService = require('@lib/emailTemplateService');

// Mock data
const mockTemplates = [
  {
    id: 1,
    name: 'Welcome Email',
    subject: 'Welcome to our platform!',
    content: 'Welcome to our platform...',
    html_content: '<p>Welcome to our platform...</p>',
    category: 'welcome',
    description: 'Welcome new users to the platform',
    variables: ['name', 'company'],
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Follow-up Email',
    subject: 'Following up on your inquiry',
    content: 'Thank you for your interest...',
    html_content: '<p>Thank you for your interest...</p>',
    category: 'follow-up',
    description: 'Follow up with potential customers',
    variables: ['name'],
    created_at: '2023-01-02T00:00:00Z'
  }
];

describe('EmailTemplateManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailTemplateService.getTemplates.mockResolvedValue(mockTemplates);
    emailTemplateService.saveTemplate.mockResolvedValue({ success: true });
    emailTemplateService.deleteTemplate.mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<EmailTemplateManager />);
      expect(screen.getByText('Email Templates')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      render(<EmailTemplateManager />);
      expect(screen.getByText('Loading templates...')).toBeInTheDocument();
    });

    it('should display templates correctly', async () => {
      render(<EmailTemplateManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
        expect(screen.getByText('Follow-up Email')).toBeInTheDocument();
      });
    });
  });

  describe('Template Actions', () => {
    it('should open editor for creating new template', async () => {
      render(<EmailTemplateManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Template');
      fireEvent.click(createButton);

      expect(screen.getByTestId('email-template-editor')).toBeInTheDocument();
    });

    it('should handle template saving via editor callback', async () => {
      render(<EmailTemplateManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Template');
      fireEvent.click(createButton);

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(emailTemplateService.getTemplates).toHaveBeenCalledTimes(2);
        expect(screen.queryByTestId('email-template-editor')).not.toBeInTheDocument();
      });
    });

    it('should cancel template editing', async () => {
      render(<EmailTemplateManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Template');
      fireEvent.click(createButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('email-template-editor')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle template loading error', async () => {
      emailTemplateService.getTemplates.mockRejectedValue(new Error('Failed to load'));
      
      render(<EmailTemplateManager />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });
    });
  });
});
