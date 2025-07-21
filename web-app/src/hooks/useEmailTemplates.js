import { useState, useEffect, useCallback } from 'react';
import emailTemplateService from '@lib/emailTemplateService';

/**
 * Custom hook for managing email templates
 * Provides CRUD operations and state management for email templates
 */
export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [predefinedTemplates, setPredefinedTemplates] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailTemplateService.getTemplates();
      if (result.success) {
        setTemplates(result.data || []);
        setPredefinedTemplates(result.predefined || {});
      } else {
        setError(result.error || 'Failed to load templates');
      }
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create or update a template
  const saveTemplate = useCallback(async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailTemplateService.saveTemplate(templateData);
      if (result.success) {
        // Refresh templates list
        await loadTemplates();
        return result;
      } else {
        setError(result.error || 'Failed to save template');
        return result;
      }
    } catch (err) {
      const error = err.message || 'Failed to save template';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  // Delete a template
  const deleteTemplate = useCallback(async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailTemplateService.deleteTemplate(templateId);
      if (result.success) {
        // Remove from local state
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        return result;
      } else {
        setError(result.error || 'Failed to delete template');
        return result;
      }
    } catch (err) {
      const error = err.message || 'Failed to delete template';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Render a template with variables
  const renderTemplate = useCallback((template, variables = {}) => {
    try {
      return emailTemplateService.renderTemplate(template, variables);
    } catch (err) {
      setError(err.message || 'Failed to render template');
      return { success: false, error: err.message };
    }
  }, []);

  // Get available template variables
  const getAvailableVariables = useCallback(() => {
    return emailTemplateService.getAvailableVariables();
  }, []);

  // Get templates by category
  const getTemplatesByCategory = useCallback((category) => {
    if (category === 'all') return templates;
    return templates.filter(template => template.category === category);
  }, [templates]);

  // Search templates
  const searchTemplates = useCallback((query) => {
    if (!query.trim()) return templates;
    
    const searchTerm = query.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.description?.toLowerCase().includes(searchTerm) ||
      template.subject?.toLowerCase().includes(searchTerm)
    );
  }, [templates]);

  // Get template by ID
  const getTemplateById = useCallback((templateId) => {
    return templates.find(template => template.id === templateId);
  }, [templates]);

  // Validate template for email compatibility
  const validateTemplate = useCallback((htmlContent) => {
    return emailTemplateService.validateTemplate(htmlContent);
  }, []);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    // State
    templates,
    predefinedTemplates,
    loading,
    error,
    
    // Actions
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    renderTemplate,
    
    // Utilities
    getAvailableVariables,
    getTemplatesByCategory,
    searchTemplates,
    getTemplateById,
    validateTemplate,
    
    // Computed values
    templateCount: templates.length,
    categories: [...new Set(templates.map(t => t.category))],
  };
};

export default useEmailTemplates;