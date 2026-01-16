import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Zap, Clock, PenTool, CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import QuoteStatusBadge from './QuoteStatusBadge';
import QuoteApprovalActions from './QuoteApprovalActions';
import QuoteStatusHistory from './QuoteStatusHistory';
import DigitalSignature from './DigitalSignature';
import { QuoteService } from '../services/quoteService';
import Logger from '@/utils/Logger';

/**
 * QuoteDetailModal Component
 * Comprehensive modal for viewing quote details and managing approval workflow
 */
const QuoteDetailModal = ({ isOpen, onClose, quoteId, onQuoteUpdate, className = '' }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    if (isOpen && quoteId) {
      loadQuoteDetails();
    }
  }, [isOpen, quoteId, user?.id]);

  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const loadQuoteDetails = async () => {
    if (!user?.id || !quoteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const quoteData = await QuoteService.getQuote(quoteId, user.id);
      setQuote(quoteData);
    } catch (error) {
      Logger.error('Failed to load quote details:', error);
      setError(t('quotes.errors.load_failed', 'Failed to load quote details'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = updatedQuote => {
    setQuote(updatedQuote);
    if (onQuoteUpdate) {
      onQuoteUpdate(updatedQuote);
    }
  };

  const handleSignatureComplete = signatureData => {
    setShowSignature(false);
    // Refresh quote data to show updated signature status
    loadQuoteDetails();
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const tabs = [
    { id: 'details', label: t('quotes.tabs.details', 'Details'), icon: FileText },
    { id: 'actions', label: t('quotes.tabs.actions', 'Actions'), icon: Zap },
    { id: 'history', label: t('quotes.tabs.history', 'History'), icon: Clock },
    { id: 'signature', label: t('quotes.tabs.signature', 'Signature'), icon: PenTool },
  ];

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50 transition-opacity' onClick={onClose} />

      {/* Modal */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          className={`relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${className}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <h2 className='text-xl font-semibold text-gray-900'>
                {quote
                  ? `${t('quotes.quote', 'Quote')} #${quote.quote_number}`
                  : t('quotes.loading', 'Loading Quote...')}
              </h2>
              {quote && <QuoteStatusBadge status={quote.status} />}
            </div>

            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <span className='sr-only'>{t('common.close', 'Close')}</span>
              <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className='flex flex-col h-full max-h-[calc(90vh-140px)]'>
            {/* Loading State */}
            {isLoading && (
              <div className='flex items-center justify-center py-12'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                <span className='ml-3 text-gray-600'>{t('common.loading', 'Loading...')}</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className='p-6'>
                <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                  <div className='text-sm text-red-800'>{error}</div>
                  <button
                    onClick={loadQuoteDetails}
                    className='mt-2 text-sm text-red-600 hover:text-red-700 underline'
                  >
                    {t('common.retry', 'Retry')}
                  </button>
                </div>
              </div>
            )}

            {/* Quote Content */}
            {quote && !isLoading && !error && (
              <>
                {/* Tabs */}
                <div className='border-b border-gray-200'>
                  <nav className='flex space-x-8 px-6'>
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                          ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        <tab.icon className='w-4 h-4' />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className='flex-1 overflow-y-auto p-6'>
                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className='space-y-6'>
                      {/* Basic Info */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <h3 className='text-lg font-medium text-gray-900 mb-3'>
                            {t('quotes.basic_info', 'Basic Information')}
                          </h3>
                          <dl className='space-y-2'>
                            <div>
                              <dt className='text-sm font-medium text-gray-500'>
                                {t('quotes.client', 'Client')}
                              </dt>
                              <dd className='text-sm text-gray-900'>{quote.client_name}</dd>
                            </div>
                            <div>
                              <dt className='text-sm font-medium text-gray-500'>
                                {t('quotes.created_date', 'Created')}
                              </dt>
                              <dd className='text-sm text-gray-900'>
                                {formatDate(quote.created_at)}
                              </dd>
                            </div>
                            <div>
                              <dt className='text-sm font-medium text-gray-500'>
                                {t('quotes.valid_until', 'Valid Until')}
                              </dt>
                              <dd className='text-sm text-gray-900'>
                                {formatDate(quote.valid_until)}
                              </dd>
                            </div>
                            {quote.acceptance_deadline && (
                              <div>
                                <dt className='text-sm font-medium text-gray-500'>
                                  {t('quotes.acceptance_deadline', 'Acceptance Deadline')}
                                </dt>
                                <dd className='text-sm text-gray-900'>
                                  {formatDate(quote.acceptance_deadline)}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        <div>
                          <h3 className='text-lg font-medium text-gray-900 mb-3'>
                            {t('quotes.financial_summary', 'Financial Summary')}
                          </h3>
                          <dl className='space-y-2'>
                            <div>
                              <dt className='text-sm font-medium text-gray-500'>
                                {t('quotes.subtotal', 'Subtotal')}
                              </dt>
                              <dd className='text-sm text-gray-900'>
                                {formatCurrency(quote.subtotal)}
                              </dd>
                            </div>
                            <div>
                              <dt className='text-sm font-medium text-gray-500'>
                                {t('quotes.tax', 'Tax')}
                              </dt>
                              <dd className='text-sm text-gray-900'>
                                {formatCurrency(quote.tax_amount)}
                              </dd>
                            </div>
                            <div className='border-t pt-2'>
                              <dt className='text-sm font-medium text-gray-900'>
                                {t('quotes.total', 'Total')}
                              </dt>
                              <dd className='text-lg font-bold text-gray-900'>
                                {formatCurrency(quote.total)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {/* Items */}
                      {quote.items && quote.items.length > 0 && (
                        <div>
                          <h3 className='text-lg font-medium text-gray-900 mb-3'>
                            {t('quotes.items', 'Quote Items')}
                          </h3>
                          <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200'>
                              <thead className='bg-gray-50'>
                                <tr>
                                  <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    {t('quotes.item.description', 'Description')}
                                  </th>
                                  <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    {t('quotes.item.quantity', 'Qty')}
                                  </th>
                                  <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    {t('quotes.item.unit_price', 'Unit Price')}
                                  </th>
                                  <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    {t('quotes.item.total', 'Total')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className='bg-white divide-y divide-gray-200'>
                                {quote.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className='px-4 py-2 text-sm text-gray-900'>
                                      {item.description}
                                    </td>
                                    <td className='px-4 py-2 text-sm text-gray-900 text-right'>
                                      {item.quantity}
                                    </td>
                                    <td className='px-4 py-2 text-sm text-gray-900 text-right'>
                                      {formatCurrency(item.unit_price)}
                                    </td>
                                    <td className='px-4 py-2 text-sm text-gray-900 text-right'>
                                      {formatCurrency(item.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {quote.notes && (
                        <div>
                          <h3 className='text-lg font-medium text-gray-900 mb-3'>
                            {t('quotes.notes', 'Notes')}
                          </h3>
                          <div className='bg-gray-50 rounded-md p-4'>
                            <p className='text-sm text-gray-700 whitespace-pre-wrap'>
                              {quote.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Tab */}
                  {activeTab === 'actions' && (
                    <QuoteApprovalActions quote={quote} onStatusUpdate={handleStatusUpdate} />
                  )}

                  {/* History Tab */}
                  {activeTab === 'history' && <QuoteStatusHistory quoteId={quote.id} />}

                  {/* Signature Tab */}
                  {activeTab === 'signature' && (
                    <div className='space-y-6'>
                      {quote.digital_signature ? (
                        <div>
                          <h3 className='text-lg font-medium text-gray-900 mb-3'>
                            {t('quotes.signature.existing', 'Digital Signature')}
                          </h3>
                          <div className='bg-green-50 border border-green-200 rounded-md p-4'>
                            <div className='flex items-center gap-2 mb-2'>
                              <CheckCircle className='w-5 h-5 text-green-600' />
                              <span className='text-sm font-medium text-green-800'>
                                {t('quotes.signature.completed', 'Quote has been digitally signed')}
                              </span>
                            </div>
                            <div className='text-xs text-green-700'>
                              {t('quotes.signature.signed_on', 'Signed on')}:{' '}
                              {formatDate(quote.signature_date)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <DigitalSignature
                          quoteId={quote.id}
                          onSignatureComplete={handleSignatureComplete}
                        />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className='border-t border-gray-200 px-6 py-4 bg-gray-50'>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailModal;
