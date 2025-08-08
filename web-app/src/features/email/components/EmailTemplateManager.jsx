import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FolderIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import emailTemplateService from '../services/emailTemplateService';
import EmailTemplateEditor from './EmailTemplateEditor';
import { useTranslation } from 'react-i18next';

const EmailTemplateManager = () => {
  const { t } = useTranslation('email');
  const [templates, setTemplates] = useState([]);
  const [predefinedTemplates, setPredefinedTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const categories = [
    { value: 'all', label: 'All Templates', icon: FolderIcon },
    { value: 'business', label: 'Business', icon: DocumentTextIcon },
    { value: 'invoice', label: 'Invoice', icon: DocumentTextIcon },
    { value: 'quote', label: 'Quote', icon: DocumentTextIcon },
    { value: 'reminder', label: 'Reminder', icon: DocumentTextIcon },
    { value: 'custom', label: 'Custom', icon: PencilIcon },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await emailTemplateService.getTemplates();
      if (result.success) {
        setTemplates(result.data || []);
        setPredefinedTemplates(result.predefined || {});
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const result = await emailTemplateService.deleteTemplate(templateId);
      if (result.success) {
        await loadTemplates();
      } else {
        alert(`Error deleting template: ${result.error}`);
      }
    } catch (error) {
      alert(`Error deleting template: ${error.message}`);
    }
  };

  const handleSaveTemplate = async (templateData) => {
    await loadTemplates();
    setShowEditor(false);
    setSelectedTemplate(null);
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderTemplateCard = (template, isPredefined = false) => (
    <div
      key={isPredefined ? `predefined-${template.name}` : template.id}
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
    >
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
          <span className={`px-2 py-1 text-xs rounded-full ${
            isPredefined 
              ? 'bg-blue-100 text-blue-800'
              : template.category === 'custom'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {isPredefined ? 'System' : template.category}
          </span>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          <p><strong>Subject:</strong> {template.subject || 'No subject'}</p>
          {template.variables && template.variables.length > 0 && (
            <p className="mt-1">
              <strong>Variables:</strong> {template.variables.join(', ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {isPredefined ? 'System Template' : `Created ${new Date(template.created_at).toLocaleDateString()}`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePreviewTemplate(template)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Preview"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {!isPredefined && (
              <>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (showEditor) {
    return (
      <EmailTemplateEditor
        template={selectedTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-2" />
            Email Templates
          </h1>
          <p className="text-gray-600">
            Create and manage email templates for your business communications
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
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

          {/* Category Filter */}
          <div className="relative">
            <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Predefined Templates */}
          {Object.keys(predefinedTemplates).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2 text-blue-500" />
                System Templates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(predefinedTemplates).map(template => 
                  renderTemplateCard(template, true)
                )}
              </div>
            </div>
          )}

          {/* User Templates */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Your Templates
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredTemplates.length})
              </span>
            </h2>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'No templates found' 
                    : 'No templates yet'
                  }
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first email template to get started'
                  }
                </p>
                {!searchQuery && selectedCategory === 'all' && (
                  <button
                    onClick={handleCreateTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Your First Template
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => renderTemplateCard(template))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Template Preview: {previewTemplate.name}</h3>
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
                <strong>Subject:</strong> {previewTemplate.subject}
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div
                  dangerouslySetInnerHTML={{
                    __html: previewTemplate.html_content || previewTemplate.html || previewTemplate.content_html
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateManager;
