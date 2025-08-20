import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import InvoiceForm from './InvoiceFormNew';
import Logger from '@/utils/Logger';

/**
 * InvoiceModal Component
 * Modal wrapper for creating and editing invoices using the InvoiceForm component
 */
const InvoiceModal = ({
  isOpen,
  onClose,
  invoice = null, // For editing existing invoices
  client = null, // Pre-selected client
  template = null, // Template to use
  onInvoiceCreated,
  onInvoiceUpdated,
  className = '',
}) => {
  const { t } = useTranslation('invoices');
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!invoice;

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSave = async invoiceData => {
    try {
      setIsLoading(true);

      if (isEditMode) {
        Logger.info('Invoice updated successfully:', invoiceData);
        setNotification({
          type: 'success',
          message: t('notifications.invoiceUpdated'),
        });
        onInvoiceUpdated?.(invoiceData);
      } else {
        Logger.info('Invoice created successfully:', invoiceData);
        setNotification({
          type: 'success',
          message: t('notifications.invoiceCreated'),
        });
        onInvoiceCreated?.(invoiceData);
      }

      // Close modal after a short delay to show the success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      Logger.error('Failed to save invoice:', error);
      setNotification({
        type: 'error',
        message: error.message || t('notifications.saveFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = errorMessage => {
    setNotification({
      type: 'error',
      message: errorMessage,
    });
  };

  const handleClose = () => {
    setNotification(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 transition-opacity'
        onClick={handleClose}
      />

      {/* Modal container */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          className={`relative w-full max-w-4xl bg-white rounded-xl shadow-2xl transform transition-all ${className}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Loading overlay */}
          {isLoading && (
            <div className='absolute inset-0 bg-white/75 flex items-center justify-center z-10 rounded-xl'>
              <div className='flex flex-col items-center'>
                <Loader className='w-8 h-8 animate-spin text-blue-600 mb-2' />
                <span className='text-sm text-gray-600'>
                  {isEditMode ? t('loading.updating') : t('loading.creating')}
                </span>
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className='absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='w-5 h-5' />
          </button>

          {/* Notification */}
          {notification && (
            <div
              className={`absolute top-4 left-4 right-16 z-20 p-4 rounded-lg shadow-lg ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className='flex items-center'>
                {notification.type === 'success' ? (
                  <CheckCircle className='w-5 h-5 mr-2' />
                ) : (
                  <AlertCircle className='w-5 h-5 mr-2' />
                )}
                <span className='text-sm font-medium'>{notification.message}</span>
              </div>
            </div>
          )}

          {/* Modal content */}
          <div className='max-h-[90vh] overflow-y-auto'>
            <InvoiceForm
              invoice={invoice}
              client={client}
              template={template}
              isEditMode={isEditMode}
              onSave={handleSave}
              onCancel={handleClose}
              onError={handleError}
              className='border-0 shadow-none'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
