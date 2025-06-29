import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthBypass as useAuth } from '@hooks/useClerkBypass';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import { 
  BuildingOfficeIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@lib/supabaseClient';
import { businessService } from '@lib/businessService';
import FileUploadField from '@components/settings/FileUploadField';

export default function CompanySettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const { isAuthenticated } = useClerkAuth();
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCompanyData();
    }
  }, [isAuthenticated, user]);

  const loadCompanyData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profile = await businessService.getBusinessProfile(user.id);
      if (profile) {
        setCompany(profile);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      showNotification && showNotification(t('company.alerts.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updatedProfile = await businessService.updateBusinessProfile(user.id, company);
      setCompany(updatedProfile);
      showNotification && showNotification(t('company.alerts.updateSuccess'), 'success');
    } catch (error) {
      console.error('Error updating company:', error);
      showNotification && showNotification(t('company.alerts.updateFailure'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const logoUrl = await businessService.uploadCompanyLogo(user.id, file);
      const updatedCompany = { ...company, logo_url: logoUrl };
      setCompany(updatedCompany);
      
      // Save to database
      await businessService.updateBusinessProfile(user.id, updatedCompany);
      showNotification && showNotification(t('company.alerts.logoUpdateSuccess'), 'success');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showNotification && showNotification(t('company.alerts.logoUpdateFailure'), 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file) => {
    if (!file) return;
    
    setUploadingFavicon(true);
    try {
      const faviconUrl = await businessService.uploadCompanyFavicon(user.id, file);
      const updatedCompany = { ...company, favicon_url: faviconUrl };
      setCompany(updatedCompany);
      
      // Save to database
      await businessService.updateBusinessProfile(user.id, updatedCompany);
      showNotification && showNotification(t('company.alerts.faviconUpdateSuccess'), 'success');
    } catch (error) {
      console.error('Error uploading favicon:', error);
      showNotification && showNotification(t('company.alerts.faviconUpdateFailure'), 'error');
    } finally {
      setUploadingFavicon(false);
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to access company settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('company.title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('company.description')}</p>
      </div>

      {/* Company Branding */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 mr-2" />
          {t('company.branding.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-6">{t('company.branding.description')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUploadField
            label={t('company.logo.title')}
            onFileUpload={handleLogoUpload}
            currentImageUrl={company.logo_url}
            storagePath="company_logos"
            disabled={uploadingLogo}
            loading={uploadingLogo}
            acceptedFormats={['image/png', 'image/jpeg', 'image/svg+xml']}
            maxSize={5 * 1024 * 1024} // 5MB
          />
          <FileUploadField
            label={t('company.favicon.title')}
            onFileUpload={handleFaviconUpload}
            currentImageUrl={company.favicon_url}
            storagePath="company_favicons"
            disabled={uploadingFavicon}
            loading={uploadingFavicon}
            acceptedFormats={['image/png', 'image/x-icon', 'image/vnd.microsoft.icon']}
            maxSize={1 * 1024 * 1024} // 1MB
          />
        </div>
      </div>

      {/* Company Information */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <IdentificationIcon className="h-5 w-5 mr-2" />
          {t('company.information.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-6">{t('company.information.description')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('company.name.label')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={company.name || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.name.placeholder')}
              required
            />
          </div>

          {/* VAT Number */}
          <div>
            <label htmlFor="vat_number" className="block text-sm font-medium text-gray-700 mb-2">
              {t('company.vatNumber.label')}
            </label>
            <input
              type="text"
              id="vat_number"
              name="vat_number"
              value={company.vat_number || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.vatNumber.placeholder')}
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {t('company.address.label')}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={company.address || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.address.placeholder')}
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              {t('company.city.label')}
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={company.city || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.city.placeholder')}
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              {t('company.country.label')}
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={company.country || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.country.placeholder')}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <PhoneIcon className="h-4 w-4 mr-1" />
              {t('company.phone.label')}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={company.phone || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.phone.placeholder')}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <EnvelopeIcon className="h-4 w-4 mr-1" />
              {t('company.email.label')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={company.email || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.email.placeholder')}
            />
          </div>

          {/* Website */}
          <div className="md:col-span-2">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <GlobeAltIcon className="h-4 w-4 mr-1" />
              {t('company.website.label')}
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={company.website || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('company.website.placeholder')}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.saving')}
              </>
            ) : (
              t('company.buttons.save')
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 