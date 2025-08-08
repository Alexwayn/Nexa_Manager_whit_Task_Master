import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, DocumentPlusIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const RequestDocumentModal = ({ isOpen, onClose, onSubmitRequest, currentPath = '' }) => {
  const { t } = useTranslation('documents');
  
  // Form state
  const [formData, setFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    documentType: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Document types options
  const documentTypes = [
    { value: 'contract', label: t('modals.requestDocument.documentTypes.contract', 'Contract') },
    { value: 'invoice', label: t('modals.requestDocument.documentTypes.invoice', 'Invoice') },
    { value: 'receipt', label: t('modals.requestDocument.documentTypes.receipt', 'Receipt') },
    { value: 'report', label: t('modals.requestDocument.documentTypes.report', 'Report') },
    { value: 'other', label: t('modals.requestDocument.documentTypes.other', 'Other') }
  ];

  // Priority options
  const priorities = [
    { value: 'low', label: t('modals.requestDocument.priorities.low', 'Low') },
    { value: 'medium', label: t('modals.requestDocument.priorities.medium', 'Medium') },
    { value: 'high', label: t('modals.requestDocument.priorities.high', 'High') }
  ];

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Email validation
    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = t('modals.requestDocument.validation.emailRequired', 'Email is required');
    } else if (!validateEmail(formData.recipientEmail)) {
      newErrors.recipientEmail = t('modals.requestDocument.validation.emailInvalid', 'Please enter a valid email');
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = t('modals.requestDocument.validation.descriptionRequired', 'Description is required');
    }

    // Due date validation
    if (!formData.dueDate) {
      newErrors.dueDate = t('modals.requestDocument.validation.dueDateRequired', 'Due date is required');
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = t('modals.requestDocument.validation.dueDatePast', 'Due date cannot be in the past');
      }
    }

    return newErrors;
  }, [formData, t]);

  // Real-time validation
  const validateField = useCallback((fieldName, value) => {
    const fieldErrors = {};

    switch (fieldName) {
      case 'recipientEmail':
        if (!value.trim()) {
          fieldErrors.recipientEmail = t('modals.requestDocument.validation.emailRequired', 'Email is required');
        } else if (!validateEmail(value)) {
          fieldErrors.recipientEmail = t('modals.requestDocument.validation.emailInvalid', 'Please enter a valid email');
        }
        break;
      case 'description':
        if (!value.trim()) {
          fieldErrors.description = t('modals.requestDocument.validation.descriptionRequired', 'Description is required');
        }
        break;
      case 'dueDate':
        if (!value) {
          fieldErrors.dueDate = t('modals.requestDocument.validation.dueDateRequired', 'Due date is required');
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate < today) {
            fieldErrors.dueDate = t('modals.requestDocument.validation.dueDatePast', 'Due date cannot be in the past');
          }
        }
        break;
    }

    return fieldErrors;
  }, [t]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time validation for touched fields
    if (touched[field]) {
      const fieldErrors = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        ...fieldErrors,
        [field]: fieldErrors[field] || undefined
      }));
    }
  };

  // Handle field blur (mark as touched)
  const handleFieldBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    const fieldErrors = validateField(field, formData[field]);
    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      // Mark all fields as touched to show validation errors
      setTouched({
        recipientEmail: true,
        description: true,
        dueDate: true
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        ...formData,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        path: currentPath
      };

      await onSubmitRequest(requestData);
      handleClose();
    } catch (error) {
      console.error('Request submission failed:', error);
      setErrors({
        submit: error.message || t('modals.requestDocument.validation.submitFailed', 'Failed to send request')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing during submission
    
    // Reset form state
    setFormData({
      recipientEmail: '',
      recipientName: '',
      documentType: '',
      description: '',
      dueDate: '',
      priority: 'medium'
    });
    setErrors({});
    setTouched({});
    onClose();
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                  <DocumentPlusIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {t('modals.requestDocument.title', 'Request Document')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('modals.requestDocument.description', 'Request documents from clients or team members')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recipient Email */}
              <div>
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700">
                  {t('modals.requestDocument.recipientEmail', 'Recipient Email')} *
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                  onBlur={() => handleFieldBlur('recipientEmail')}
                  placeholder={t('modals.requestDocument.placeholders.email', 'Enter recipient email')}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm ${
                    errors.recipientEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.recipientEmail && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.recipientEmail}
                  </p>
                )}
              </div>

              {/* Recipient Name (Optional) */}
              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">
                  {t('modals.requestDocument.recipientName', 'Recipient Name (Optional)')}
                </label>
                <input
                  type="text"
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => handleInputChange('recipientName', e.target.value)}
                  placeholder={t('modals.requestDocument.placeholders.name', 'Enter recipient name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  disabled={isSubmitting}
                />
              </div>

              {/* Document Type */}
              <div>
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                  {t('modals.requestDocument.documentType', 'Document Type')}
                </label>
                <select
                  id="documentType"
                  value={formData.documentType}
                  onChange={(e) => handleInputChange('documentType', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  disabled={isSubmitting}
                >
                  <option value="">Select document type</option>
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('modals.requestDocument.description', 'Description')} *
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  placeholder={t('modals.requestDocument.placeholders.description', 'Describe what document you need')}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm ${
                    errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  {t('modals.requestDocument.dueDate', 'Due Date')} *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  onBlur={() => handleFieldBlur('dueDate')}
                  min={getMinDate()}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm ${
                    errors.dueDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.dueDate}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  {t('modals.requestDocument.priority', 'Priority')}
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  disabled={isSubmitting}
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('modals.requestDocument.submitting', 'Sending...')}
                </>
              ) : (
                t('modals.requestDocument.submit', 'Send Request')
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('modals.requestDocument.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDocumentModal;
