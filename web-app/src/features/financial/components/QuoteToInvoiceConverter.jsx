import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  DocumentIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { QuoteService } from '../services/quoteService';
import Logger from '@utils/Logger';

const QuoteToInvoiceConverter = ({ isOpen, onClose, quote, onConversionSuccess }) => {
  const { t } = useTranslation('invoices');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Validation, 2: Options, 3: Confirmation
  const [conversionOptions, setConversionOptions] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: '30',
    notes: '',
    preserveQuoteNotes: true,
    sendEmail: false,
    emailTemplate: 'standard',
  });
  const [validationResults, setValidationResults] = useState({
    canConvert: false,
    warnings: [],
    errors: [],
  });

  // Initialize due date based on payment terms
  useEffect(() => {
    if (conversionOptions.issueDate && conversionOptions.paymentTerms) {
      const issueDate = new Date(conversionOptions.issueDate);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + parseInt(conversionOptions.paymentTerms));
      setConversionOptions(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0],
      }));
    }
  }, [conversionOptions.issueDate, conversionOptions.paymentTerms]);

  // Validate quote for conversion
  useEffect(() => {
    if (quote) {
      validateQuoteForConversion();
    }
  }, [quote]);

  const validateQuoteForConversion = () => {
    const validation = {
      canConvert: true,
      warnings: [],
      errors: [],
    };

    // Check quote status
    if (quote.status !== 'accepted') {
      validation.errors.push({
        type: 'status',
        message: t('quoteConverter.errors.status'),
        severity: 'error',
      });
      validation.canConvert = false;
    }

    // Check if already converted
    if (quote.status === 'converted') {
      validation.errors.push({
        type: 'already_converted',
        message: t('quoteConverter.errors.alreadyConverted'),
        severity: 'error',
      });
      validation.canConvert = false;
    }

    // Check if quote has items
    if (!quote.quote_items || quote.quote_items.length === 0) {
      validation.errors.push({
        type: 'no_items',
        message: t('quoteConverter.errors.noItems'),
        severity: 'error',
      });
      validation.canConvert = false;
    }

    // Check client information
    if (!quote.clients) {
      validation.errors.push({
        type: 'no_client',
        message: t('quoteConverter.errors.noClient'),
        severity: 'error',
      });
      validation.canConvert = false;
    }

    // Check if quote is expired
    if (quote.due_date && new Date(quote.due_date) < new Date()) {
      validation.warnings.push({
        type: 'expired',
        message: t('quoteConverter.warnings.expired'),
        severity: 'warning',
      });
    }

    // Check for missing VAT numbers for business clients
    if (quote.clients?.vat_number && !quote.clients.fiscal_code) {
      validation.warnings.push({
        type: 'missing_fiscal_code',
        message: t('quoteConverter.warnings.missingFiscalCode'),
        severity: 'warning',
      });
    }

    setValidationResults(validation);
  };

  const handleConversionOptionChange = (key, value) => {
    setConversionOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleConvert = async () => {
    if (!validationResults.canConvert) {
      setError(t('quoteConverter.errors.cannotConvert'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the QuoteService to convert the quote
      const invoice = await QuoteService.convertToInvoice(quote.id, quote.user_id);

      // Update the invoice with custom options if different from defaults
      if (
        conversionOptions.issueDate !== new Date().toISOString().split('T')[0] ||
        conversionOptions.notes !== quote.notes ||
        !conversionOptions.preserveQuoteNotes
      ) {
        // Here you would typically call an invoice update service
        // For now, we'll just log the options
        Logger.info('Invoice created with custom options:', {
          invoiceId: invoice.id,
          options: conversionOptions,
        });
      }

      // Show success and call parent callback
      setStep(3);
      onConversionSuccess(invoice);
    } catch (error) {
      Logger.error('Error converting quote to invoice:', error);
      setError(error.message || t('quoteConverter.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const getStatusColor = status => {
    const colors = {
      accepted: 'text-green-600 bg-green-100',
      converted: 'text-purple-600 bg-purple-100',
      sent: 'text-blue-600 bg-blue-100',
      draft: 'text-gray-600 bg-gray-100',
      rejected: 'text-red-600 bg-red-100',
      expired: 'text-yellow-600 bg-yellow-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusText = status => {
    const statusMap = {
      draft: t('quoteConverter.statusLabels.draft'),
      sent: t('quoteConverter.statusLabels.sent'),
      accepted: t('quoteConverter.statusLabels.accepted'),
      rejected: t('quoteConverter.statusLabels.rejected'),
      expired: t('quoteConverter.statusLabels.expired'),
      converted: t('quoteConverter.statusLabels.converted'),
    };
    return statusMap[status] || status;
  };

  if (!quote) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all'>
                {/* Header */}
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex-shrink-0'>
                      <DocumentIcon className='h-8 w-8 text-blue-600' />
                    </div>
                    <div>
                      <Dialog.Title className='text-lg font-medium text-gray-900 dark:text-white'>
                        {t('quoteConverter.title')}
                      </Dialog.Title>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t('quoteConverter.subtitle', { quoteNumber: quote.quote_number })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className='rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                {/* Progress Steps */}
                <div className='mb-6'>
                  <div className='flex items-center justify-center space-x-8'>
                    {[
                      { number: 1, title: 'Validazione', icon: ExclamationTriangleIcon },
                      { number: 2, title: 'Opzioni', icon: DocumentTextIcon },
                      { number: 3, title: 'Conferma', icon: CheckCircleIcon },
                    ].map((stepItem, index) => (
                      <div key={stepItem.number} className='flex items-center'>
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            step >= stepItem.number
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-gray-300 text-gray-500'
                          }`}
                        >
                          {step > stepItem.number ? (
                            <CheckCircleIcon className='h-6 w-6' />
                          ) : (
                            <stepItem.icon className='h-5 w-5' />
                          )}
                        </div>
                        <span
                          className={`ml-2 text-sm font-medium ${
                            step >= stepItem.number
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          {stepItem.title}
                        </span>
                        {index < 2 && <ArrowRightIcon className='h-4 w-4 text-gray-400 ml-4' />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className='mb-4 rounded-md bg-red-50 dark:bg-red-900/50 p-4'>
                    <div className='flex'>
                      <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
                      <div className='ml-3'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Validation */}
                {step === 1 && (
                  <div className='space-y-6'>
                    <h4 className='font-semibold text-lg text-gray-800 dark:text-gray-200'>
                      {t('quoteConverter.validation.title')}
                    </h4>

                    {/* Quote Summary */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                      <div>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {t('quoteConverter.validation.status')}
                        </p>
                        <p
                          className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${getStatusColor(
                            quote.status,
                          )}`}
                        >
                          {getStatusText(quote.status)}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {t('quoteConverter.validation.client')}
                        </p>
                        <p className='font-medium text-gray-800 dark:text-gray-200'>
                          {quote.clients?.name}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {t('quoteConverter.validation.items')}
                        </p>
                        <p className='font-medium text-gray-800 dark:text-gray-200'>
                          {quote.quote_items?.length}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          {t('quoteConverter.validation.total')}
                        </p>
                        <p className='font-medium text-gray-800 dark:text-gray-200'>
                          {formatCurrency(quote.total_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Errors */}
                    {validationResults.errors.length > 0 && (
                      <div>
                        <h5 className='font-semibold text-red-600 mb-2'>
                          {t('quoteConverter.validation.errors')}
                        </h5>
                        <ul className='space-y-2'>
                          {validationResults.errors.map((err, index) => (
                            <li key={index} className='flex items-start'>
                              <ExclamationTriangleIcon className='h-5 w-5 text-red-400 flex-shrink-0 mt-0.5' />
                              <p className='text-sm text-red-800 dark:text-red-200'>
                                {err.message}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {validationResults.warnings.length > 0 && (
                      <div>
                        <h5 className='font-semibold text-yellow-600 mb-2'>
                          {t('quoteConverter.validation.warnings')}
                        </h5>
                        <ul className='space-y-2'>
                          {validationResults.warnings.map((warn, index) => (
                            <li key={index} className='flex items-start'>
                              <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5' />
                              <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                                {warn.message}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Conversion Readiness */}
                    <div
                      className={`p-4 rounded-lg flex items-center ${
                        validationResults.canConvert
                          ? 'bg-green-50 dark:bg-green-900/50'
                          : 'bg-red-50 dark:bg-red-900/50'
                      }`}
                    >
                      {validationResults.canConvert ? (
                        <CheckCircleIcon className='h-6 w-6 text-green-600 mr-3' />
                      ) : (
                        <ExclamationTriangleIcon className='h-6 w-6 text-red-600 mr-3' />
                      )}
                      <p
                        className={`font-semibold ${
                          validationResults.canConvert ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {validationResults.canConvert
                          ? t('quoteConverter.validation.canConvert')
                          : t('quoteConverter.validation.cannotConvert')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Conversion Options */}
                {step === 2 && (
                  <div className='space-y-6'>
                    <h4 className='font-semibold text-lg text-gray-800 dark:text-gray-200'>
                      {t('quoteConverter.options.title')}
                    </h4>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      {/* Issue Date */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                          {t('quoteConverter.options.issueDate')}
                        </label>
                        <input
                          type='date'
                          value={conversionOptions.issueDate}
                          onChange={e => handleConversionOptionChange('issueDate', e.target.value)}
                          className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700'
                        />
                      </div>

                      {/* Payment Terms */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                          {t('quoteConverter.options.paymentTerms')}
                        </label>
                        <select
                          value={conversionOptions.paymentTerms}
                          onChange={e =>
                            handleConversionOptionChange('paymentTerms', e.target.value)
                          }
                          className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700'
                        >
                          <option value='15'>15</option>
                          <option value='30'>30</option>
                          <option value='60'>60</option>
                          <option value='90'>90</option>
                        </select>
                      </div>

                      {/* Due Date (read-only) */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                          {t('quoteConverter.options.dueDate')}
                        </label>
                        <input
                          type='date'
                          value={conversionOptions.dueDate}
                          readOnly
                          className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700'
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {t('quoteConverter.options.notes')}
                      </label>
                      <textarea
                        rows={4}
                        value={conversionOptions.notes}
                        onChange={e => handleConversionOptionChange('notes', e.target.value)}
                        className='mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700'
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className='space-y-3'>
                      <div className='flex items-center'>
                        <input
                          id='preserveNotes'
                          type='checkbox'
                          checked={conversionOptions.preserveQuoteNotes}
                          onChange={e =>
                            handleConversionOptionChange('preserveQuoteNotes', e.target.checked)
                          }
                          className='h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700'
                        />
                        <label
                          htmlFor='preserveNotes'
                          className='ml-3 block text-sm text-gray-900 dark:text-gray-300'
                        >
                          {t('quoteConverter.options.preserveQuoteNotes')}
                        </label>
                      </div>
                      <div className='flex items-center'>
                        <input
                          id='sendEmail'
                          type='checkbox'
                          checked={conversionOptions.sendEmail}
                          onChange={e =>
                            handleConversionOptionChange('sendEmail', e.target.checked)
                          }
                          className='h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700'
                        />
                        <label
                          htmlFor='sendEmail'
                          className='ml-3 block text-sm text-gray-900 dark:text-gray-300'
                        >
                          {t('quoteConverter.options.sendEmail')}
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                  <div className='text-center'>
                    <CheckCircleIcon className='h-16 w-16 text-green-500 mx-auto mb-4' />
                    <h4 className='font-semibold text-xl text-gray-800 dark:text-gray-200'>
                      {t('quoteConverter.success.title')}
                    </h4>
                    <p className='text-gray-600 dark:text-gray-400 mt-2'>
                      {t('quoteConverter.success.message', {
                        quoteNumber: quote.quote_number,
                        invoiceNumber: 'INV-123', // Placeholder, replace with actual
                      })}
                    </p>
                  </div>
                )}

                {error && (
                  <div className='mt-4 p-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-700 dark:text-red-300 text-sm'>
                    {error}
                  </div>
                )}

                {/* Footer */}
                <div className='mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center space-x-4'>
                  <button
                    onClick={onClose}
                    className='text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    {t('quoteConverter.buttons.close')}
                  </button>

                  {step > 1 && step < 3 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className='text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      {t('quoteConverter.buttons.back')}
                    </button>
                  )}

                  {step === 1 && (
                    <button
                      onClick={() => setStep(2)}
                      disabled={!validationResults.canConvert}
                      className='text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800'
                    >
                      {t('quoteConverter.buttons.next')}
                    </button>
                  )}

                  {step === 2 && (
                    <button
                      onClick={handleConvert}
                      disabled={loading}
                      className='text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800'
                    >
                      {loading
                        ? t('quoteConverter.buttons.converting')
                        : t('quoteConverter.buttons.convert')}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuoteToInvoiceConverter;
