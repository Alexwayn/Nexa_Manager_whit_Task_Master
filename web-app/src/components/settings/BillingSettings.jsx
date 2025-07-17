import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import {
  CreditCardIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  CogIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  PaintBrushIcon,
  CalendarIcon,
  EyeIcon,
  SparklesIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  HashtagIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import SettingsTable from '@components/settings/SettingsTable';
import {
  InvoiceSettingsService,
  TEMPLATE_TYPES,
  NUMBERING_FORMATS,
  LOGO_POSITIONS,
  CURRENCIES,
  DATE_FORMATS,
  NUMBER_FORMATS,
} from '@lib/invoiceSettingsService';

export default function BillingSettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const { isAuthenticated } = useClerkAuth();
  const [activeTab, setActiveTab] = useState('subscription');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Real subscription and billing data - to be connected to actual billing service
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [billingLoading, setBillingLoading] = useState(true);

  // Load real billing data
  useEffect(() => {
    const loadBillingData = async () => {
      try {
        setBillingLoading(true);
        // TODO: Replace with actual billing service calls
        // const subscription = await BillingService.getSubscription();
        // const methods = await BillingService.getPaymentMethods();
        // setSubscriptionInfo(subscription);
        // setPaymentMethods(methods);

        // For now, set empty state to show no demo data
        setSubscriptionInfo(null);
        setPaymentMethods([]);
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setBillingLoading(false);
      }
    };

    loadBillingData();
  }, []);

  const [invoiceSettings, setInvoiceSettings] = useState({
    prefix: 'INV',
    next_number: 1,
    numbering_format: NUMBERING_FORMATS.SEQUENTIAL,
    template_id: null,
    layout_style: 'professional',
    logo_position: LOGO_POSITIONS.LEFT,
    payment_terms: 30,
    tax_rate: 22.0,
    currency: CURRENCIES.EUR,
    brand_color: '#2563eb',
    footer_text: 'Thank you for your business!',
    include_notes: true,
    include_tax_breakdown: true,
    auto_reminders: true,
    reminder_days: '7,14,30',
    language: 'en',
    date_format: DATE_FORMATS.DD_MM_YYYY,
    number_format: NUMBER_FORMATS.EUROPEAN,
  });

  const [invoices, setInvoices] = useState([]);

  const tabs = [
    { id: 'subscription', label: t('billing.tabs.subscription'), icon: CreditCardIcon },
    { id: 'payment', label: t('billing.tabs.payment'), icon: CreditCardIcon },
    { id: 'invoices', label: t('billing.tabs.invoices'), icon: DocumentTextIcon },
    { id: 'customization', label: t('billing.tabs.customization'), icon: PaintBrushIcon },
  ];

  // Load invoice settings and templates on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadInvoiceSettings();
      loadTemplates();
    }
  }, [isAuthenticated, user?.id]);

  // Generate preview when settings change
  useEffect(() => {
    if (invoiceSettings && selectedTemplate) {
      generatePreview();
    }
  }, [invoiceSettings, selectedTemplate]);

  const loadInvoiceSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await InvoiceSettingsService.getInvoiceSettings(user.id);
      setInvoiceSettings(settings);
      if (settings.template_id) {
        const template = await InvoiceSettingsService.getTemplateConfig(settings.template_id);
        setSelectedTemplate(template);
      }
    } catch (error) {
      console.error('Error loading invoice settings:', error);
      showNotification && showNotification(t('billing.alerts.loadError'), 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesList = await InvoiceSettingsService.getTemplates();
      setTemplates(templatesList);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const generatePreview = async () => {
    try {
      const preview = InvoiceSettingsService.generatePreview(
        invoiceSettings,
        selectedTemplate?.config || {},
      );
      setPreviewData(preview);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleInvoiceSettingChange = (key, value) => {
    setInvoiceSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTemplateSelect = async templateId => {
    try {
      const template = await InvoiceSettingsService.getTemplateConfig(templateId);
      setSelectedTemplate(template);
      handleInvoiceSettingChange('template_id', templateId);
    } catch (error) {
      console.error('Error selecting template:', error);
      showNotification && showNotification(t('billing.alerts.templateError'), 'error');
    }
  };

  const handleSaveInvoiceSettings = async () => {
    setLoading(true);
    try {
      await InvoiceSettingsService.saveInvoiceSettings(user.id, invoiceSettings);
      showNotification && showNotification(t('billing.alerts.settingsSaved'), 'success');
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      showNotification && showNotification(t('billing.alerts.saveError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreviewNumber = async () => {
    try {
      const previewNumber = await InvoiceSettingsService.generateInvoiceNumber(
        user.id,
        invoiceSettings.numbering_format,
        invoiceSettings.prefix,
        { preview: true },
      );
      return previewNumber;
    } catch (error) {
      console.error('Error generating preview number:', error);
      return `${invoiceSettings.prefix}-PREVIEW`;
    }
  };

  const handleChangePlan = () => {
    showNotification && showNotification(t('billing.alerts.changePlanInfo'), 'info');
  };

  const handleAddPaymentMethod = () => {
    showNotification && showNotification(t('billing.alerts.addPaymentMethodInfo'), 'info');
  };

  const handleEditPaymentMethod = methodId => {
    showNotification &&
      showNotification(t('billing.alerts.editPaymentMethodInfo', { methodId }), 'info');
  };

  const handleDownloadInvoice = invoiceId => {
    showNotification && showNotification(t('billing.alerts.downloadStarted'), 'success');
  };

  const invoiceHeaders = [
    { label: t('billing.invoiceNumber') },
    { label: t('billing.date') },
    { label: t('billing.amount') },
    { label: t('billing.status') },
    { label: '', className: 'relative' },
  ];

  const renderInvoiceRow = invoice => (
    <>
      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
        {invoice.number}
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{invoice.date}</td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{invoice.amount}</td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            invoice.status === 'Paid'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {invoice.status}
        </span>
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
        <button
          type='button'
          onClick={() => handleDownloadInvoice(invoice.id)}
          className='text-blue-600 hover:text-blue-900'
        >
          <ArrowUpTrayIcon className='h-5 w-5' />
        </button>
      </td>
    </>
  );

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-gray-500'>Please sign in to access billing settings.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900'>{t('billing.title')}</h2>
        <p className='mt-1 text-sm text-gray-600'>{t('billing.description')}</p>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className='h-4 w-4' />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='mt-6'>
        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className='bg-white border border-gray-200 rounded-lg p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
              <CreditCardIcon className='h-5 w-5 mr-2' />
              {t('billing.subscription.title')}
            </h3>
            {subscriptionInfo ? (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <p className='text-sm text-gray-600 mb-2'>
                      {t('billing.subscription.current')}
                    </p>
                    <p className='text-xl font-semibold text-gray-900'>{subscriptionInfo.plan}</p>
                    <p className='text-sm text-gray-500'>
                      {subscriptionInfo.price} / {subscriptionInfo.billingCycle}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600 mb-2'>
                      {t('billing.subscription.renewal')}
                    </p>
                    <p className='text-lg font-medium text-gray-900'>
                      {subscriptionInfo.nextRenewal}
                    </p>
                  </div>
                </div>
                <div className='mt-6'>
                  <h4 className='text-sm font-medium text-gray-900 mb-3'>Features Included:</h4>
                  <ul className='space-y-2'>
                    {subscriptionInfo.features.map((feature, index) => (
                      <li key={index} className='flex items-center text-sm text-gray-600'>
                        <CheckCircleIcon className='h-4 w-4 text-green-500 mr-2' />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='mt-6 pt-4 border-t border-gray-200'>
                  <button
                    onClick={handleChangePlan}
                    className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  >
                    {t('billing.subscription.upgrade')}
                  </button>
                </div>
              </>
            ) : (
              <div className='text-center py-8'>
                <CreditCardIcon className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No subscription found</h3>
                <p className='text-gray-500 mb-6'>You don't have an active subscription yet.</p>
                <button
                  onClick={handleChangePlan}
                  className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                >
                  Choose a Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className='bg-white border border-gray-200 rounded-lg p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                <CreditCardIcon className='h-5 w-5 mr-2' />
                {t('billing.payment.methods')}
              </h3>
              <button
                onClick={handleAddPaymentMethod}
                className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                <PlusIcon className='h-4 w-4 mr-1' />
                {t('billing.payment.add')}
              </button>
            </div>
            <div className='space-y-4'>
              {paymentMethods.length > 0 ? (
                paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <CreditCardIcon className='h-6 w-6 text-gray-600' />
                      </div>
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-gray-900'>
                          {method.type} •••• {method.last4}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {t('billing.payment.expires')} {method.expiry}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center'>
                      {method.isDefault && (
                        <span className='mr-4 inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium'>
                          {t('billing.payment.defaultCard')}
                        </span>
                      )}
                      <button
                        type='button'
                        onClick={() => handleEditPaymentMethod(method.id)}
                        className='text-sm text-gray-500 hover:text-gray-700'
                      >
                        {t('billing.payment.edit')}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-center py-8'>
                  <CreditCardIcon className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>No payment methods</h3>
                  <p className='text-gray-500 mb-6'>
                    Add a payment method to manage your subscription.
                  </p>
                  <button
                    onClick={handleAddPaymentMethod}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <PlusIcon className='h-4 w-4 mr-2' />
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className='bg-white border border-gray-200 rounded-lg p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
              <DocumentTextIcon className='h-5 w-5 mr-2' />
              {t('billing.invoicesTitle')}
            </h3>
            <p className='text-sm text-gray-600 mb-6'>{t('billing.invoicesDescription')}</p>

            <SettingsTable
              headers={invoiceHeaders}
              data={invoices}
              renderRow={renderInvoiceRow}
              emptyMessage={t('billing.noInvoices')}
            />
          </div>
        )}

        {/* Enhanced Invoice Customization Tab */}
        {activeTab === 'customization' && (
          <div className='space-y-6'>
            {settingsLoading ? (
              <div className='bg-white border border-gray-200 rounded-lg p-6'>
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                  <span className='ml-2 text-gray-600'>{t('billing.loadingSettings')}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Template Selection */}
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <DocumentDuplicateIcon className='h-5 w-5 mr-2' />
                    {t('billing.templates.title')}
                  </h3>
                  <p className='text-sm text-gray-600 mb-6'>{t('billing.templates.description')}</p>

                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          invoiceSettings.template_id === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='font-medium text-gray-900'>{template.name}</h4>
                          {invoiceSettings.template_id === template.id && (
                            <CheckCircleIcon className='h-5 w-5 text-blue-500' />
                          )}
                        </div>
                        <p className='text-sm text-gray-600 mb-3'>{template.description}</p>
                        <div className='flex items-center text-xs text-gray-500'>
                          <SparklesIcon className='h-3 w-3 mr-1' />
                          {template.template_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Numbering Configuration */}
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <HashtagIcon className='h-5 w-5 mr-2' />
                    {t('billing.numbering.title')}
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.numbering.format')}
                      </label>
                      <select
                        value={invoiceSettings.numbering_format}
                        onChange={e =>
                          handleInvoiceSettingChange('numbering_format', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value={NUMBERING_FORMATS.SEQUENTIAL}>
                          {t('billing.numbering.sequential')}
                        </option>
                        <option value={NUMBERING_FORMATS.DATE_BASED}>
                          {t('billing.numbering.dateBased')}
                        </option>
                        <option value={NUMBERING_FORMATS.YEARLY_RESET}>
                          {t('billing.numbering.yearlyReset')}
                        </option>
                        <option value={NUMBERING_FORMATS.CUSTOM}>
                          {t('billing.numbering.custom')}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.numbering.prefix')}
                      </label>
                      <input
                        type='text'
                        value={invoiceSettings.prefix}
                        onChange={e => handleInvoiceSettingChange('prefix', e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.numbering.nextNumber')}
                      </label>
                      <input
                        type='number'
                        min='1'
                        value={invoiceSettings.next_number}
                        onChange={e =>
                          handleInvoiceSettingChange('next_number', parseInt(e.target.value))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.numbering.preview')}
                      </label>
                      <div className='px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700'>
                        {InvoiceSettingsService.formatSampleNumber(invoiceSettings)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layout and Branding */}
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <SwatchIcon className='h-5 w-5 mr-2' />
                    {t('billing.branding.title')}
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.branding.logoPosition')}
                      </label>
                      <select
                        value={invoiceSettings.logo_position}
                        onChange={e => handleInvoiceSettingChange('logo_position', e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value={LOGO_POSITIONS.LEFT}>{t('billing.branding.left')}</option>
                        <option value={LOGO_POSITIONS.CENTER}>
                          {t('billing.branding.center')}
                        </option>
                        <option value={LOGO_POSITIONS.RIGHT}>{t('billing.branding.right')}</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.branding.brandColor')}
                      </label>
                      <input
                        type='color'
                        value={invoiceSettings.brand_color}
                        onChange={e => handleInvoiceSettingChange('brand_color', e.target.value)}
                        className='w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Business Settings */}
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Cog6ToothIcon className='h-5 w-5 mr-2' />
                    {t('billing.business.title')}
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.business.paymentTerms')}
                      </label>
                      <select
                        value={invoiceSettings.payment_terms}
                        onChange={e =>
                          handleInvoiceSettingChange('payment_terms', parseInt(e.target.value))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value={7}>7 {t('billing.business.days')}</option>
                        <option value={14}>14 {t('billing.business.days')}</option>
                        <option value={30}>30 {t('billing.business.days')}</option>
                        <option value={60}>60 {t('billing.business.days')}</option>
                        <option value={90}>90 {t('billing.business.days')}</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.business.taxRate')}
                      </label>
                      <input
                        type='number'
                        min='0'
                        max='100'
                        step='0.01'
                        value={invoiceSettings.tax_rate}
                        onChange={e =>
                          handleInvoiceSettingChange('tax_rate', parseFloat(e.target.value))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.business.currency')}
                      </label>
                      <select
                        value={invoiceSettings.currency}
                        onChange={e => handleInvoiceSettingChange('currency', e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        {Object.values(CURRENCIES).map(currency => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {t('billing.business.dateFormat')}
                      </label>
                      <select
                        value={invoiceSettings.date_format}
                        onChange={e => handleInvoiceSettingChange('date_format', e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        {Object.values(DATE_FORMATS).map(format => (
                          <option key={format} value={format}>
                            {format}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className='mt-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      {t('billing.business.footerText')}
                    </label>
                    <textarea
                      value={invoiceSettings.footer_text}
                      onChange={e => handleInvoiceSettingChange('footer_text', e.target.value)}
                      rows={3}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                {/* Options and Preferences */}
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <AdjustmentsHorizontalIcon className='h-5 w-5 mr-2' />
                    {t('billing.options.title')}
                  </h3>

                  <div className='space-y-4'>
                    <div className='flex items-center'>
                      <input
                        type='checkbox'
                        id='autoReminders'
                        checked={invoiceSettings.auto_reminders}
                        onChange={e =>
                          handleInvoiceSettingChange('auto_reminders', e.target.checked)
                        }
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                      <label htmlFor='autoReminders' className='ml-2 text-sm text-gray-900'>
                        {t('billing.options.autoReminders')}
                      </label>
                    </div>

                    <div className='flex items-center'>
                      <input
                        type='checkbox'
                        id='includeTaxBreakdown'
                        checked={invoiceSettings.include_tax_breakdown}
                        onChange={e =>
                          handleInvoiceSettingChange('include_tax_breakdown', e.target.checked)
                        }
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                      <label htmlFor='includeTaxBreakdown' className='ml-2 text-sm text-gray-900'>
                        {t('billing.options.includeTaxBreakdown')}
                      </label>
                    </div>

                    <div className='flex items-center'>
                      <input
                        type='checkbox'
                        id='includeNotes'
                        checked={invoiceSettings.include_notes}
                        onChange={e =>
                          handleInvoiceSettingChange('include_notes', e.target.checked)
                        }
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                      <label htmlFor='includeNotes' className='ml-2 text-sm text-gray-900'>
                        {t('billing.options.includeNotes')}
                      </label>
                    </div>

                    {invoiceSettings.auto_reminders && (
                      <div className='ml-6'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          {t('billing.options.reminderDays')}
                        </label>
                        <input
                          type='text'
                          value={invoiceSettings.reminder_days}
                          onChange={e =>
                            handleInvoiceSettingChange('reminder_days', e.target.value)
                          }
                          placeholder='7,14,30'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        <p className='text-xs text-gray-500 mt-1'>
                          {t('billing.options.reminderDaysHelp')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Section */}
                {previewData && (
                  <div className='bg-white border border-gray-200 rounded-lg p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                        <EyeIcon className='h-5 w-5 mr-2' />
                        {t('billing.preview.title')}
                      </h3>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className='text-sm text-blue-600 hover:text-blue-700'
                      >
                        {showPreview ? t('billing.preview.hide') : t('billing.preview.show')}
                      </button>
                    </div>

                    {showPreview && (
                      <div className='bg-gray-50 border rounded-lg p-4'>
                        <div className='text-sm space-y-2'>
                          <div>
                            <strong>{t('billing.preview.number')}:</strong>{' '}
                            {previewData.invoiceNumber}
                          </div>
                          <div>
                            <strong>{t('billing.preview.template')}:</strong>{' '}
                            {selectedTemplate?.name || 'Default'}
                          </div>
                          <div>
                            <strong>{t('billing.preview.currency')}:</strong>{' '}
                            {invoiceSettings.currency}
                          </div>
                          <div>
                            <strong>{t('billing.preview.terms')}:</strong>{' '}
                            {invoiceSettings.payment_terms} {t('billing.business.days')}
                          </div>
                          <div>
                            <strong>{t('billing.preview.taxRate')}:</strong>{' '}
                            {invoiceSettings.tax_rate}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Save Button */}
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <div className='flex justify-end'>
                    <button
                      onClick={handleSaveInvoiceSettings}
                      disabled={loading}
                      className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
                    >
                      {loading ? t('common.saving') : t('billing.saveSettings')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
