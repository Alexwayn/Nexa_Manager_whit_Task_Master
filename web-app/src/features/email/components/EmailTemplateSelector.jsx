import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  EyeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useEmailTemplates } from '../hooks/useEmailTemplates';
import { useTranslation } from 'react-i18next';

const EmailTemplateSelector = ({ 
  onSelectTemplate, 
  onClose, 
  selectedTemplateId = null,
  showPreview = true 
}) => {
  const { t } = useTranslation('email');
  const {
    templates,
    predefinedTemplates,
    loading,
    error,
    searchTemplates,
    getTemplatesByCategory,
    renderTemplate,
  } = useEmailTemplates();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'business', label: 'Business' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'quote', label: 'Quote' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'custom', label: 'Custom' },
  ];

  // Sample variables for preview
  const sampleVariables = {
    client_name: 'John Smith',
    company_name: 'Nexa Manager',
    company_email: 'info@nexamanager.com',
    invoice_number: 'INV-2024-001',
    quote_number: 'QUO-2024-001',
    total_amount: '€1,250.00',
    due_date: '2024-02-15',
    expiry_date: '2024-02-15',
    days_overdue: '5',
    content: 'This is sample content for the email template preview.',
  };

  useEffect(() => {
    let filtered = templates;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = getTemplatesByCategory(selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchTemplates(searchQuery);
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(t => t.category === selectedCategory);
      }
    }
    
    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery, getTemplatesByCategory, searchTemplates]);

  const handleSelectTemplate = (template, isPredefined = false) => {
    const templateData = {
      ...template,
      isPredefined,
      id: isPredefined ? `predefined-${template.name}` : template.id,
    };
    onSelectTemplate(templateData);
  };

  const handlePreviewTemplate = (template, isPredefined = false) => {
    if (!showPreview) return;
    
    const templateData = isPredefined ? {
      subject: template.name,
      html_content: template.html,
      variables: template.variables,
    } : template;
    
    const rendered = renderTemplate(templateData, sampleVariables);
    if (rendered.success) {
      setPreviewTemplate({
        ...template,
        renderedContent: rendered.data,
        isPredefined,
      });
    }
  };

  const renderTemplateCard = (template, isPredefined = false) => {
    const templateId = isPredefined ? `predefined-${template.name}` : template.id;
    const isSelected = selectedTemplateId === templateId;
    
    return (
      <div
        key={templateId}
        className={`relative bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleSelectTemplate(template, isPredefined)}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
            <CheckIcon className="h-4 w-4" />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 flex items-center">
                {isPredefined && <SparklesIcon className="h-4 w-4 mr-2 text-blue-500" />}
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {template.description || 'No description'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                isPredefined 
                  ? 'bg-blue-100 text-blue-800'
                  : template.category === 'custom'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {isPredefined ? 'System' : template.category}
              </span>
              {showPreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewTemplate(template, isPredefined);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Preview"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Subject:</strong> {template.subject || 'No subject'}</p>
            {template.variables && template.variables.length > 0 && (
              <p className="mt-1">
                <strong>Variables:</strong> {template.variables.slice(0, 3).join(', ')}
                {template.variables.length > 3 && ` +${template.variables.length - 3} more`}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Error loading templates</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Select Email Template
          </h2>
          <p className="text-gray-600">Choose a template to start your email</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="space-y-6">
        {/* Predefined Templates */}
        {Object.keys(predefinedTemplates).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-500" />
              System Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(predefinedTemplates).map(template => 
                renderTemplateCard(template, true)
              )}
            </div>
          </div>
        )}

        {/* User Templates */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Your Templates
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredTemplates.length})
            </span>
          </h3>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'No templates found' 
                  : 'No templates yet'
                }
              </h4>
              <p className="text-gray-500">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first email template to get started'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => renderTemplateCard(template))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Template Preview: {previewTemplate.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4">
                <strong>Subject:</strong> {previewTemplate.renderedContent?.subject || previewTemplate.subject}
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div
                  dangerouslySetInnerHTML={{
                    __html: previewTemplate.renderedContent?.htmlContent || 
                           previewTemplate.html_content || 
                           previewTemplate.html
                  }}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    handleSelectTemplate(previewTemplate, previewTemplate.isPredefined);
                    setPreviewTemplate(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateSelector;
