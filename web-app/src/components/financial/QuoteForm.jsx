import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Copy, 
  FileText, 
  Calendar, 
  DollarSign,
  Users,
  Tag,
  AlertCircle,
  Info,
  Save,
  RefreshCw,
  Download,
  Eye,
  Mail
} from 'lucide-react';
import { QuoteService } from '@lib/quoteService';
import { QuotePdfService } from '@lib/quotePdfService';
import clientService from '@lib/clientService';
import { useUser } from '@clerk/clerk-react';
import Logger from '@utils/Logger';

/**
 * QuoteForm Component
 * Comprehensive form for creating and editing quotes with versioning, templates, and advanced features
 */
const QuoteForm = ({ 
  quote = null, // For editing existing quotes
  client = null, // Pre-selected client
  template = null, // Template to use
  isEditMode = false,
  onSave,
  onCancel,
  onError,
  className = ''
}) => {
  const { t } = useTranslation('quotes');
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Basic quote information
    client_id: '',
    template_id: '',
    pdf_template_id: 'default', // Default PDF template
    quote_number: '',
    title: '',
    description: '',
    
    // Dates
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    expiry_date: '',
    
    // Financial
    subtotal: 0,
    tax_rate: 22, // Default Italian VAT
    tax_amount: 0,
    discount_percentage: 0,
    discount_amount: 0,
    total_amount: 0,
    currency: 'EUR',
    
    // Status and workflow
    status: 'draft',
    priority: 'medium',
    
    // Enhanced features
    notes: '',
    internal_notes: '',
    terms_and_conditions: '',
    payment_terms: '30 days',
    validity_period: 30,
    
    // Versioning
    version_number: 1,
    parent_quote_id: null,
    
    // Additional metadata
    tags: [],
    category: '',
    project_name: '',
    estimated_hours: 0,
    
    // Quote items
    items: [{
      id: Date.now(),
      description: '',
      category: '',
      sku: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      discount_amount: 0,
      tax_rate: 22,
      amount: 0,
      is_optional: false,
      notes: '',
      sort_order: 1
    }]
  });

  // Initialize form data
  useEffect(() => {
    if (quote) {
      // Editing existing quote
      setFormData({
        ...quote,
        items: quote.quote_items || quote.items || [getDefaultItem()]
      });
    } else if (template) {
      // Using template
      applyTemplate(template);
    } else if (client) {
      // Pre-selected client
      setFormData(prev => ({
        ...prev,
        client_id: client.id
      }));
    }

    // Load supporting data
    loadClients();
    loadTemplates();
    loadPdfTemplates();
    generateQuoteNumber();
  }, [quote, template, client]);

  // Calculate dates based on validity period
  useEffect(() => {
    if (formData.issue_date && formData.validity_period) {
      const issueDate = new Date(formData.issue_date);
      const expiryDate = new Date(issueDate);
      expiryDate.setDate(expiryDate.getDate() + formData.validity_period);
      
      setFormData(prev => ({
        ...prev,
        expiry_date: expiryDate.toISOString().split('T')[0],
        due_date: prev.due_date || expiryDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.issue_date, formData.validity_period]);

  // Recalculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.discount_percentage, formData.tax_rate]);

  const getDefaultItem = () => ({
    id: Date.now() + Math.random(),
    description: '',
    category: '',
    sku: '',
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0,
    discount_amount: 0,
    tax_rate: formData.tax_rate || 22,
    amount: 0,
    is_optional: false,
    notes: '',
    sort_order: formData.items?.length + 1 || 1
  });

  const loadClients = async () => {
    try {
      if (!user?.id) {
        Logger.warn('User not available for loading clients');
        return;
      }

      const clientService = new ClientService();
      const result = await clientService.getClients({
        sortBy: 'full_name',
        ascending: true,
        limit: 100 // Load first 100 clients
      });
      
      if (result.error) {
        Logger.error('Error loading clients:', result.error);
        onError?.(t('errors.loadClientsFailed', 'Failed to load clients'));
        return;
      }

      // Transform client data for the form
      const transformedClients = result.data.map(client => ({
        id: client.id,
        name: client.full_name || client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        province: client.province,
        postal_code: client.postal_code,
        vat_number: client.vat_number,
        fiscal_code: client.fiscal_code
      }));

      setClients(transformedClients);
    } catch (error) {
      Logger.error('Failed to load clients:', error);
      onError?.(t('errors.loadClientsFailed', 'Failed to load clients'));
    }
  };

  const loadTemplates = async () => {
    try {
      // Load templates from localStorage (same approach as QuoteTemplateManager)
      const savedTemplates = localStorage.getItem('quote-templates');
      if (savedTemplates) {
        const templates = JSON.parse(savedTemplates);
        // Transform for QuoteForm usage
        const transformedTemplates = templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category || 'general',
          is_default: template.isDefault || false,
          title: template.name,
          terms_and_conditions: template.terms || '',
          payment_terms: 'Net 30 days',
          validity_period: 30,
          items: template.items || []
        }));
        setTemplates(transformedTemplates);
        return;
      }

      // Initialize default templates if none exist
      const defaultTemplates = [
        {
          id: 1,
          name: t('lifecycle.templates.systemMaintenance.name', 'System Maintenance'),
          description: 'Standard system maintenance template',
          category: 'service',
          items: [
            {
              description: 'Monthly system monitoring',
              quantity: 1,
              unit_price: 150,
              tax_rate: 22,
            },
            {
              description: 'Emergency support',
              quantity: 12,
              unit_price: 50,
              tax_rate: 22,
            },
          ],
          terms: t('lifecycle.templates.systemMaintenance.terms', 'Emergency interventions within 4 hours of ticket opening.'),
          isDefault: true,
        },
        {
          id: 2,
          name: t('lifecycle.templates.productSale.name', 'Product Sale'),
          description: 'Standard product sale template',
          category: 'product',
          items: [
            {
              description: 'Product item',
              quantity: 1,
              unit_price: 250,
              tax_rate: 22,
            },
            {
              description: 'Installation service',
              quantity: 1,
              unit_price: 100,
              tax_rate: 22,
            },
          ],
          terms: t('lifecycle.templates.productSale.terms', '24-month warranty on products, 12-month warranty on services.'),
          isDefault: false,
        },
        {
          id: 3,
          name: t('lifecycle.templates.customProject.name', 'Custom Project'),
          description: 'Custom project template',
          category: 'consulting',
          items: [
            {
              description: 'Project analysis',
              quantity: 1,
              unit_price: 500,
              tax_rate: 22,
            },
            {
              description: 'Development work',
              quantity: 1,
              unit_price: 1500,
              tax_rate: 22,
            },
            {
              description: 'Testing & delivery',
              quantity: 1,
              unit_price: 300,
              tax_rate: 22,
            },
          ],
          terms: t('lifecycle.templates.customProject.terms', '50% payment at start, 50% on delivery.'),
          isDefault: false,
        },
      ];

      // Save to localStorage
      localStorage.setItem('quote-templates', JSON.stringify(defaultTemplates));
      
      // Transform for QuoteForm usage
      const transformedTemplates = defaultTemplates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category || 'general',
        is_default: template.isDefault || false,
        title: template.name,
        terms_and_conditions: template.terms || '',
        payment_terms: 'Net 30 days',
        validity_period: 30,
        items: template.items || []
      }));

      setTemplates(transformedTemplates);
    } catch (error) {
      Logger.error('Failed to load templates:', error);
      onError?.(t('errors.loadTemplatesFailed', 'Failed to load templates'));
    }
  };

  const loadPdfTemplates = () => {
    try {
      // Get PDF template configurations from the service
      const templateConfigs = QuotePdfService.getTemplateConfigs();
      const pdfTemplateList = Object.values(templateConfigs).map(config => ({
        id: config.id,
        name: config.name,
        description: config.description,
        colors: config.colors
      }));
      setPdfTemplates(pdfTemplateList);
    } catch (error) {
      Logger.error('Failed to load PDF templates:', error);
      onError?.(t('errors.loadPdfTemplatesFailed', 'Failed to load PDF templates'));
    }
  };

  const generateQuoteNumber = async () => {
    try {
      if (!isEditMode && user?.id) {
        const quoteNumber = await QuoteService.generateQuoteNumber(user.id);
        setFormData(prev => ({
          ...prev,
          quote_number: quoteNumber
        }));
      }
    } catch (error) {
      Logger.error('Failed to generate quote number:', error);
    }
  };

  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      template_id: template.id,
      title: template.title,
      description: template.description,
      terms_and_conditions: template.terms_and_conditions,
      payment_terms: template.payment_terms,
      validity_period: template.validity_period,
      items: template.items?.map((item, index) => ({
        ...getDefaultItem(),
        ...item,
        id: Date.now() + index,
        sort_order: index + 1
      })) || [getDefaultItem()]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate item amount
          if (['quantity', 'unit_price', 'discount_percentage', 'discount_amount', 'tax_rate'].includes(field)) {
            const quantity = parseFloat(updatedItem.quantity) || 0;
            const unitPrice = parseFloat(updatedItem.unit_price) || 0;
            const discountPercentage = parseFloat(updatedItem.discount_percentage) || 0;
            const discountAmount = parseFloat(updatedItem.discount_amount) || 0;
            
            let subtotal = quantity * unitPrice;
            let totalDiscount = discountAmount + (subtotal * discountPercentage / 100);
            let afterDiscount = subtotal - totalDiscount;
            let taxAmount = afterDiscount * (parseFloat(updatedItem.tax_rate) || 0) / 100;
            
            updatedItem.amount = afterDiscount + taxAmount;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newItem = getDefaultItem();
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    }
  };

  const duplicateItem = (itemId) => {
    const itemToDuplicate = formData.items.find(item => item.id === itemId);
    if (itemToDuplicate) {
      const duplicatedItem = {
        ...itemToDuplicate,
        id: Date.now() + Math.random(),
        sort_order: formData.items.length + 1
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, duplicatedItem]
      }));
    }
  };

  const calculateTotals = () => {
    const itemsSubtotal = formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const discountPercentage = parseFloat(item.discount_percentage) || 0;
      const discountAmount = parseFloat(item.discount_amount) || 0;
      
      let subtotal = quantity * unitPrice;
      let totalDiscount = discountAmount + (subtotal * discountPercentage / 100);
      
      return sum + (subtotal - totalDiscount);
    }, 0);

    const globalDiscount = parseFloat(formData.discount_percentage) || 0;
    const globalDiscountAmount = parseFloat(formData.discount_amount) || 0;
    
    const subtotalAfterGlobalDiscount = itemsSubtotal - globalDiscountAmount - (itemsSubtotal * globalDiscount / 100);
    const taxAmount = subtotalAfterGlobalDiscount * (parseFloat(formData.tax_rate) || 0) / 100;
    const totalAmount = subtotalAfterGlobalDiscount + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal: itemsSubtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.client_id) errors.client_id = t('validation.clientRequired');
    if (!formData.title) errors.title = t('validation.titleRequired');
    if (!formData.issue_date) errors.issue_date = t('validation.issueDateRequired');
    if (!formData.due_date) errors.due_date = t('validation.dueDateRequired');
    if (!formData.expiry_date) errors.expiry_date = t('validation.expiryDateRequired');
    
    // Validate date logic
    const issueDate = new Date(formData.issue_date);
    const dueDate = new Date(formData.due_date);
    const expiryDate = new Date(formData.expiry_date);
    
    if (dueDate < issueDate) {
      errors.due_date = t('validation.dueDateAfterIssue');
    }
    
    if (expiryDate < issueDate) {
      errors.expiry_date = t('validation.expiryDateAfterIssue');
    }

    // Validate items
    const itemErrors = [];
    formData.items.forEach((item, index) => {
      const itemError = {};
      if (!item.description) itemError.description = t('validation.itemDescriptionRequired');
      if (!item.quantity || item.quantity <= 0) itemError.quantity = t('validation.itemQuantityRequired');
      if (!item.unit_price || item.unit_price < 0) itemError.unit_price = t('validation.itemPriceRequired');
      
      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError;
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }

    if (formData.total_amount <= 0) {
      errors.total_amount = t('validation.totalAmountRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePdfPreview = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const pdfService = new QuotePdfService();
      await pdfService.generateAndPreview(formData, {
        templateId: formData.pdf_template_id,
        userId: user?.id
      });
    } catch (error) {
      Logger.error('Failed to generate PDF preview:', error);
      onError?.(t('errors.pdfPreviewFailed', 'Failed to generate PDF preview'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const pdfService = new QuotePdfService();
      await pdfService.generateAndDownload(formData, {
        templateId: formData.pdf_template_id,
        userId: user?.id
      });
    } catch (error) {
      Logger.error('Failed to download PDF:', error);
      onError?.(t('errors.pdfDownloadFailed', 'Failed to download PDF'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleEmailQuote = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Generate PDF first
      const pdfService = new QuotePdfService();
      const pdfBlob = await pdfService.generateBlob(formData, {
        templateId: formData.pdf_template_id,
        userId: user?.id
      });

      // Here you would integrate with your email service
      // For now, we'll just show a success message
      Logger.info('PDF generated for email attachment');
      onError?.(t('success.pdfGeneratedForEmail', 'PDF generated successfully. Email integration coming soon.'));
    } catch (error) {
      Logger.error('Failed to generate PDF for email:', error);
      onError?.(t('errors.emailPdfFailed', 'Failed to generate PDF for email'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSave = async (asDraft = false) => {
    try {
      setIsSaving(true);

      // Update status if saving as draft
      const dataToSave = {
        ...formData,
        status: asDraft ? 'draft' : formData.status
      };

      if (!asDraft && !validateForm()) {
        return;
      }

      let result;
      if (isEditMode && quote) {
        result = await QuoteService.updateQuote(quote.id, dataToSave);
      } else {
        result = await QuoteService.createQuote(dataToSave);
      }

      onSave?.(result);
    } catch (error) {
      Logger.error('Failed to save quote:', error);
      onError?.(error.message || t('errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? t('form.editQuote') : t('form.createQuote')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? t('form.editDescription') : t('form.createDescription')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {formData.quote_number && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {formData.quote_number}
              </span>
            )}
            {isEditMode && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                v{formData.version_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.client')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => handleInputChange('client_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.client_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('form.selectClient')}</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {validationErrors.client_id && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.client_id}</p>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.template')}
            </label>
            <select
              value={formData.template_id}
              onChange={(e) => {
                const selectedTemplate = templates.find(t => t.id === e.target.value);
                if (selectedTemplate) {
                  applyTemplate(selectedTemplate);
                } else {
                  handleInputChange('template_id', e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('form.selectTemplate')}</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quote Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('form.titlePlaceholder')}
            />
            {validationErrors.title && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.category')}
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('form.categoryPlaceholder')}
            />
          </div>
        </div>

        {/* PDF Template and Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {t('form.pdfSettings', 'PDF Settings')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PDF Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.pdfTemplate', 'PDF Template')}
              </label>
              <select
                value={formData.pdf_template_id}
                onChange={(e) => handleInputChange('pdf_template_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {pdfTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {pdfTemplates.find(t => t.id === formData.pdf_template_id) && (
                <p className="text-sm text-gray-600 mt-1">
                  {pdfTemplates.find(t => t.id === formData.pdf_template_id).description}
                </p>
              )}
            </div>

            {/* PDF Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.pdfActions', 'PDF Actions')}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePdfPreview}
                  disabled={isGeneratingPdf || !formData.title || !formData.client_id}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="text-sm">{t('form.preview', 'Preview')}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePdfDownload}
                  disabled={isGeneratingPdf || !formData.title || !formData.client_id}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="text-sm">{t('form.download', 'Download')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEmailQuote}
                  disabled={isGeneratingPdf || !formData.title || !formData.client_id}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span className="text-sm">{t('form.email', 'Email')}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('form.pdfActionsNote', 'PDF actions require title and client to be selected')}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('form.descriptionPlaceholder')}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.issueDate')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.issue_date}
              onChange={(e) => handleInputChange('issue_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.issue_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.issue_date && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.issue_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.dueDate')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.due_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.due_date && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.due_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.expiryDate')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.expiry_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.expiry_date && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.expiry_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.validityPeriod')}
            </label>
            <div className="flex">
              <input
                type="number"
                value={formData.validity_period}
                onChange={(e) => handleInputChange('validity_period', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                {t('form.days')}
              </span>
            </div>
          </div>
        </div>

        {/* Quote Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('form.items')}</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('form.addItem')}</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.itemDescription')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.items?.[index]?.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('form.itemDescriptionPlaceholder')}
                    />
                    {validationErrors.items?.[index]?.description && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.items[index].description}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.quantity')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.items?.[index]?.quantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {validationErrors.items?.[index]?.quantity && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.items[index].quantity}</p>
                    )}
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.unitPrice')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.items?.[index]?.unit_price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {validationErrors.items?.[index]?.unit_price && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.items[index].unit_price}</p>
                    )}
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.discount')} (%)
                    </label>
                    <input
                      type="number"
                      value={item.discount_percentage}
                      onChange={(e) => handleItemChange(item.id, 'discount_percentage', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.amount')}
                    </label>
                    <input
                      type="number"
                      value={item.amount.toFixed(2)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                {/* Item Actions */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.is_optional}
                        onChange={(e) => handleItemChange(item.id, 'is_optional', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{t('form.optionalItem')}</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => duplicateItem(item.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={t('form.duplicateItem')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={formData.items.length <= 1}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('form.removeItem')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('form.financialSummary')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.globalDiscount')} (%)
              </label>
              <input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.taxRate')} (%)
              </label>
              <input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('form.subtotal')}:</span>
              <span className="font-medium">{formData.currency} {formData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('form.tax')}:</span>
              <span className="font-medium">{formData.currency} {formData.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-gray-900 border-t border-gray-200 pt-2">
              <span>{t('form.total')}:</span>
              <span>{formData.currency} {formData.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('form.notesPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.termsAndConditions')}
            </label>
            <textarea
              value={formData.terms_and_conditions}
              onChange={(e) => handleInputChange('terms_and_conditions', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('form.termsPlaceholder')}
            />
          </div>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">{t('status.draft')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="sent">{t('status.sent')}</option>
              <option value="accepted">{t('status.accepted')}</option>
              <option value="rejected">{t('status.rejected')}</option>
              <option value="expired">{t('status.expired')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.priority')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">{t('priority.low')}</option>
              <option value="medium">{t('priority.medium')}</option>
              <option value="high">{t('priority.high')}</option>
              <option value="urgent">{t('priority.urgent')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.paymentTerms')}
            </label>
            <select
              value={formData.payment_terms}
              onChange={(e) => handleInputChange('payment_terms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="immediate">{t('paymentTerms.immediate')}</option>
              <option value="15 days">{t('paymentTerms.15days')}</option>
              <option value="30 days">{t('paymentTerms.30days')}</option>
              <option value="45 days">{t('paymentTerms.45days')}</option>
              <option value="60 days">{t('paymentTerms.60days')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {validationErrors.total_amount && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span>{validationErrors.total_amount}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('form.cancel')}
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{t('form.saveAsDraft')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditMode ? t('form.updateQuote') : t('form.createQuote')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteForm; 