import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsFormSection from './SettingsFormSection';
import FileUploadField from './FileUploadField';
import ComponentErrorBoundary from '@shared/components';
import { useProfile } from '@shared/hooks/useProfile';
import { useFileUpload } from '@shared/hooks/useFileUpload';

const ProfileSectionOptimized = memo(({ setNotification }) => {
  const { t } = useTranslation('settings');
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
    uploadAvatar,
    clearError,
  } = useFileUpload();

  // Memoize form submission handler
  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      const success = await saveProfile();
      if (success) {
        setNotification({
          show: true,
          message: t('profile.alerts.updateSuccess'),
          type: 'success',
        });
      }
    },
    [saveProfile, setNotification, t],
  );

  // Memoize avatar upload handler
  const handleAvatarUpload = useCallback(
    async file => {
      clearError();
      const result = await uploadAvatar(file);
      if (result) {
        setNotification({
          show: true,
          message: t('profile.alerts.avatarUpdateSuccess'),
          type: 'success',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    },
    [uploadAvatar, clearError, setNotification, t],
  );

  // Memoize avatar removal handler
  const removeAvatar = useCallback(async () => {
    const success = await saveProfile({ avatar_url: '/assets/profile.jpg' });
    if (success) {
      setNotification({
        show: true,
        message: t('profile.alerts.avatarRemoveSuccess'),
        type: 'success',
      });
      window.location.reload();
    }
  }, [saveProfile, setNotification, t]);

  // Memoize form fields configuration
  const formFields = useMemo(
    () => [
      {
        id: 'firstName',
        label: t('profile.firstName.label'),
        type: 'text',
        value: profileData.firstName,
        colSpan: 1,
      },
      {
        id: 'lastName',
        label: t('profile.lastName.label'),
        type: 'text',
        value: profileData.lastName,
        colSpan: 1,
      },
      {
        id: 'email',
        label: t('profile.email.label'),
        type: 'email',
        value: profileData.email,
        disabled: true,
        colSpan: 1,
        helpText: t('profile.email.help'),
      },
      {
        id: 'phone',
        label: t('profile.phone.label'),
        type: 'tel',
        value: profileData.phone,
        colSpan: 1,
      },
      {
        id: 'position',
        label: t('profile.position.label'),
        type: 'text',
        value: profileData.position,
        colSpan: 1,
      },
      {
        id: 'address',
        label: t('profile.address.label'),
        type: 'text',
        value: profileData.address,
        colSpan: 2,
      },
    ],
    [profileData, t],
  );

  // Memoize error display
  const errorDisplay = useMemo(() => {
    if (!profileError && !uploadError) return null;

    return (
      <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
        <p className='text-sm text-red-600'>{profileError || uploadError}</p>
      </div>
    );
  }, [profileError, uploadError]);

  // Memoize form fields JSX
  const formFieldsJSX = useMemo(
    () => (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        {formFields.map(field => (
          <div key={field.id} className={field.colSpan === 2 ? 'md:col-span-2' : ''}>
            <label htmlFor={field.id} className='block text-sm font-medium text-gray-700 mb-1'>
              {field.label}
            </label>
            <input
              type={field.type}
              name={field.id}
              id={field.id}
              value={field.value}
              onChange={handleProfileChange}
              disabled={field.disabled}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                field.disabled ? 'bg-gray-50 text-gray-500' : ''
              }`}
            />
            {field.helpText && <p className='mt-1 text-xs text-gray-500'>{field.helpText}</p>}
          </div>
        ))}
      </div>
    ),
    [formFields, handleProfileChange],
  );

  return (
    <ComponentErrorBoundary componentName='ProfileSection'>
      <SettingsFormSection
        title={t('profile.title')}
        description={t('profile.description')}
        onSubmit={handleSubmit}
      >
        {/* Avatar Upload */}
        <FileUploadField
          label={t('profile.avatar.title')}
          currentImage={profileData.avatar}
          altText={t('profile.avatar.title')}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onFileSelect={handleAvatarUpload}
          onRemove={removeAvatar}
          error={uploadError}
          className='mb-6'
        />

        {/* Personal Information Form */}
        {formFieldsJSX}

        {/* Bio */}
        <div className='mb-6'>
          <label htmlFor='bio' className='block text-sm font-medium text-gray-700 mb-1'>
            {t('profile.bio.label')}
          </label>
          <div className='mt-1'>
            <textarea
              id='bio'
              name='bio'
              rows={4}
              value={profileData.bio}
              onChange={handleProfileChange}
              className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
              placeholder={t('profile.bio.placeholder')}
            />
          </div>
          <p className='mt-2 text-sm text-gray-500'>{t('profile.bio.help')}</p>
        </div>

        {/* Error Display */}
        {errorDisplay}

        {/* Action Buttons */}
        <div className='flex justify-end space-x-3 pt-5 border-t border-gray-200'>
          <button
            type='button'
            className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            {t('buttons.cancel')}
          </button>
          <button
            type='submit'
            disabled={isSaving || isUploading}
            className='inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70'
          >
            {isSaving ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                {t('buttons.saving')}
              </>
            ) : (
              t('buttons.save')
            )}
          </button>
        </div>
      </SettingsFormSection>
    </ComponentErrorBoundary>
  );
});

ProfileSectionOptimized.displayName = 'ProfileSectionOptimized';

export default ProfileSectionOptimized;
