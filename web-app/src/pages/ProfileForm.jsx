import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';

export default function ProfileForm() {
  const { t } = useTranslation('settings');
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    phone: '',
    business_type: '',
    vat_number: '',
    address: '',
    company_name: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          Logger.error('Error fetching profile:', error);
        } else if (data) {
          setProfileData({
            username: data.username || '',
            full_name: data.full_name || '',
            phone: data.phone || '',
            business_type: data.business_type || '',
            vat_number: data.vat_number || '',
            address: data.address || '',
            company_name: data.company_name || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || '',
          });
        }
      } catch (err) {
        Logger.error('Exception fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updates = {
        id: user.id,
        ...profileData,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates, { returning: 'minimal' });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: t('success.profile'),
      });
    } catch (err) {
      Logger.error('Error updating profile:', err);
      setMessage({
        type: 'error',
        text: err.message || t('errors.profileSave'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async e => {
    if (!e.target.files || e.target.files.length === 0) return;

    setLoading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    try {
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profileData with the new avatar URL
      setProfileData(prev => ({
        ...prev,
        avatar_url: publicUrl,
      }));

      setMessage({
        type: 'success',
        text: t('success.avatar'),
      });
    } catch (err) {
      Logger.error('Error uploading avatar:', err);
      setMessage({
        type: 'error',
        text: err.message || t('errors.avatar'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto bg-white shadow rounded-lg p-6'>
      <h2 className='text-2xl font-semibold text-gray-800 mb-6'>{t('profile.title')}</h2>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Avatar upload section */}
        <div className='mb-6'>
          <div className='flex items-center gap-4'>
            <div className='relative'>
              <img
                src={profileData.avatar_url || 'https://via.placeholder.com/150'}
                alt='Profile'
                className='w-24 h-24 rounded-full object-cover border-2 border-gray-200'
              />
              {loading && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-full'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor='avatar-upload'
                className='bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer'
              >
                {t('profile.avatar.change')}
              </label>
              <input
                id='avatar-upload'
                name='avatar-upload'
                type='file'
                accept='image/*'
                onChange={handleAvatarUpload}
                className='sr-only'
              />
              <p className='mt-1 text-xs text-gray-500'>{t('profile.avatar.help')}</p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Username field */}
          <div>
            <label htmlFor='username' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('profile.username.label')}
            </label>
            <input
              type='text'
              id='username'
              name='username'
              value={profileData.username}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              required
            />
          </div>

          {/* Full name field */}
          <div>
            <label htmlFor='full_name' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('profile.fullName.label', 'Full Name')}
            </label>
            <input
              type='text'
              id='full_name'
              name='full_name'
              value={profileData.full_name}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              required
            />
          </div>

          {/* Phone field */}
          <div>
            <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('profile.phone.label')}
            </label>
            <input
              type='tel'
              id='phone'
              name='phone'
              value={profileData.phone}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {/* Business type field */}
          <div>
            <label htmlFor='business_type' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('company.businessType.label')}
            </label>
            <select
              id='business_type'
              name='business_type'
              value={profileData.business_type}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>{t('company.businessType.selectPlaceholder')}</option>
              <option value='freelance'>{t('company.businessType.options.freelance')}</option>
              <option value='small_business'>
                {t('company.businessType.options.small_business')}
              </option>
              <option value='medium_business'>
                {t('company.businessType.options.medium_business')}
              </option>
              <option value='large_business'>
                {t('company.businessType.options.large_business')}
              </option>
            </select>
          </div>

          {/* VAT number field */}
          <div>
            <label htmlFor='vat_number' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('company.vatNumber.label')}
            </label>
            <input
              type='text'
              id='vat_number'
              name='vat_number'
              value={profileData.vat_number}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {/* Company name field */}
          <div className='md:col-span-2'>
            <label htmlFor='company_name' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('company.name.label')}
            </label>
            <input
              type='text'
              id='company_name'
              name='company_name'
              value={profileData.company_name}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {/* Address field */}
          <div className='md:col-span-2'>
            <label htmlFor='address' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('profile.address.label')}
            </label>
            <input
              type='text'
              id='address'
              name='address'
              value={profileData.address}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {/* Bio field */}
          <div className='md:col-span-2'>
            <label htmlFor='bio' className='block text-sm font-medium text-gray-700 mb-1'>
              {t('profile.bio.label')}
            </label>
            <textarea
              id='bio'
              name='bio'
              rows='3'
              value={profileData.bio}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            ></textarea>
            <p className='mt-1 text-xs text-gray-500'>{t('profile.bio.help')}</p>
          </div>
        </div>

        <div className='mt-8 flex justify-end'>
          <button
            type='submit'
            disabled={loading}
            className='px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
          >
            {loading ? t('buttons.saving') : t('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
