import React, { useState } from 'react';
import {
  CloudArrowUpIcon,
  ReceiptPercentIcon,
  EyeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ReceiptUpload from '@components/ReceiptUpload';
import { notify } from '@lib/uiUtils';
import Logger from '@utils/Logger';
import { useTranslation } from 'react-i18next';

/**
 * Componente demo per mostrare l'utilizzo di ReceiptUpload
 * Questo è un esempio di come integrare il componente nella tua applicazione
 */
export default function ReceiptUploadDemo() {
  const { t } = useTranslation('receipts');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedReceipts, setUploadedReceipts] = useState([]);

  const handleUploadComplete = receipts => {
    Logger.info('Ricevute caricate:', receipts);
    setUploadedReceipts(prev => [...prev, ...receipts]);
    setShowUpload(false);
    notify.success(t('demo.uploadSuccessNotification', { count: receipts.length }));
  };

  const handleViewReceipt = receipt => {
    if (receipt.url) {
      window.open(receipt.url, '_blank');
    }
  };

  const clearReceipts = () => {
    setUploadedReceipts([]);
    notify.success(t('demo.listClearedNotification'));
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-8'>
      {/* Header */}
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>{t('demo.title')}</h1>
        <p className='mt-2 text-gray-600 dark:text-gray-400'>{t('demo.description')}</p>
      </div>

      {/* Actions */}
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <button
          onClick={() => setShowUpload(true)}
          className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
        >
          <CloudArrowUpIcon className='h-5 w-5 mr-2' />
          {t('demo.uploadButton')}
        </button>

        {uploadedReceipts.length > 0 && (
          <button
            onClick={clearReceipts}
            className='inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
          >
            {t('demo.clearButton')}
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <ReceiptPercentIcon className='h-8 w-8 text-blue-500' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                {t('demo.uploadedCount')}
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                {uploadedReceipts.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <CloudArrowUpIcon className='h-8 w-8 text-green-500' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                {t('demo.uploadsCompleted')}
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                {uploadedReceipts.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <EyeIcon className='h-8 w-8 text-purple-500' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                {t('demo.views')}
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Receipts */}
      {uploadedReceipts.length > 0 ? (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
            <h2 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
              {t('demo.uploadedReceiptsTitle', { count: uploadedReceipts.length })}
            </h2>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {uploadedReceipts.map((receipt, index) => (
                <div
                  key={index}
                  className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center min-w-0 flex-1'>
                      <ReceiptPercentIcon className='h-8 w-8 text-green-500 flex-shrink-0' />
                      <div className='ml-3 min-w-0 flex-1'>
                        <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                          {receipt.name}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          {t('demo.uploadSuccess')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewReceipt(receipt)}
                      className='ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
                      title={t('demo.viewReceiptTitle')}
                    >
                      <EyeIcon className='h-5 w-5' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='text-center py-12'>
            <ReceiptPercentIcon className='mx-auto h-16 w-16 text-gray-400' />
            <h3 className='mt-4 text-lg font-medium text-gray-900 dark:text-gray-100'>
              {t('demo.noReceipts')}
            </h3>
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              {t('demo.noReceiptsDescription')}
            </p>
            <div className='mt-6'>
              <button
                onClick={() => setShowUpload(true)}
                className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              >
                <PlusIcon className='h-4 w-4 mr-2' />
                {t('demo.uploadFirstReceipt')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Example */}
      <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
          {t('demo.exampleCode')}
        </h3>
        <pre className='text-sm text-gray-600 dark:text-gray-300 overflow-x-auto'>
          {`import ReceiptUpload from '@components/ReceiptUpload';

const [showUpload, setShowUpload] = useState(false);

const handleUploadComplete = (receipts) => {
  Logger.info('Ricevute caricate:', receipts);
  // Gestisci i file caricati
};

<ReceiptUpload
  isOpen={showUpload}
  onClose={() => setShowUpload(false)}
  onUploadComplete={handleUploadComplete}
  maxFiles={10}
  title="Carica Ricevute"
  description="Seleziona le tue ricevute..."
/>`}
        </pre>
      </div>

      {/* ReceiptUpload Modal */}
      <ReceiptUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={handleUploadComplete}
        title={t('demo.modalTitle')}
        description={t('demo.modalDescription')}
        maxFiles={5}
      />
    </div>
  );
}
