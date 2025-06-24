import React, { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import {
  EnvelopeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import emailService from '@lib/emailService';
import DOMPurify from 'dompurify';
import Logger from '@utils/Logger';

const QuoteEmailSender = ({ isOpen, onClose, quote, onEmailSent }) => {
  const { t } = useTranslation('email');
  // Configure DOMPurify for secure HTML sanitization
  const sanitizeHtml = (html) => {
    if (!html) return '';

    // Configure DOMPurify to allow only safe HTML elements and attributes
    // This prevents XSS attacks while preserving legitimate formatting
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      FORBID_ATTR: ['style'], // Remove style attribute to prevent CSS-based XSS
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
    });
  };
  const [step, setStep] = useState(1); // 1: Setup, 2: Preview, 3: Sending, 4: Result
  const [emailData, setEmailData] = useState({
    recipientEmail: '',
    recipientName: '',
    templateType: 'quote_sent',
    customMessage: '',
    includeAttachment: true,
    scheduledDate: null,
  });
  const [sendingResult, setSendingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset state when modal opens
  const handleModalOpen = () => {
    if (isOpen && quote) {
      setStep(1);
      setEmailData((prev) => ({
        ...prev,
        recipientEmail: quote.client_email || '',
        recipientName: quote.client_name || quote.client || '',
        customMessage: '',
      }));
      setErrors({});
      setSendingResult(null);
    }
  };

  // Email template options
  const templateOptions = [
    {
      id: 'quote_sent',
      name: t('quoteSender.templates.quote_sent.name'),
      description: t('quoteSender.templates.quote_sent.description'),
      icon: '📧',
    },
    {
      id: 'quote_reminder',
      name: t('quoteSender.templates.quote_reminder.name'),
      description: t('quoteSender.templates.quote_reminder.description'),
      icon: '⏰',
    },
    {
      id: 'quote_accepted',
      name: t('quoteSender.templates.quote_accepted.name'),
      description: t('quoteSender.templates.quote_accepted.description'),
      icon: '✅',
    },
  ];

  // Validate email data
  const validateEmailData = () => {
    const newErrors = {};

    if (!emailData.recipientEmail) {
      newErrors.recipientEmail = t('quoteSender.validation.emailRequired');
    } else if (!emailService.isValidEmail(emailData.recipientEmail)) {
      newErrors.recipientEmail = t('quoteSender.validation.emailInvalid');
    }

    if (!emailData.recipientName.trim()) {
      newErrors.recipientName = t('quoteSender.validation.nameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEmailData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Proceed to next step
  const handleNext = () => {
    if (step === 1) {
      if (validateEmailData()) {
        setStep(2);
      }
    } else if (step === 2) {
      handleSendEmail();
    }
  };

  // Send the email
  const handleSendEmail = async () => {
    setStep(3);
    setLoading(true);

    try {
      const result = await emailService.sendQuoteEmail(
        quote,
        emailData.recipientEmail,
        emailData.templateType,
        emailData.customMessage,
      );

      setSendingResult({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp,
        recipient: result.recipient,
      });

      // Schedule reminders if it's a quote_sent template
      if (emailData.templateType === 'quote_sent') {
        emailService.scheduleReminders(quote);
      }

      setStep(4);

      // Notify parent component
      if (onEmailSent) {
        onEmailSent(result);
      }
    } catch (error) {
      Logger.error('Error sending email:', error);
      setSendingResult({
        success: false,
        error: error.message,
      });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  // Get preview of the email template
  const getEmailPreview = () => {
    if (!quote) return null;

    const emailData_preview = {
      quoteNumber: quote.quote_number || quote.number,
      clientName: emailData.recipientName,
      issueDate: quote.issue_date || quote.date,
      expiryDate: quote.expiry_date || quote.expiryDate,
      totalAmount: quote.total_amount || quote.amount,
      companyName: t('companyDetails.name'),
      companyEmail: t('companyDetails.email'),
      companyPhone: t('companyDetails.phone'),
      companyAddress: t('companyDetails.address'),
    };

    const template = emailService.getEmailTemplate(emailData.templateType, emailData_preview);
    return template;
  };

  // Handle modal close
  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setErrors({});
      setSendingResult(null);
      onClose();
    }
  };

  // Trigger modal open effect
  React.useEffect(() => {
    if (isOpen) {
      handleModalOpen();
    }
  }, [isOpen, quote]);

  if (!quote) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-6 w-6 mr-2" />
                      <Dialog.Title as="h3" className="text-lg font-medium">
                        {t('quoteSender.title')}
                      </Dialog.Title>
                    </div>
                    <button
                      type="button"
                      className="text-white hover:text-gray-200 disabled:opacity-50"
                      onClick={handleClose}
                      disabled={loading}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b">
                  <nav className="flex items-center justify-center space-x-4">
                    {[
                      { id: 1, name: t('quoteSender.steps.setup') },
                      { id: 2, name: t('quoteSender.steps.preview') },
                      { id: 3, name: t('quoteSender.steps.send') },
                      { id: 4, name: t('quoteSender.steps.result') },
                    ].map((s) => (
                      <div key={s.id} className="flex items-center">
                        <div
                          className={`
                            ${step === s.id ? 'font-bold text-blue-600' : 'text-gray-500'}
                          `}
                        >
                          {s.name}
                        </div>
                      </div>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Step 1: Email Setup */}
                  {step === 1 && (
                    <div className="space-y-6">
                      {/* Recipient Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('quoteSender.labels.recipientEmail')}
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            value={emailData.recipientEmail}
                            onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                            placeholder={t('quoteSender.placeholders.recipientEmail')}
                            className={`w-full border rounded-md px-3 py-2 ${
                              errors.recipientEmail ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.recipientEmail && (
                            <p className="text-sm text-red-600 mt-1">{errors.recipientEmail}</p>
                          )}
                        </div>
                      </div>

                      {/* Recipient Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('quoteSender.labels.recipientName')}
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={emailData.recipientName}
                            onChange={(e) => handleInputChange('recipientName', e.target.value)}
                            placeholder={t('quoteSender.placeholders.recipientName')}
                            className={`w-full border rounded-md px-3 py-2 ${
                              errors.recipientName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.recipientName && (
                            <p className="text-sm text-red-600 mt-1">{errors.recipientName}</p>
                          )}
                        </div>
                      </div>

                      {/* Template */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('quoteSender.labels.template')}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {templateOptions.map((template) => (
                            <div
                              key={template.id}
                              className={`
                                w-full text-left p-4 rounded-lg border
                                ${
                                  emailData.templateType === template.id
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-white hover:bg-gray-50'
                                }
                              `}
                              onClick={() => handleInputChange('templateType', template.id)}
                            >
                              <div className="flex items-start">
                                <span className="text-2xl mr-3">{template.icon}</span>
                                <div>
                                  <p className="font-semibold">{template.name}</p>
                                  <p className="text-sm text-gray-500">{template.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('quoteSender.labels.customMessage')}
                        </label>
                        <textarea
                          rows="4"
                          value={emailData.customMessage}
                          onChange={(e) => handleInputChange('customMessage', e.target.value)}
                          placeholder={t('quoteSender.placeholders.customMessage')}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                        ></textarea>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Email Preview */}
                  {step === 2 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {t('quoteSender.preview.title')}
                      </h4>
                      <div className="mt-4 p-4 border rounded-md bg-gray-50 space-y-4">
                        <p>
                          <span className="font-semibold">{t('quoteSender.preview.subject')}</span>{' '}
                          {getEmailPreview().subject}
                        </p>
                        <div className="border-t pt-4">
                          <p className="font-semibold">{t('quoteSender.preview.body')}</p>
                          <div
                            className="prose prose-sm max-w-none mt-2"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(getEmailPreview().html),
                            }}
                          />
                        </div>
                        {emailData.includeAttachment && (
                          <div className="border-t pt-4">
                            <p className="font-semibold">{t('quoteSender.preview.attachment')}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                              <DocumentTextIcon className="w-5 h-5" />
                              <span>
                                {t('quoteSender.preview.quotePdf', {
                                  quoteNumber: quote.quote_number || quote.number,
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Sending */}
                  {step === 3 && (
                    <div className="text-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <h4 className="mt-4 text-lg font-medium text-gray-900">
                        {t('quoteSender.sending.title')}
                      </h4>
                      <p className="text-gray-600">{t('quoteSender.sending.subtitle')}</p>
                    </div>
                  )}

                  {/* Step 4: Result */}
                  {step === 4 && sendingResult && (
                    <div className="text-center py-10">
                      {sendingResult.success ? (
                        <>
                          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
                          <h4 className="mt-4 text-xl font-semibold text-gray-900">
                            {t('quoteSender.result.successTitle')}
                          </h4>
                          <p className="mt-2 text-gray-600">
                            {t('quoteSender.result.successMessage', {
                              recipient: sendingResult.recipient,
                            })}
                          </p>
                          <div className="mt-4 text-sm text-gray-500 space-y-1">
                            <p>
                              <span className="font-semibold">
                                {t('quoteSender.result.messageId')}
                              </span>{' '}
                              {sendingResult.messageId}
                            </p>
                            <p>
                              <span className="font-semibold">
                                {t('quoteSender.result.timestamp')}
                              </span>{' '}
                              {new Date(sendingResult.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto" />
                          <h4 className="mt-4 text-xl font-semibold text-gray-900">
                            {t('quoteSender.result.errorTitle')}
                          </h4>
                          <p className="mt-2 text-gray-600">
                            {t('quoteSender.result.errorMessage')}
                          </p>
                          <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                            <span className="font-semibold">
                              {t('quoteSender.result.errorDetails')}
                            </span>{' '}
                            {sendingResult.error}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                  {step > 1 && step < 4 && (
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      onClick={() => setStep(step - 1)}
                    >
                      {t('quoteSender.buttons.back')}
                    </button>
                  )}

                  {step < 3 && (
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                      onClick={handleNext}
                    >
                      {step === 1 ? t('quoteSender.buttons.next') : t('quoteSender.buttons.send')}
                    </button>
                  )}

                  {step === 4 && (
                    <>
                      {!sendingResult.success && (
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          onClick={() => setStep(1)}
                        >
                          {t('quoteSender.buttons.tryAgain')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        onClick={handleClose}
                      >
                        {sendingResult.success
                          ? t('quoteSender.buttons.close')
                          : t('quoteSender.buttons.sendAnother')}
                      </button>
                    </>
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

export default QuoteEmailSender;
