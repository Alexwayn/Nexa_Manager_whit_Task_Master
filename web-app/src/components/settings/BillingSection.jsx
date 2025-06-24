import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCardIcon, PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import SettingsFormSection from '@components/settings/SettingsFormSection';
import SettingsTable from '@components/settings/SettingsTable';

const BillingSection = ({ setNotification }) => {
  const { t } = useTranslation('settings');
  // Mock data for demonstration
  const subscriptionInfo = {
    plan: t('billing.proPlan'),
    price: t('billing.price'),
    billingCycle: t('billing.billedAnnually'),
    nextRenewal: t('billing.nextRenewalDate'),
  };

  const paymentMethods = [
    {
      id: '1',
      type: t('billing.visa'),
      last4: '4242',
      expiry: '12/2025',
      isDefault: true,
    },
    {
      id: '2',
      type: t('billing.mastercard'),
      last4: '5678',
      expiry: '08/2024',
      isDefault: false,
    },
  ];

  const invoices = [
    {
      id: '1',
      number: 'F-2023-0015',
      date: '15 Gennaio, 2023',
      amount: '€359,88',
      status: t('billing.paid'),
    },
    {
      id: '2',
      number: 'F-2022-0014',
      date: '15 Dicembre, 2022',
      amount: '€359,88',
      status: t('billing.paid'),
    },
    {
      id: '3',
      number: 'F-2022-0013',
      date: '15 Novembre, 2022',
      amount: '€359,88',
      status: t('billing.paid'),
    },
  ];

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
        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
          {invoice.status}
        </span>
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
        <button type='button' className='text-blue-600 hover:text-blue-900'>
          <ArrowUpTrayIcon className='h-5 w-5' />
        </button>
      </td>
    </>
  );

  const handleChangePlan = () => {
    setNotification({ show: true, message: t('billing.changePlanInfo'), type: 'info' });
  };

  const handleAddPaymentMethod = () => {
    setNotification({ show: true, message: t('billing.addPaymentMethodInfo'), type: 'info' });
  };

  const handleEditPaymentMethod = methodId => {
    setNotification({
      show: true,
      message: t('billing.editPaymentMethodInfo', { methodId }),
      type: 'info',
    });
  };

  return (
    <div className='space-y-8'>
      {/* Subscription Information */}
      <SettingsFormSection title={t('billing.title')} description={t('billing.description')}>
        <div className='bg-gray-50 p-6 rounded-lg'>
          <div className='flex justify-between items-start'>
            <div>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium'>
                {subscriptionInfo.plan}
              </span>
              <p className='mt-1 text-sm text-gray-600'>
                {subscriptionInfo.price}, {subscriptionInfo.billingCycle}
              </p>
            </div>
            <div className='text-sm'>
              <p className='font-medium text-gray-900'>{t('billing.nextRenewal')}</p>
              <p className='text-gray-500'>{subscriptionInfo.nextRenewal}</p>
            </div>
          </div>
          <div className='mt-4 flex justify-end'>
            <button
              type='button'
              onClick={handleChangePlan}
              className='text-sm font-medium text-blue-600 hover:text-blue-500'
            >
              {t('billing.changePlan')}
            </button>
          </div>
        </div>
      </SettingsFormSection>

      {/* Payment Methods */}
      <SettingsFormSection
        title={t('billing.paymentMethodsTitle')}
        description={t('billing.paymentMethodsDescription')}
      >
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-base font-medium text-gray-900'>
            {t('billing.paymentMethodsTitle')}
          </h3>
          <button
            type='button'
            onClick={handleAddPaymentMethod}
            className='inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none'
          >
            <PlusIcon className='h-4 w-4 mr-1' />
            {t('billing.addPaymentMethod')}
          </button>
        </div>

        <div className='bg-white border border-gray-200 rounded-md divide-y divide-gray-200'>
          {paymentMethods.map(method => (
            <div key={method.id} className='p-4 flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='bg-gray-100 p-2 rounded-md'>
                  <CreditCardIcon className='h-6 w-6 text-gray-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-900'>
                    {method.type} •••• {method.last4}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {t('billing.expiry')} {method.expiry}
                  </p>
                </div>
              </div>
              <div className='flex items-center'>
                {method.isDefault && (
                  <span className='mr-4 inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium'>
                    {t('billing.default')}
                  </span>
                )}
                <button
                  type='button'
                  onClick={() => handleEditPaymentMethod(method.id)}
                  className='text-sm text-gray-500 hover:text-gray-700'
                >
                  {t('billing.edit')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SettingsFormSection>

      {/* Invoice History */}
      <SettingsFormSection
        title={t('billing.invoicesTitle')}
        description={t('billing.invoicesDescription')}
      >
        <SettingsTable
          headers={invoiceHeaders}
          data={invoices}
          renderRow={renderInvoiceRow}
          emptyMessage={t('billing.noInvoices')}
        />
      </SettingsFormSection>
    </div>
  );
};

export default BillingSection;
