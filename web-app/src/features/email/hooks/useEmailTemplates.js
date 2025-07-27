import { useState, useEffect, useCallback } from 'react';
import { emailTemplateService } from '@features/email';
import { useEmailContext } from '@shared/hooks/providers';

/**
 * Enhanced custom hook for managing email templates
 * Provides CRUD operations and state management for email templates with context integration
 */
export const useEmailTemplates = () => {
  const {
    templates: contextTemplates,
    templatesLoading,
    templatesError,
    loadTemplates,
    dispatch,
  } = useEmailContext();

  const [predefinedTemplates, setPredefinedTemplates] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Use context templates or fallback to local state
  const templates = contextTemplates;
  const loading = templatesLoading || localLoading;
  const error = templatesError || localError;

  // Load all templates (enhanced to work with context)
  const loadAllTemplates = useCallback(async () => {
    setLocalLoading(true);
    setLocalError(null);
    try {
      const result = await emailTemplateService.getTemplates();
      if (result.success) {
        // Update context templates
        dispatch({
          type: 'SET_TEMPLATES',
          payload: { templates: result.data || [] },
        });
        setPredefinedTemplates(result.predefined || {});
      } else {
        setLocalError(result.error || 'Failed to load templates');
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to load templates');
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  // Create or update a template
  const saveTemplate = useCallback(async (templateData) => {
    setLocalLoading(true);
    setLocalError(null);
    try {
      const result = await emailTemplateService.saveTemplate(templateData);
      if (result.success) {
        if (templateData.id) {
          // Update existing template in context
          dispatch({
            type: 'UPDATE_TEMPLATE',
            payload: {
              templateId: templateData.id,
              updates: result.data,
            },
          });
        } else {
          // Add new template to context
          dispatch({
            type: 'ADD_TEMPLATE',
            payload: { template: result.data },
          });
        }
        return result;
      } else {
        setLocalError(result.error || 'Failed to save template');
        return result;
      }
    } catch (err) {
      const error = err.message || 'Failed to save template';
      setLocalError(error);
      return { success: false, error };
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  // Delete a template
  const deleteTemplate = useCallback(async (templateId) => {
    setLocalLoading(true);
    setLocalError(null);
    try {
      const result = await emailTemplateService.deleteTemplate(templateId);
      if (result.success) {
        // Remove from context
        dispatch({
          type: 'REMOVE_TEMPLATE',
          payload: { templateId },
        });
        return result;
      } else {
        setLocalError(result.error || 'Failed to delete template');
        return result;
      }
    } catch (err) {
      const error = err.message || 'Failed to delete template';
      setLocalError(error);
      return { success: false, error };
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  // Render a template with variables
  const renderTemplate = useCallback((template, variables = {}) => {
    try {
      return emailTemplateService.renderTemplate(template, variables);
    } catch (err) {
      setLocalError(err.message || 'Failed to render template');
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

  // Load templates on mount if not already loaded
  useEffect(() => {
    if (templates.length === 0 && !loading) {
      loadAllTemplates();
    }
  }, [templates.length, loading, loadAllTemplates]);

  return {
    // State
    templates,
    predefinedTemplates,
    loading,
    error,
    
    // Actions
    loadTemplates: loadAllTemplates,
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