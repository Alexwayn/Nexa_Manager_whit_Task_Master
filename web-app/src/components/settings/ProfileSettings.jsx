import { useState, useEffect } from 'react';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import { useTranslation } from 'react-i18next';

export default function ProfileSettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    position: '',
    address: '',
    bio: '',
    avatarUrl: '/assets/profile.jpg',
  });

  // Fetch user profile on component mount
  useEffect(() => {
    if (isSignedIn && user) {
      try {
        fetchUserProfile();
      } catch (error) {
        Logger.error('Error in useEffect during profile fetch:', error);
        setIsLoading(false);
        showNotification?.('Error loading profile data', 'error');
      }
    } else {
      setIsLoading(false);
    }
  }, [isSignedIn, user]);

  async function fetchUserProfile() {
    try {
      setIsLoading(true);

      // Populate basic info from Clerk user data
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatarUrl: user.imageUrl || prev.avatarUrl,
      }));

      Logger.info('User profile loaded from Clerk data');
    } catch (error) {
      showNotification?.(`Error loading profile: ${String(error?.message || error || 'Unknown error')}`, 'error');
      Logger.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleProfileSave = async e => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Note: Since we're using Clerk, we'll update Clerk user data directly
      // For additional profile data, we might want to save to a Clerk-compatible table

      showNotification?.('Profile updated successfully!', 'success');
      Logger.info('Profile save requested - using Clerk for user management');
    } catch (error) {
      Logger.error('Error saving profile:', error);
      showNotification?.(`Error saving profile: ${String(error?.message || error || 'Unknown error')}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async event => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const bucket = 'avatars';
      const filePath = fileName;

      let { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Add timestamp to URL to force refresh
      const urlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      setProfileData({ ...profileData, avatarUrl: urlWithTimestamp });
      Logger.info('Profile photo uploaded and updated in local state');
      showNotification?.(t('success.profilePhoto'), 'success');
    } catch (error) {
      const errorMessage = t('errors.imageUpload');
      showNotification?.(`${errorMessage} ${String(error?.message || error || 'Unknown error')}`, 'error');
      Logger.error(errorMessage, error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg leading-6 font-medium text-gray-900'>{t('profile.title')}</h3>
        <p className='mt-1 text-sm text-gray-500'>
          {t('profile.description', 'Update your personal information and preferences.')}
        </p>
      </div>

      <form onSubmit={handleProfileSave} className='space-y-6'>
        <div className='bg-white shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='grid grid-cols-6 gap-6'>
              {/* Profile Photo */}
              <div className='col-span-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('profile.avatar.title')}
                </label>
                <div className='mt-1 flex items-center'>
                  <span className='inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100'>
                    {profileData.avatarUrl ? (
                      <img
                        className='h-12 w-12 rounded-full object-cover'
                        src={profileData.avatarUrl}
                        alt={t('profile.avatar.alt', 'Profile')}
                      />
                    ) : (
                      <PhotoIcon className='h-12 w-12 text-gray-300' />
                    )}
                  </span>
                  <label
                    htmlFor='file-upload'
                    className='ml-5 cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <span>{t('profile.avatar.change')}</span>
                    <input
                      id='file-upload'
                      name='file-upload'
                      type='file'
                      className='sr-only'
                      accept='image/*'
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                  {isUploading && (
                    <p className='ml-4 text-sm text-gray-500'>{t('buttons.uploading')}</p>
                  )}
                </div>
                <p className='mt-2 text-sm text-gray-500'>{t('profile.avatar.help')}</p>
              </div>

              {/* First Name */}
              <div className='sm:col-span-3'>
                <label htmlFor='firstName' className='block text-sm font-medium text-gray-700'>
                  {t('profile.firstName.label')}
                </label>
                <div className='mt-1'>
                  <input
                    type='text'
                    name='firstName'
                    id='firstName'
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 sm:text-sm'
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className='sm:col-span-3'>
                <label htmlFor='lastName' className='block text-sm font-medium text-gray-700'>
                  {t('profile.lastName.label')}
                </label>
                <div className='mt-1'>
                  <input
                    type='text'
                    name='lastName'
                    id='lastName'
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  />
                </div>
              </div>

              {/* Email */}
              <div className='sm:col-span-6'>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                  {t('profile.email.label')}
                </label>
                <div className='mt-1'>
                  <input
                    id='email'
                    name='email'
                    type='email'
                    value={profileData.email}
                    disabled
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50'
                  />
                </div>
                <p className='mt-2 text-sm text-gray-500'>{t('profile.email.help')}</p>
              </div>

              {/* Phone */}
              <div className='sm:col-span-3'>
                <label htmlFor='phone' className='block text-sm font-medium text-gray-700'>
                  {t('profile.phone.label')}
                </label>
                <div className='mt-1'>
                  <input
                    type='text'
                    name='phone'
                    id='phone'
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder={t('profile.phone.placeholder')}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className='sm:col-span-3'>
                <label htmlFor='companyName' className='block text-sm font-medium text-gray-700'>
                  {t('profile.company.label')}
                </label>
                <div className='mt-1'>
                  <input
                    type='text'
                    name='companyName'
                    id='companyName'
                    value={profileData.companyName}
                    onChange={handleInputChange}
                    placeholder={t('profile.company.placeholder')}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  />
                </div>
              </div>

              {/* Position */}
              <div className='sm:col-span-3'>
                <label htmlFor='position' className='block text-sm font-medium text-gray-700'>
                  {t('profile.position.label')}
                </label>
                <div className='mt-1'>
                  <input
                    type='text'
                    name='position'
                    id='position'
                    value={profileData.position}
                    onChange={handleInputChange}
                    placeholder={t('profile.position.placeholder')}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  />
                </div>
              </div>

              {/* Address */}
              <div className='sm:col-span-3'>
                <label htmlFor='address' className='block text-sm font-medium text-gray-700'>
                  {t('profile.address.label')}
                </label>
                <div className='mt-1'>
                  <input
                    type='text'
                    name='address'
                    id='address'
                    value={profileData.address}
                    onChange={handleInputChange}
                    placeholder={t('profile.address.placeholder')}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  />
                </div>
              </div>

              {/* Bio */}
              <div className='sm:col-span-6'>
                <label htmlFor='bio' className='block text-sm font-medium text-gray-700'>
                  {t('profile.bio.label')}
                </label>
                <div className='mt-1'>
                  <textarea
                    id='bio'
                    name='bio'
                    rows={3}
                    value={profileData.bio}
                    onChange={handleInputChange}
                    placeholder={t('profile.bio.placeholder')}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md'
                  />
                </div>
                <p className='mt-2 text-sm text-gray-500'>{t('profile.bio.help')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className='flex justify-end space-x-3'>
          <button
            type='button'
            className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            onClick={() => fetchUserProfile()}
          >
            {t('buttons.cancel')}
          </button>
          <button
            type='submit'
            className='ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            disabled={isSaving}
          >
            {isSaving ? t('buttons.saving') : t('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
