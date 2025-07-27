import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@lib/supabaseClient';
import SettingsFormSection from './SettingsFormSection';
import FileUploadField from './FileUploadField';
import { useProfile } from '@shared/hooks/useProfile';
import { useFileUpload } from '@shared/hooks/useFileUpload';

const CompanySection = ({ user, company, onCompanyUpdate, onImageUpload }) => {
  const { t } = useTranslation('settings');
  const [localCompany, setLocalCompany] = useState(company || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    profileData,
    isSaving,
    error: profileError,
    saveProfile,
    handleProfileChange,
  } = useProfile();

  const {
    isUploading,
    uploadProgress,
    error: uploadError,
    uploadCompanyLogo,
    clearError,
  } = useFileUpload();

  useEffect(() => {
    setLocalCompany(company || {});
  }, [company]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setLocalCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error(t('company.alerts.userNotAuthenticated'));
      }

      const updates = {
        ...localCompany,
        updated_at: new Date(),
      };

      const { error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', company.id);

      if (updateError) {
        throw updateError;
      }

      onCompanyUpdate(updates);
      alert(t('company.alerts.updateSuccess'));
    } catch (error) {
      console.error(t('company.alerts.updateError'), error);
      setError(t('company.alerts.updateFailure'));
      alert(t('company.alerts.genericError') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async file => {
    if (!file) return;
    setLoading(true);
    try {
      const { data: uploadData, error: uploadError } = await onImageUpload('logo', file);
      if (uploadError) throw uploadError;

      const updatedCompany = { ...localCompany, logo_url: uploadData.publicUrl };
      setLocalCompany(updatedCompany);
      onCompanyUpdate(updatedCompany);

      alert(t('company.alerts.logoUpdateSuccess'));
    } catch (error) {
      console.error(t('company.alerts.logoUpdateError'), error);
      alert(t('company.alerts.logoUpdateFailure'));
    } finally {
      setLoading(false);
    }
  };

  const handleFaviconUpload = async file => {
    if (!file) return;
    setLoading(true);
    try {
      const { data: uploadData, error: uploadError } = await onImageUpload('favicon', file);
      if (uploadError) throw uploadError;

      const updatedCompany = { ...localCompany, favicon_url: uploadData.publicUrl };
      setLocalCompany(updatedCompany);
      onCompanyUpdate(updatedCompany);

      alert(t('company.alerts.faviconUpdateSuccess'));
    } catch (error) {
      console.error(t('company.alerts.faviconUpdateError'), error);
      alert(t('company.alerts.faviconUpdateFailure'));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      id: 'name',
      name: 'name',
      label: t('company.name.label'),
      type: 'text',
      value: localCompany.name || '',
    },
    {
      id: 'address',
      name: 'address',
      label: t('company.address.label'),
      type: 'text',
      value: localCompany.address || '',
    },
    {
      id: 'city',
      name: 'city',
      label: t('company.city.label'),
      type: 'text',
      value: localCompany.city || '',
    },
    {
      id: 'country',
      name: 'country',
      label: t('company.country.label'),
      type: 'text',
      value: localCompany.country || '',
    },
    {
      id: 'vat_number',
      name: 'vat_number',
      label: t('company.vatNumber.label'),
      type: 'text',
      value: localCompany.vat_number || '',
    },
    {
      id: 'phone',
      name: 'phone',
      label: t('company.phone.label'),
      type: 'text',
      value: localCompany.phone || '',
    },
    {
      id: 'email',
      name: 'email',
      label: t('company.email.label'),
      type: 'email',
      value: localCompany.email || '',
    },
    {
      id: 'website',
      name: 'website',
      label: t('company.website.label'),
      type: 'url',
      value: localCompany.website || '',
    },
  ];

  return (
    <div id='company' className='bg-white p-4 rounded-lg shadow-md dark:bg-gray-800'>
      <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-white'>
        {t('company.title')}
      </h3>
      <SettingsFormSection
        fields={fields}
        formData={localCompany}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
        loading={loading}
        submitButtonText={t('company.buttons.save')}
      />

      {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}

      <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
        <FileUploadField
          label={t('company.logo.title')}
          onFileUpload={handleLogoUpload}
          currentImageUrl={localCompany.logo_url}
          storagePath='company_logos'
          disabled={loading}
        />
        <FileUploadField
          label={t('company.favicon.title')}
          onFileUpload={handleFaviconUpload}
          currentImageUrl={localCompany.favicon_url}
          storagePath='company_favicons'
          disabled={loading}
        />
      </div>

      {/* Error Display */}
      {(profileError || uploadError) && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{profileError || uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default CompanySection;
