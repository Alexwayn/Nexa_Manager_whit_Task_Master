import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { businessService } from '@lib/businessService';
import Logger from '@utils/Logger';

const TaxSettings = ({ showNotification }) => {
  const { user } = useUser();
  const [taxSettings, setTaxSettings] = useState({
    vat_rate: '',
    tax_id: '',
    is_vat_inclusive: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTaxSettings = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await businessService.getBusinessProfileByUserId(user.id);
        if (error) throw error;
        if (data) {
          setTaxSettings({
            vat_rate: data.vat_rate || '',
            tax_id: data.tax_id || '',
            is_vat_inclusive: data.is_vat_inclusive || false,
          });
        }
      } catch (error) {
        Logger.error('Error fetching tax settings:', error);
        showNotification('Failed to load tax settings.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaxSettings();
  }, [user, showNotification]);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setTaxSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await businessService.updateBusinessProfileByUserId(user.id, taxSettings);
      if (error) throw error;
      showNotification('Tax settings saved successfully!', 'success');
    } catch (error) {
      Logger.error('Error saving tax settings:', error);
      showNotification('Failed to save tax settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading tax settings...</div>;
  }

  return (
    <div className='bg-white shadow sm:rounded-lg'>
      <div className='px-4 py-5 sm:p-6'>
        <h3 className='text-lg leading-6 font-medium text-gray-900'>Tax Settings</h3>
        <div className='mt-2 max-w-xl text-sm text-gray-500'>
          <p>Manage your value-added tax (VAT) and other tax-related settings.</p>
        </div>
        <form className='mt-5 sm:flex sm:items-center' onSubmit={handleSave}>
          <div className='w-full sm:max-w-xs'>
            <label htmlFor='tax_id' className='sr-only'>
              Tax ID
            </label>
            <input
              type='text'
              name='tax_id'
              id='tax_id'
              value={taxSettings.tax_id}
              onChange={handleInputChange}
              className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md'
              placeholder='Your Tax ID or VAT Number'
            />
          </div>
          <div className='w-full sm:max-w-xs ml-4'>
            <label htmlFor='vat_rate' className='sr-only'>
              VAT Rate (%)
            </label>
            <input
              type='number'
              name='vat_rate'
              id='vat_rate'
              value={taxSettings.vat_rate}
              onChange={handleInputChange}
              className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md'
              placeholder='VAT Rate in %'
              step='0.01'
            />
          </div>
          <div className='mt-4 sm:mt-0 sm:ml-3'>
            <button
              type='submit'
              disabled={isSaving}
              className='w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm'
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
        <div className='mt-4'>
          <div className='flex items-center'>
            <input
              id='is_vat_inclusive'
              name='is_vat_inclusive'
              type='checkbox'
              checked={taxSettings.is_vat_inclusive}
              onChange={handleInputChange}
              className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
            />
            <label htmlFor='is_vat_inclusive' className='ml-2 block text-sm text-gray-900'>
              Prices entered with VAT
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSettings;
