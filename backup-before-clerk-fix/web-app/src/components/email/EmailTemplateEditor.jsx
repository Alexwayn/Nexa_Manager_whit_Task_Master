import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  DocumentTextIcon,
  EyeIcon,
  CodeBracketIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import emailTemplateService from '@lib/emailTemplateService';
import EmailAttachmentManager from './EmailAttachmentManager';
import { useTranslation } from 'react-i18next';

const EmailTemplateEditor = ({ template = null, onSave, onCancel }) => {
  const { t } = useTranslation('email');
  const quillRef = useRef(null);

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    subject: '',
    htmlContent: '',
    category: 'custom',
    variables: [],
    attachments: [],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [validation, setValidation] = useState({ isValid: true, issues: [] });
  const [loading, setLoading] = useState(false);
  const [availableVariables] = useState(emailTemplateService.getAvailableVariables());
  const [testVariables, setTestVariables] = useState({});

  useEffect(() => {
    if (template) {
      setFormData({
        id: template.id || null,
        name: template.name || '',
        description: template.description || '',
        subject: template.subject || '',
        htmlContent: template.html_content || template.html || '',
        category: template.category || 'custom',
        variables: template.variables || [],
      });
    }
  }, [template]);

  useEffect(() => {
    // Initialize test variables with sample data
    const testData = {};
    availableVariables.forEach(variable => {
      testData[variable.name] = getSampleData(variable.name);
    });
    setTestVariables(testData);
  }, [availableVariables]);

  useEffect(() => {
    // Validate template whenever content changes
    if (formData.htmlContent) {
      const validationResult = emailTemplateService.validateTemplate(formData.htmlContent);
      setValidation(validationResult);
    }
  }, [formData.htmlContent]);

  const getSampleData = variable => {
    const samples = {
      client_name: 'John Smith',
      company_name: 'Nexa Manager',
      company_email: 'info@nexamanager.com',
      company_phone: '+1 (555) 123-4567',
      invoice_number: 'INV-2024-001',
      invoice_date: '2024-01-15',
      due_date: '2024-02-15',
      total_amount: '€1,250.00',
      payment_amount: '€1,250.00',
      payment_date: '2024-01-20',
      payment_method: 'Bank Transfer',
      days_overdue: '5',
      quote_number: 'QUO-2024-001',
      issue_date: '2024-01-15',
      expiry_date: '2024-02-15',
      content: 'This is sample content for your email template.',
      subscriber_name: 'Jane Doe',
      unsubscribe_link: 'https://nexamanager.com/unsubscribe',
    };
    return samples[variable] || `{${variable}}`;
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      [{ indent: '-1' }, { indent: '+1' }],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'align',
    'blockquote',
    'code-block',
    'list',
    'bullet',
    'link',
    'image',
    'indent',
  ];

  const handleContentChange = content => {
    setFormData(prev => ({
      ...prev,
      htmlContent: content,
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const insertVariable = variable => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      const placeholder = `{${variable.name}}`;
      quill.insertText(range ? range.index : 0, placeholder);
    }
  };

  const loadPredefinedTemplate = templateKey => {
    const predefined = emailTemplateService.predefinedTemplates[templateKey];
    if (predefined) {
      setFormData(prev => ({
        ...prev,
        name: predefined.name,
        description: predefined.description,
        htmlContent: predefined.html,
        variables: predefined.variables,
      }));
    }
  };

  const renderPreview = () => {
    const rendered = emailTemplateService.renderTemplate(
      {
        subject: formData.subject,
        html_content: formData.htmlContent,
      },
      testVariables,
    );

    if (rendered.success) {
      return rendered.data;
    }
    return { subject: formData.subject, htmlContent: formData.htmlContent };
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    setLoading(true);
    try {
      const result = await emailTemplateService.saveTemplate(formData);
      if (result.success) {
        onSave?.(result.data);
      } else {
        alert(`Error saving template: ${String(result?.error || 'Unknown error')}`);
      }
    } catch (error) {
      alert(`Error saving template: ${String(error?.message || error || 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  };

  const previewData = renderPreview();

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold flex items-center'>
            <DocumentTextIcon className='h-6 w-6 mr-2' />
            {template?.id ? 'Edit Email Template' : 'Create Email Template'}
          </h2>
          <p className='text-gray-600'>
            Design professional email templates with variables and WYSIWYG editing
          </p>
        </div>
        <div className='flex space-x-2'>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-lg flex items-center ${
              previewMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <EyeIcon className='h-4 w-4 mr-2' />
            Preview
          </button>
          <button
            onClick={() => setShowVariables(!showVariables)}
            className={`px-4 py-2 rounded-lg flex items-center ${
              showVariables ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <CodeBracketIcon className='h-4 w-4 mr-2' />
            Variables
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Left Panel - Template Info */}
        <div className='lg:col-span-1 space-y-4'>
          {/* Basic Info */}
          <div className='bg-white rounded-lg border p-4 space-y-4'>
            <h3 className='font-semibold text-gray-900'>Template Information</h3>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Name *</label>
              <input
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Template name'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                rows='3'
                placeholder='Template description'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Subject Line</label>
              <input
                type='text'
                value={formData.subject}
                onChange={e => handleInputChange('subject', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Email subject with {variables}'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Category</label>
              <select
                value={formData.category}
                onChange={e => handleInputChange('category', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='custom'>Custom</option>
                <option value='invoice'>Invoice</option>
                <option value='reminder'>Reminder</option>
                <option value='newsletter'>Newsletter</option>
                <option value='marketing'>Marketing</option>
              </select>
            </div>
          </div>

          {/* Quick Templates */}
          <div className='bg-white rounded-lg border p-4 space-y-3'>
            <h3 className='font-semibold text-gray-900 flex items-center'>
              <SparklesIcon className='h-4 w-4 mr-2' />
              Quick Start
            </h3>
            {Object.entries(emailTemplateService.predefinedTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => loadPredefinedTemplate(key)}
                className='w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors'
              >
                <div className='font-medium text-sm'>{template.name}</div>
                <div className='text-xs text-gray-500'>{template.description}</div>
              </button>
            ))}
          </div>

          {/* Attachments */}
          <div className='bg-white rounded-lg border p-4 space-y-3'>
            <h3 className='font-semibold text-gray-900 flex items-center'>
              <CloudArrowUpIcon className='h-4 w-4 mr-2' />
              Template Attachments
            </h3>
            <p className='text-sm text-gray-500'>
              Add default attachments that will be included with this template
            </p>
            <EmailAttachmentManager
              attachments={formData.attachments}
              onAttachmentsChange={attachments => setFormData(prev => ({ ...prev, attachments }))}
              maxFiles={5}
            />
          </div>

          {/* Validation */}
          {validation.issues.length > 0 && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <h3 className='font-semibold text-yellow-800 flex items-center mb-2'>
                <ExclamationTriangleIcon className='h-4 w-4 mr-2' />
                Email Compatibility Issues
              </h3>
              <ul className='text-sm text-yellow-700 space-y-1'>
                {validation.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.isValid && formData.htmlContent && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='font-semibold text-green-800 flex items-center'>
                <CheckCircleIcon className='h-4 w-4 mr-2' />
                Template is email-compatible
              </div>
            </div>
          )}
        </div>

        {/* Main Editor */}
        <div className='lg:col-span-3'>
          {!previewMode ? (
            <div className='bg-white rounded-lg border'>
              <div className='border-b p-4'>
                <h3 className='font-semibold text-gray-900'>Email Content Editor</h3>
                <p className='text-sm text-gray-500'>
                  Use the toolbar to format your email. Click "Variables" to insert placeholders.
                </p>
              </div>
              <div className='p-0'>
                <ReactQuill
                  ref={quillRef}
                  value={formData.htmlContent}
                  onChange={handleContentChange}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ height: '500px' }}
                  placeholder='Start writing your email template...'
                />
              </div>
            </div>
          ) : (
            <div className='bg-white rounded-lg border'>
              <div className='border-b p-4 flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-gray-900'>Email Preview</h3>
                  <p className='text-sm text-gray-500'>Preview with sample data</p>
                </div>
                <div className='text-sm text-gray-500'>
                  Subject: {previewData.subject || 'No subject'}
                </div>
              </div>
              <div className='p-6 bg-gray-50'>
                <div
                  className='bg-white border rounded-lg p-4 max-w-2xl mx-auto'
                  dangerouslySetInnerHTML={{ __html: previewData.htmlContent }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variables Panel */}
      {showVariables && (
        <div className='bg-white rounded-lg border p-4'>
          <h3 className='font-semibold text-gray-900 mb-4 flex items-center'>
            <CodeBracketIcon className='h-4 w-4 mr-2' />
            Available Variables
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
            {availableVariables.map(variable => (
              <button
                key={variable.name}
                onClick={() => insertVariable(variable)}
                className='text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group'
              >
                <div className='font-mono text-sm text-blue-600 font-medium'>
                  {variable.placeholder}
                </div>
                <div className='text-xs text-gray-500 mt-1'>{variable.description}</div>
              </button>
            ))}
          </div>
          <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
            <p className='text-sm text-blue-800'>
              <strong>Tip:</strong> Click any variable to insert it at your cursor position.
              Variables will be replaced with actual data when the email is sent.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center justify-between border-t pt-4'>
        <button
          onClick={onCancel}
          className='px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors'
        >
          Cancel
        </button>
        <div className='flex space-x-3'>
          <button
            onClick={handleSave}
            disabled={loading || !formData.name.trim()}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
          >
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Saving...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className='h-4 w-4 mr-2' />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
