import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { X, Eye, Download, Mail, Plus, Trash2, Calendar } from 'lucide-react';
import InvoiceService from '../services/invoiceService';
import ClientService from '../../clients/services/clientService';
import Logger from '@utils/Logger';
import { getUserIdForUuidTables } from '@shared/utils/userIdConverter';

/**
 * InvoiceForm Component
 * Comprehensive form for creating and editing invoices with the same design as QuoteForm
 */
const InvoiceForm = ({
  invoice = null,
  client = null,
  template = null,
  isEditMode = false,
  onSave,
  onCancel,
  onError,
  className = '',
}) => {
  const { t } = useTranslation('invoices');
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [pdfTemplates, setPdfTemplates] = useState([]);

  // Default item structure
  function getDefaultItem() {
    return {
      id: Date.now() + Math.random(),
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 22,
      total: 0,
      sort_order: 1,
    };
  }

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    template_id: '',
    pdf_template_id: 'default',
    invoice_number: '',
    title: '',
    description: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: 0,
    tax_rate: 22,
    tax_amount: 0,
    discount_percentage: 0,
    discount_amount: 0,
    total_amount: 0,
    currency: 'EUR',
    status: 'draft',
    priority: 'medium',
    notes: '',
    internal_notes: '',
    terms_and_conditions: '',
    payment_terms: '30 days',
    items: [getDefaultItem()],
  });

  // Load data on component mount
  useEffect(() => {
    if (user?.id) {
      loadInitialData();
      if (!isEditMode) {
        generateInvoiceNumber();
      }
    }
  }, [user?.id, isEditMode]);

  // Pre-fill client if provided
  useEffect(() => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: client.id,
      }));
    }
  }, [client]);

  // Pre-fill invoice data if editing
  useEffect(() => {
    if (isEditMode && invoice) {
      setFormData({
        ...invoice,
        issue_date: invoice.issue_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date?.split('T')[0] || '',
        items: invoice.items?.length > 0 ? invoice.items : [getDefaultItem()],
      });
    }
  }, [isEditMode, invoice]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const dbUserId = getUserIdForUuidTables(user.id);

      // Load clients
      Logger.info('Loading clients for user:', dbUserId);
      const clientsResult = await ClientService.getClients(dbUserId);
      Logger.info('Clients result:', clientsResult);
      if (clientsResult.success) {
        setClients(clientsResult.clients);
        Logger.info('Clients loaded:', clientsResult.clients.length);
      } else {
        Logger.error('Failed to load clients:', clientsResult.error);
      }

      // Load templates
      setTemplates([
        { id: 'standard', name: 'Standard Invoice', description: 'Standard invoice template' },
        { id: 'service', name: 'Service Invoice', description: 'Service-based invoice template' },
        { id: 'product', name: 'Product Invoice', description: 'Product-based invoice template' },
      ]);

      // Load PDF templates
      setPdfTemplates([
        { id: 'default', name: 'Default Template', description: 'Standard PDF template' },
        { id: 'modern', name: 'Modern Template', description: 'Modern design template' },
        { id: 'classic', name: 'Classic Template', description: 'Classic business template' },
      ]);
    } catch (error) {
      Logger.error('Failed to load initial data:', error);
      onError?.(error.message || t('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      if (!isEditMode && user?.id) {
        const dbUserId = getUserIdForUuidTables(user.id);
        const invoiceNumber = await InvoiceService.generateInvoiceNumber(dbUserId);
        setFormData(prev => ({
          ...prev,
          invoice_number: invoiceNumber,
        }));
      }
    } catch (error) {
      Logger.error('Failed to generate invoice number:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }

    // Auto-calculate due date when issue date changes
    if (field === 'issue_date' && value) {
      const issueDate = new Date(value);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        due_date: dueDate.toISOString().split('T')[0],
      }));
    }
  };

  const handleClientChange = clientId => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      currency: selectedClient?.currency || 'EUR',
    }));
  };

  const addItem = () => {
    const newItem = {
      ...getDefaultItem(),
      id: Date.now() + Math.random(),
      sort_order: formData.items.length + 1,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = itemId => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      }));
    }
  };

  const updateItem = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unit_price || 0);
          }

          return updatedItem;
        }
        return item;
      }),
    }));
  };

  // Calculate totals
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = (subtotal * (formData.discount_percentage || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (formData.tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: total,
    }));
  }, [formData.items, formData.discount_percentage, formData.tax_rate]);

  const validateForm = () => {
    const errors = {};

    if (!formData.client_id) errors.client_id = t('form.clientRequired');
    if (!formData.title) errors.title = t('form.titleRequired');
    if (!formData.issue_date) errors.issue_date = t('form.issueDateRequired');
    if (!formData.due_date) errors.due_date = t('form.dueDateRequired');
    if (formData.items.length === 0) errors.items = t('form.atLeastOneItemRequired');

    formData.items.forEach((item, index) => {
      if (!item.description)
        errors[`item_${index}_description`] = t('form.itemDescriptionRequired');
      if (!item.quantity || item.quantity <= 0)
        errors[`item_${index}_quantity`] = t('form.validQuantityRequired');
      if (!item.unit_price || item.unit_price <= 0)
        errors[`item_${index}_unit_price`] = t('form.validUnitPriceRequired');
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (asDraft = false) => {
    try {
      setIsSaving(true);

      const dataToSave = {
        ...formData,
        status: asDraft ? 'draft' : formData.status,
        user_id: getUserIdForUuidTables(user.id),
      };

      if (!asDraft && !validateForm()) {
        return;
      }

      let result;
      if (isEditMode && invoice) {
        result = await InvoiceService.updateInvoice(
          invoice.id,
          dataToSave,
          dataToSave.items,
          dataToSave.user_id,
        );
      } else {
        result = await InvoiceService.createInvoice(
          dataToSave,
          dataToSave.items,
          dataToSave.user_id,
        );
      }

      onSave?.(result);
    } catch (error) {
      Logger.error('Failed to save invoice:', error);
      onError?.(error.message || t('errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      {/* Header */}
      <div className='border-b border-gray-200 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              {isEditMode ? t('form.editInvoice') : t('form.createInvoice')}
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              {isEditMode ? t('form.editDescription') : t('form.createDescription')}
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            {formData.invoice_number && (
              <span className='px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full'>
                {formData.invoice_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className='p-6 space-y-6'>
        {/* Basic Information Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Client Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('form.client')} <span className='text-red-500'>*</span>
            </label>
            <select
              value={formData.client_id}
              onChange={e => handleClientChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.client_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value=''>{t('form.selectClient')}</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.full_name || client.company_name}
                </option>
              ))}
            </select>
            {validationErrors.client_id && (
              <p className='text-red-500 text-sm mt-1'>{validationErrors.client_id}</p>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('form.template')}
            </label>
            <select
              value={formData.template_id}
              onChange={e => handleInputChange('template_id', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>{t('form.selectTemplate')}</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {t(`templates.${template.id}`, template.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title and Category Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Title */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('form.title')} <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.title && (
              <p className='text-red-500 text-sm mt-1'>{validationErrors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('form.category')}
            </label>
            <input
              type='text'
              value={formData.category || ''}
              onChange={e => handleInputChange('category', e.target.value)}
              placeholder={t('form.categoryPlaceholder')}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
        </div>

        {/* PDF Settings */}
        <div className='border border-gray-200 rounded-lg p-4'>
          <div className='flex items-center mb-4'>
            <Eye className='w-5 h-5 text-gray-600 mr-2' />
            <h3 className='text-lg font-medium text-gray-900'>{t('form.pdfSettings')}</h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* PDF Template */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('form.pdfTemplate')}
              </label>
              <select
                value={formData.pdf_template_id}
                onChange={e => handleInputChange('pdf_template_id', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                {pdfTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {t(`pdfTemplates.${template.id}`, template.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* PDF Actions */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('form.pdfActions')}
              </label>
              <div className='flex space-x-2'>
                <button
                  type='button'
                  disabled={!formData.title || !formData.client_id}
                  className='flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Eye className='w-4 h-4 mr-1' />
                  {t('form.preview')}
                </button>
                <button
                  type='button'
                  disabled={!formData.title || !formData.client_id}
                  className='flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Download className='w-4 h-4 mr-1' />
                  {t('form.download')}
                </button>
                <button
                  type='button'
                  disabled={!formData.title || !formData.client_id}
                  className='flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Mail className='w-4 h-4 mr-1' />
                  {t('form.email')}
                </button>
              </div>
              {(!formData.title || !formData.client_id) && (
                <p className='text-sm text-gray-500 mt-1'>{t('form.pdfActionsRequire')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            {t('form.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder={t('form.descriptionPlaceholder')}
            rows={4}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {/* Dates Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <div>
            <label
              htmlFor='issue_date'
              className='block text-sm font-medium text-gray-700 mb-1 required'
            >
              {t('form.issue_date')}
            </label>
            <div className='relative'>
              <input
                type='date'
                id='issue_date'
                value={formData.issue_date}
                onChange={e => handleInputChange('issue_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.issue_date ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
            </div>
            {validationErrors.issue_date && (
              <p className='text-red-500 text-xs mt-1'>{validationErrors.issue_date}</p>
            )}
          </div>
          <div>
            <label htmlFor='due_date' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('form.due_date')}
            </label>
            <div className='relative'>
              <input
                type='date'
                id='due_date'
                value={formData.due_date}
                onChange={e => handleInputChange('due_date', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className='border border-gray-200 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium text-gray-900'>{t('form.items')}</h3>
            <button
              type='button'
              onClick={addItem}
              className='flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              <Plus className='w-4 h-4 mr-1' />
              {t('form.addItem')}
            </button>
          </div>

          <div className='space-y-4'>
            {formData.items.map((item, index) => (
              <div
                key={item.id}
                className='grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg'
              >
                {/* Description */}
                <div className='col-span-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('form.itemDescription')}
                  </label>
                  <input
                    type='text'
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder={t('form.itemDescriptionPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors[`item_${index}_description`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Quantity */}
                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('form.quantity')}
                  </label>
                  <input
                    type='number'
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min='0'
                    step='0.01'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors[`item_${index}_quantity`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Unit Price */}
                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('form.unitPrice')}
                  </label>
                  <input
                    type='number'
                    value={item.unit_price}
                    onChange={e =>
                      updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)
                    }
                    min='0'
                    step='0.01'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors[`item_${index}_unit_price`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Total */}
                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('form.total')}
                  </label>
                  <input
                    type='text'
                    value={`€{(item.total || 0).toFixed(2)}`}
                    readOnly
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700'
                  />
                </div>

                {/* Remove Button */}
                <div className='col-span-12 mt-2 flex justify-end'>
                  <button
                    type='button'
                    onClick={() => removeItem(item.id)}
                    disabled={formData.items.length === 1}
                    className='p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className='bg-gray-50 rounded-lg p-4 mt-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              {t('form.financialSummary', 'Financial Summary')}
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('form.globalDiscount', 'Global Discount')} (%)
                </label>
                <input
                  type='number'
                  value={formData.discount_percentage}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      discount_percentage: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  min='0'
                  max='100'
                  step='0.01'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('form.taxRate', 'Aliquota IVA')} (%)
                </label>
                <input
                  type='number'
                  value={formData.tax_rate}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  min='0'
                  max='100'
                  step='0.01'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('form.currency', 'Currency')}
                </label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='EUR'>EUR (€)</option>
                  <option value='USD'>USD ($)</option>
                  <option value='GBP'>GBP (£)</option>
                </select>
              </div>
            </div>

            <div className='border-t border-gray-200 pt-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>{t('form.subtotal')}:</span>
                <span className='font-medium'>
                  {formData.currency} {formData.subtotal.toFixed(2)}
                </span>
              </div>
              {formData.discount_percentage > 0 && (
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>
                    {t('form.discount')} ({formData.discount_percentage}%):
                  </span>
                  <span className='font-medium'>
                    -{formData.currency} {formData.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>{t('form.tax')}:</span>
                <span className='font-medium'>
                  {formData.currency} {formData.tax_amount.toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-lg font-semibold text-gray-900 border-t border-gray-200 pt-2'>
                <span>{t('form.total')}:</span>
                <span>
                  {formData.currency} {formData.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end space-x-4 pt-6 border-t'>
          <button
            type='button'
            onClick={onCancel}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
          >
            {t('form.cancel')}
          </button>
          <button
            type='button'
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50'
          >
            {t('form.saveAsDraft')}
          </button>
          <button
            type='button'
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
          >
            {isSaving
              ? t('form.saving')
              : isEditMode
                ? t('form.updateInvoice')
                : t('form.createInvoiceButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
