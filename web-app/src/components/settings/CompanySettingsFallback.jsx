import React, { useState } from 'react';
import { BuildingOfficeIcon, IdentificationIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const CompanySettingsFallback = ({ showNotification }) => {
  const { t } = useTranslation('settings');
  const [company, setCompany] = useState({
    name: 'Demo Company',
    vat_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    favicon_url: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log('💾 Company settings saved (demo mode):', company);
    showNotification && showNotification('Company settings saved successfully (demo mode)', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your company information and branding</p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            🧪 <strong>Demo Mode:</strong> This is a simplified version. Changes are not saved to the database.
          </p>
        </div>
      </div>

      {/* Company Information */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <IdentificationIcon className="h-5 w-5 mr-2" />
          Company Information
        </h3>
        <p className="text-sm text-gray-600 mb-6">Update your company details and contact information</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={company.name || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company name"
              required
            />
          </div>

          {/* VAT Number */}
          <div>
            <label htmlFor="vat_number" className="block text-sm font-medium text-gray-700 mb-2">
              VAT Number
            </label>
            <input
              type="text"
              id="vat_number"
              name="vat_number"
              value={company.vat_number || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter VAT number"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={company.address || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company address"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={company.city || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter city"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={company.postal_code || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter postal code"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={company.email || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company email"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={company.phone || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettingsFallback; 