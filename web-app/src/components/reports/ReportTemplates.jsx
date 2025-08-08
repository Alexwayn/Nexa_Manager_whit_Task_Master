/**
 * Report Templates Component
 * Manages report templates for quick report generation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  Save,
  X,
  Eye,
  Settings,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Table
} from 'lucide-react';

const ReportTemplates = ({
  templates = [],
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onApplyTemplate,
  onExportTemplate,
  onImportTemplate,
  availableFields = [],
  availableCharts = [],
  className = ''
}) => {
  const { t } = useTranslation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'custom',
    config: {
      fields: [],
      filters: [],
      groupBy: [],
      sortBy: [],
      charts: [],
      layout: 'standard',
      pageSize: 50,
      exportFormats: ['pdf', 'excel'],
      scheduling: {
        enabled: false,
        frequency: 'daily',
        time: '09:00',
        recipients: []
      }
    },
    isPublic: false,
    tags: []
  });

  // Template categories
  const categories = [
    { value: 'all', label: t('templates.allCategories') },
    { value: 'financial', label: t('templates.financial') },
    { value: 'operational', label: t('templates.operational') },
    { value: 'analytics', label: t('templates.analytics') },
    { value: 'compliance', label: t('templates.compliance') },
    { value: 'custom', label: t('templates.custom') }
  ];

  // Chart type icons
  const chartIcons = {
    bar: BarChart3,
    line: TrendingUp,
    pie: PieChart,
    table: Table
  };

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  /**
   * Reset template form
   */
  const resetForm = useCallback(() => {
    setTemplateForm({
      name: '',
      description: '',
      category: 'custom',
      config: {
        fields: [],
        filters: [],
        groupBy: [],
        sortBy: [],
        charts: [],
        layout: 'standard',
        pageSize: 50,
        exportFormats: ['pdf', 'excel'],
        scheduling: {
          enabled: false,
          frequency: 'daily',
          time: '09:00',
          recipients: []
        }
      },
      isPublic: false,
      tags: []
    });
  }, []);

  /**
   * Handle create template
   */
  const handleCreateTemplate = useCallback(() => {
    if (!templateForm.name.trim()) return;
    
    const newTemplate = {
      id: Date.now(),
      ...templateForm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user', // Replace with actual user
      usageCount: 0
    };
    
    if (onCreateTemplate) {
      onCreateTemplate(newTemplate);
    }
    
    resetForm();
    setShowCreateDialog(false);
  }, [templateForm, onCreateTemplate, resetForm]);

  /**
   * Handle update template
   */
  const handleUpdateTemplate = useCallback(() => {
    if (!editingTemplate || !templateForm.name.trim()) return;
    
    const updatedTemplate = {
      ...editingTemplate,
      ...templateForm,
      updatedAt: new Date().toISOString()
    };
    
    if (onUpdateTemplate) {
      onUpdateTemplate(updatedTemplate);
    }
    
    resetForm();
    setEditingTemplate(null);
  }, [editingTemplate, templateForm, onUpdateTemplate, resetForm]);

  /**
   * Start editing template
   */
  const startEditing = useCallback((template) => {
    setTemplateForm({ ...template });
    setEditingTemplate(template);
  }, []);

  /**
   * Handle duplicate template
   */
  const handleDuplicateTemplate = useCallback((template) => {
    const duplicatedTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    
    if (onCreateTemplate) {
      onCreateTemplate(duplicatedTemplate);
    }
  }, [onCreateTemplate]);

  /**
   * Handle field selection change
   */
  const handleFieldChange = useCallback((fieldName, checked) => {
    setTemplateForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        fields: checked
          ? [...prev.config.fields, fieldName]
          : prev.config.fields.filter(f => f !== fieldName)
      }
    }));
  }, []);

  /**
   * Handle chart configuration
   */
  const handleChartChange = useCallback((chartConfig) => {
    setTemplateForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        charts: [...prev.config.charts, chartConfig]
      }
    }));
  }, []);

  /**
   * Remove chart from template
   */
  const removeChart = useCallback((chartIndex) => {
    setTemplateForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        charts: prev.config.charts.filter((_, index) => index !== chartIndex)
      }
    }));
  }, []);

  /**
   * Handle tag input
   */
  const handleTagInput = useCallback((e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim();
      if (!templateForm.tags.includes(newTag)) {
        setTemplateForm(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  }, [templateForm.tags]);

  /**
   * Remove tag
   */
  const removeTag = useCallback((tagToRemove) => {
    setTemplateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  /**
   * Render template card
   */
  const renderTemplateCard = useCallback((template) => {
    const IconComponent = chartIcons[template.config.charts[0]?.type] || FileText;
    
    return (
      <div key={template.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPreviewTemplate(template)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title={t('common.preview')}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => startEditing(template)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title={t('common.edit')}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDuplicateTemplate(template)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title={t('common.duplicate')}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteTemplate && onDeleteTemplate(template.id)}
              className="p-1 text-red-500 hover:bg-red-100 rounded"
              title={t('common.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
            {categories.find(c => c.value === template.category)?.label}
          </span>
          <span>{t('templates.usedTimes', { count: template.usageCount })}</span>
        </div>
        
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {t('templates.lastUpdated')}: {new Date(template.updatedAt).toLocaleDateString()}
          </div>
          <button
            onClick={() => onApplyTemplate && onApplyTemplate(template)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            {t('templates.apply')}
          </button>
        </div>
      </div>
    );
  }, [categories, chartIcons, t, startEditing, handleDuplicateTemplate, onDeleteTemplate, onApplyTemplate]);

  /**
   * Render template form
   */
  const renderTemplateForm = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('templates.name')} *
          </label>
          <input
            type="text"
            value={templateForm.name}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
            placeholder={t('templates.enterName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('templates.category')}
          </label>
          <select
            value={templateForm.category}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
          >
            {categories.filter(c => c.value !== 'all').map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('templates.description')}
        </label>
        <textarea
          value={templateForm.description}
          onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder={t('templates.enterDescription')}
        />
      </div>

      {/* Fields Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('templates.includeFields')}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-3">
          {availableFields.map(field => (
            <label key={field.name} className="flex items-center">
              <input
                type="checkbox"
                checked={templateForm.config.fields.includes(field.name)}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">{field.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Charts Configuration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('templates.charts')}
        </label>
        <div className="space-y-2">
          {templateForm.config.charts.map((chart, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-sm">{chart.type} - {chart.title}</span>
              <button
                onClick={() => removeChart(index)}
                className="p-1 text-red-500 hover:bg-red-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleChartChange({
                  type: e.target.value,
                  title: `${e.target.value} Chart`,
                  field: templateForm.config.fields[0] || ''
                });
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">{t('templates.addChart')}</option>
            {availableCharts.map(chart => (
              <option key={chart.type} value={chart.type}>
                {chart.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Layout and Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('templates.layout')}
          </label>
          <select
            value={templateForm.config.layout}
            onChange={(e) => setTemplateForm(prev => ({
              ...prev,
              config: { ...prev.config, layout: e.target.value }
            }))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="standard">{t('templates.standardLayout')}</option>
            <option value="compact">{t('templates.compactLayout')}</option>
            <option value="detailed">{t('templates.detailedLayout')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('templates.pageSize')}
          </label>
          <input
            type="number"
            value={templateForm.config.pageSize}
            onChange={(e) => setTemplateForm(prev => ({
              ...prev,
              config: { ...prev.config, pageSize: parseInt(e.target.value) || 50 }
            }))}
            className="w-full px-3 py-2 border rounded-md"
            min="10"
            max="1000"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('templates.tags')}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {templateForm.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
              {tag}
              <button onClick={() => removeTag(tag)} className="text-blue-500 hover:text-blue-700">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          onKeyPress={handleTagInput}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('templates.addTag')}
        />
      </div>

      {/* Public/Private */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={templateForm.isPublic}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            {t('templates.makePublic')}
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {t('templates.publicDescription')}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">{t('reports.templates')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExportTemplate && onExportTemplate()}
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            {t('templates.export')}
          </button>
          <button
            onClick={() => onImportTemplate && onImportTemplate()}
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            {t('templates.import')}
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            {t('templates.create')}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('templates.searchTemplates')}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(renderTemplateCard)}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('templates.noTemplates')}</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {editingTemplate ? t('templates.editTemplate') : t('templates.createTemplate')}
              </h3>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {renderTemplateForm()}
            
            <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                disabled={!templateForm.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTemplate ? t('common.update') : t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{t('templates.preview')}: {previewTemplate.name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('templates.description')}</h4>
                <p className="text-gray-600">{previewTemplate.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('templates.includedFields')}</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.config.fields.map(field => (
                    <span key={field} className="px-2 py-1 bg-gray-100 text-sm rounded">
                      {availableFields.find(f => f.name === field)?.label || field}
                    </span>
                  ))}
                </div>
              </div>
              
              {previewTemplate.config.charts.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{t('templates.charts')}</h4>
                  <div className="space-y-2">
                    {previewTemplate.config.charts.map((chart, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm">{chart.type} - {chart.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t('templates.layout')}:</span>
                  <span className="ml-2">{previewTemplate.config.layout}</span>
                </div>
                <div>
                  <span className="font-medium">{t('templates.pageSize')}:</span>
                  <span className="ml-2">{previewTemplate.config.pageSize}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => {
                  onApplyTemplate && onApplyTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t('templates.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTemplates;
