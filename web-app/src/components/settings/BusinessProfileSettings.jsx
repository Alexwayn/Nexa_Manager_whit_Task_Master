import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthBypass as useAuth } from '@hooks/useClerkBypass';
import { businessService } from '@lib/businessService';
import FileUploadField from '@components/settings/FileUploadField';
import { 
  BuildingOfficeIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  IdentificationIcon,
  UserGroupIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const BusinessProfileSettings = ({ showNotification }) => {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await businessService.getBusinessProfileByUserId(user.id);
      if (data) {
        setProfile(data.data || {});
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
      showNotification(t('businessProfile.alerts.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await businessService.updateBusinessProfile(user.id, profile);
      showNotification(t('businessProfile.alerts.updateSuccess'), 'success');
    } catch (error) {
      console.error('Error saving business profile:', error);
      showNotification(t('businessProfile.alerts.updateFailure'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const logoUrl = await businessService.uploadCompanyLogo(user.id, file);
      const updatedProfile = { ...profile, logo_url: logoUrl };
      setProfile(updatedProfile);
      await businessService.updateBusinessProfile(user.id, updatedProfile);
      showNotification(t('businessProfile.alerts.logoUpdateSuccess'), 'success');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showNotification(t('businessProfile.alerts.logoUpdateFailure'), 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 mr-2" />
          {t('businessProfile.companyInfo.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">{t('businessProfile.companyName.label')}</label>
            <input type="text" name="company_name" id="company_name" value={profile.company_name || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
          <div>
            <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">{t('businessProfile.taxId.label')}</label>
            <input type="text" name="tax_id" id="tax_id" value={profile.tax_id || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BriefcaseIcon className="h-5 w-5 mr-2" />
          {t('businessProfile.businessDetails.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">{t('businessProfile.businessType.label')}</label>
            <input type="text" name="business_type" id="business_type" value={profile.business_type || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700">{t('businessProfile.industry.label')}</label>
            <input type="text" name="industry" id="industry" value={profile.industry || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
          <div>
            <label htmlFor="employee_count" className="block text-sm font-medium text-gray-700">{t('businessProfile.employeeCount.label')}</label>
            <input type="number" name="employee_count" id="employee_count" value={profile.employee_count || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2" />
          {t('businessProfile.contactInfo.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">{t('businessProfile.address.label')}</label>
            <input type="text" name="address" id="address" value={profile.address || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('businessProfile.phone.label')}</label>
            <input type="text" name="phone" id="phone" value={profile.phone || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('businessProfile.email.label')}</label>
            <input type="email" name="email" id="email" value={profile.email || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">{t('businessProfile.website.label')}</label>
            <input type="url" name="website" id="website" value={profile.website || ''} onChange={handleInputChange} className="mt-1 block w-full" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('businessProfile.logo.title')}</h3>
        <FileUploadField
          label={t('businessProfile.logo.label')}
          onFileUpload={handleLogoUpload}
          currentImageUrl={profile.logo_url}
          storagePath="company_logos"
          disabled={uploadingLogo}
          loading={uploadingLogo}
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
          {saving ? t('common.saving') : t('common.saveChanges')}
        </button>
      </div>
    </form>
  );
};

export default BusinessProfileSettings;