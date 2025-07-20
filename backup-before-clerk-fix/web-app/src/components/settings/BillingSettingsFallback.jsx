import React, { useState } from 'react';
import { CreditCardIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const BillingSettingsFallback = ({ showNotification }) => {
  const [settings, setSettings] = useState({
    currency: 'EUR',
    tax_rate: '22',
    payment_terms: '30',
    invoice_prefix: 'INV',
    quote_prefix: 'QUO',
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = e => {
    e.preventDefault();
    console.log('💾 Billing settings saved (demo mode):', settings);
    showNotification &&
      showNotification('Billing settings saved successfully (demo mode)', 'success');
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900'>Billing Settings</h2>
        <p className='mt-1 text-sm text-gray-600'>Configure your billing and invoice preferences</p>
        <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='text-sm text-blue-700'>
            🧪 <strong>Demo Mode:</strong> This is a simplified version. Changes are not saved to
            the database.
          </p>
        </div>
      </div>

      {/* Billing Configuration */}
      <form onSubmit={handleSave} className='bg-white border border-gray-200 rounded-lg p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
          <CreditCardIcon className='h-5 w-5 mr-2' />
          Billing Configuration
        </h3>
        <p className='text-sm text-gray-600 mb-6'>Set up your default billing preferences</p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Currency */}
          <div>
            <label htmlFor='currency' className='block text-sm font-medium text-gray-700 mb-2'>
              Default Currency
            </label>
            <select
              id='currency'
              name='currency'
              value={settings.currency}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='EUR'>EUR (€)</option>
              <option value='USD'>USD ($)</option>
              <option value='GBP'>GBP (£)</option>
            </select>
          </div>

          {/* Tax Rate */}
          <div>
            <label htmlFor='tax_rate' className='block text-sm font-medium text-gray-700 mb-2'>
              Default Tax Rate (%)
            </label>
            <input
              type='number'
              id='tax_rate'
              name='tax_rate'
              value={settings.tax_rate}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='22'
              min='0'
              max='100'
              step='0.01'
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label htmlFor='payment_terms' className='block text-sm font-medium text-gray-700 mb-2'>
              Payment Terms (days)
            </label>
            <input
              type='number'
              id='payment_terms'
              name='payment_terms'
              value={settings.payment_terms}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='30'
              min='1'
            />
          </div>

          {/* Invoice Prefix */}
          <div>
            <label
              htmlFor='invoice_prefix'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Invoice Number Prefix
            </label>
            <input
              type='text'
              id='invoice_prefix'
              name='invoice_prefix'
              value={settings.invoice_prefix}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='INV'
            />
          </div>
        </div>

        {/* Save Button */}
        <div className='mt-6 flex justify-end'>
          <button
            type='submit'
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Invoice Templates */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
          <DocumentTextIcon className='h-5 w-5 mr-2' />
          Invoice Templates
        </h3>
        <p className='text-sm text-gray-600 mb-6'>Manage your invoice and quote templates</p>

        <div className='space-y-4'>
          <div className='border border-gray-200 rounded-lg p-4'>
            <h4 className='font-medium text-gray-900'>Default Template</h4>
            <p className='text-sm text-gray-600 mt-1'>
              Standard invoice template with company branding
            </p>
            <div className='mt-3 flex space-x-3'>
              <button className='px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100'>
                Preview
              </button>
              <button className='px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100'>
                Edit
              </button>
            </div>
          </div>

          <div className='border border-gray-200 rounded-lg p-4'>
            <h4 className='font-medium text-gray-900'>Minimal Template</h4>
            <p className='text-sm text-gray-600 mt-1'>
              Clean, minimal design for professional invoices
            </p>
            <div className='mt-3 flex space-x-3'>
              <button className='px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100'>
                Preview
              </button>
              <button className='px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100'>
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettingsFallback;
