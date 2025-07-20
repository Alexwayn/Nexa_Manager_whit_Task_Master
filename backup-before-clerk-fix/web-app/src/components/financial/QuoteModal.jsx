import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import QuoteForm from './QuoteForm';
import Logger from '@utils/Logger';

/**
 * QuoteModal Component
 * Modal wrapper for creating and editing quotes using the QuoteForm component
 */
const QuoteModal = ({
  isOpen,
  onClose,
  quote = null, // For editing existing quotes
  client = null, // Pre-selected client
  template = null, // Template to use
  onQuoteCreated,
  onQuoteUpdated,
  className = '',
}) => {
  const { t } = useTranslation('quotes');
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!quote;

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      setNotification(null);
      onClose();
    }
  };

  const handleSave = async quoteData => {
    try {
      setIsLoading(true);

      if (isEditMode) {
        await onQuoteUpdated?.(quoteData);
        setNotification({
          type: 'success',
          message: t('notifications.quoteUpdated', 'Quote updated successfully'),
        });
      } else {
        await onQuoteCreated?.(quoteData);
        setNotification({
          type: 'success',
          message: t('notifications.quoteCreated', 'Quote created successfully'),
        });
      }

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      Logger.error('Error in QuoteModal handleSave:', error);
      setNotification({
        type: 'error',
        message: error.message || t('notifications.saveFailed', 'Failed to save quote'),
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

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Background overlay */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
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
            <div className='absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl'>
              <div className='flex flex-col items-center'>
                <Loader className='w-8 h-8 animate-spin text-blue-600 mb-2' />
                <span className='text-sm text-gray-600'>
                  {isEditMode
                    ? t('loading.updating', 'Updating quote...')
                    : t('loading.creating', 'Creating quote...')}
                </span>
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className='absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>

          {/* Notification */}
          {notification && (
            <div
              className={`absolute top-4 left-4 right-16 z-20 p-4 rounded-lg border ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
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
            <QuoteForm
              quote={quote}
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

export default QuoteModal;
