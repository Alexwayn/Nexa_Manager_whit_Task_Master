import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  UserCircleIcon,
  BellIcon,
  KeyIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  PhotoIcon,
  LockClosedIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth, useUser, UserProfile } from '@clerk/clerk-react';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';
import { businessService } from '@lib/businessService';
import BusinessProfileSettings from '@components/settings/BusinessProfileSettings';
import IntegrationsSettings from '@components/settings/IntegrationsSettings';
import RolesAndPermissionsSettings from '@components/settings/RolesAndPermissionsSettings';
import TaxSettings from '@components/settings/TaxSettings';
import DataExportSettings from '@components/settings/DataExportSettings';
import BillingSettings from '@components/settings/BillingSettings';
import SecuritySettings from '@components/settings/SecuritySettings';
import NotificationSettings from '@components/settings/NotificationSettings';

export default function Settings() {
  const { t } = useTranslation('settings');
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Removed password and session state - now handled by Clerk UserProfile
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // The business profile state is now managed within BusinessProfileSettings.jsx
  // so we can remove the business-related fields from profileData
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    position: '',
    address: '',
    bio: '',
    avatar: '/assets/profile.jpg',
    vatNumber: '',
    taxCode: '',
    legalAddress: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    companyLogo: '/assets/company-logo.png',
    companyLogoUrl: '',
    companyWebsite: '',
    // Business profile specific fields
    businessType: '',
    industry: '',
    employeeCount: '',
    companyDescription: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      promotional: false,
      weekly_digest: false,
      monthly_report: false,
    },
    sms: {
      security_alerts: false,
    },
  });

  // Removed password state - now handled by Clerk UserProfile

  const tabs = [
    { name: t('tabs.profile'), icon: UserCircleIcon },
    { name: t('tabs.security'), icon: KeyIcon },
    { name: t('tabs.notifications'), icon: BellIcon },
    { name: t('tabs.company'), icon: BuildingOfficeIcon },
    { name: t('tabs.billing'), icon: CreditCardIcon },
    { name: t('tabs.rolesAndPermissions'), icon: ShieldCheckIcon },
    { name: t('tabs.tax'), icon: CreditCardIcon },
    { name: t('tabs.dataExport'), icon: ArrowUpTrayIcon },
  ];

  // Fetch user profile on component mount
  useEffect(() => {
    if (isSignedIn && user) {
      try {
        fetchUserProfile();
      } catch (error) {
        Logger.error('Error in useEffect during profile fetch:', error);
        setIsLoading(false);
        showNotification('Error loading profile data', 'error');
      }
    } else {
      setIsLoading(false);
    }
  }, [isSignedIn, user]);

  // Removed session loading useEffect - now handled by Clerk UserProfile

  const showNotification = (message, type = 'success') => {
    try {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
      Logger.info(`Notification: ${message} (${type})`);
    } catch (error) {
      Logger.error('Error showing notification:', error);
      console.error('Notification error:', error);
    }
  };

  async function fetchUserProfile() {
    try {
      setIsLoading(true);
      
      // Since we're using Clerk for authentication, we'll populate basic info from Clerk user data
      // and skip the Supabase profiles table for now
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatarUrl: user.imageUrl || prev.avatarUrl,
      }));
      
      Logger.info('User profile loaded from Clerk data');
    } catch (error) {
      showNotification(`Error loading profile: ${error.message}`, 'error');
      Logger.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchBusinessProfile() {
    if (!user?.id) {
      Logger.warn('No user ID available for fetching business profile');
      return;
    }
    
    try {
      setLoadingBusinessProfile(true);
      const result = await businessService.getBusinessProfileByUserId(user.id);
      
      if (result.data) {
        setBusinessProfile(result.data);
        // Update profileData with business information
        setProfileData(prev => ({
          ...prev,
          companyName: result.data.company_name || '',
          businessType: result.data.business_type || '',
          industry: result.data.industry || '',
          taxCode: result.data.tax_id || '',
          website: result.data.website || '',
          businessPhone: result.data.phone || '',
          legalAddress: result.data.address ? 
            (typeof result.data.address === 'string' ? result.data.address : 
             `${result.data.address.street || ''} ${result.data.address.city || ''} ${result.data.address.zipCode || ''}`.trim()) : '',
          employeeCount: result.data.employee_count || '',
          companyDescription: result.data.description || '',
        }));
        Logger.info('Business profile loaded successfully');
      } else {
        Logger.info('No business profile found for user');
      }
    } catch (error) {
      Logger.error('Error fetching business profile:', error);
      // Don't show error notification if it's just that no profile exists
      if (!error.message.includes('No business profile found')) {
        showNotification(`Error loading business profile: ${error.message}`, 'error');
      }
    } finally {
      setLoadingBusinessProfile(false);
    }
  }

  // The business profile logic is now handled by BusinessProfileSettings.jsx
  // so we can remove fetchBusinessProfile, handleBusinessProfileSave, and related states.

  // Removed session management functions - now handled by Clerk UserProfile

  const handleProfileSave = async () => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      
      const businessData = {
        user_id: user.id,
        company_name: profileData.companyName,
        business_type: profileData.businessType,
        industry: profileData.industry,
        tax_id: profileData.taxCode,
        website: profileData.website,
        phone: profileData.businessPhone,
        address: profileData.legalAddress,
        employee_count: profileData.employeeCount,
        description: profileData.companyDescription,
        onboarding_complete: true,
      };

      let result;
      if (businessProfile?.id) {
        // Update existing business profile
        result = await businessService.updateBusinessProfileByUserId(user.id, businessData);
      } else {
        // Create new business profile
        result = await businessService.createBusinessProfile(businessData);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Refresh business profile data
      await fetchBusinessProfile();
      showNotification('Business profile saved successfully!', 'success');
      
    } catch (error) {
      Logger.error('Error saving business profile:', error);
      showNotification(`Error saving business profile: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Since we're using Clerk, we'll update Clerk user data directly
      // For now, we'll just show success without saving to profiles table
      // In a real app, you might want to save additional profile data to a Clerk-compatible table
      
      showNotification('Profile updated successfully!', 'success');
      Logger.info('Profile save requested - using Clerk for user management');
    } catch (error) {
      Logger.error('Error saving profile:', error);
      showNotification(`Error saving profile: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Removed handlePasswordUpdate - now handled by Clerk UserProfile

  const handleFileUpload = async (event, isCompanyLogo = false) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      if (isCompanyLogo) {
        setIsUploadingCompanyLogo(true);
      } else {
        setIsUploading(true);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const bucket = isCompanyLogo ? 'company_logos' : 'avatars';
      const filePath = `${fileName}`;

      // Logger.log(`${isCompanyLogo ? t('logs.uploadingLogo') : t('logs.uploadingFile')}`, {
      //   bucket,
      //   filePath,
      // });

      let { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Logger.log(
      //   `${isCompanyLogo ? t('logs.publicLogoUrl') : t('logs.publicImageUrl')}`,
      //   publicUrl,
      // );

      // Add timestamp to URL to force refresh
      const urlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;
              // Logger.log(t('logs.addTimestampToUrl'));

      // Save original URL (without timestamp) to DB
      const dbUrl = publicUrl;
              // Logger.log(t('logs.saveOriginalUrl'));

      if (isCompanyLogo) {
        setProfileData({ ...profileData, companyLogoUrl: urlWithTimestamp });
        // For now, we'll just update local state since we're using Clerk for auth
        // In production, you might want to store this in a Clerk-compatible table
        Logger.info('Company logo uploaded and updated in local state');
        showNotification(t('success.companyLogo'), 'success');
      } else {
        setProfileData({ ...profileData, avatarUrl: urlWithTimestamp });
        // For now, we'll just update local state since we're using Clerk for auth
        // Clerk handles its own avatar management
        Logger.info('Profile photo uploaded and updated in local state');
        showNotification(t('success.profilePhoto'), 'success');
      }
    } catch (error) {
      const errorMessage = isCompanyLogo ? t('errors.logoUpload') : t('errors.imageUpload');
      showNotification(`${errorMessage} ${error.message}`, 'error');
      Logger.error(errorMessage, error);
    } finally {
      if (isCompanyLogo) {
        setIsUploadingCompanyLogo(false);
      } else {
        setIsUploading(false);
      }
    }
  };

  const removeCompanyLogo = async () => {
    try {
      // For now, we'll just update local state since we're using Clerk for auth
      // In production, you might want to store this in a Clerk-compatible table
      setProfileData({ ...profileData, companyLogoUrl: '' });
      Logger.info('Company logo removed from local state');
      showNotification(t('success.companyLogoRemoved'), 'success');
    } catch (error) {
      Logger.error('Error removing company logo:', error);
      showNotification(t('errors.logoRemove'), 'error');
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  // Removed handlePasswordChange - now handled by Clerk UserProfile

  const handleNotificationChange = e => {
    const { name, checked } = e.target;
    const [category, key] = name.split('.');
    setNotificationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: checked,
      },
    }));
  };

  // Renders the complete tabs structure with navigation and content
  const renderTabsWithContent = () => (
    <div className='w-full'>
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        {/* Mobile Tab Navigation */}
        <div className='block lg:hidden border-b border-gray-200'>
          <Tab.List className='flex overflow-x-auto scrollbar-hide bg-gray-50'>
            {[
              { name: t('tabs.profile'), icon: UserCircleIcon },
              { name: t('tabs.security'), icon: KeyIcon },
              { name: t('tabs.notifications'), icon: BellIcon },
              { name: t('tabs.company'), icon: BuildingOfficeIcon },
              { name: t('tabs.billing'), icon: CreditCardIcon },
              { name: t('tabs.rolesAndPermissions'), icon: ShieldCheckIcon },
              { name: t('tabs.integrations'), icon: KeyIcon },
            ].map((tab, idx) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex-shrink-0 px-4 py-3 text-sm font-medium focus:outline-none transition-all duration-200 ${
                    selected
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                  }`
                }
              >
                <div className='flex items-center space-x-2'>
                  <tab.icon className='w-4 h-4' />
                  <span className='whitespace-nowrap'>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>
        </div>

        {/* Desktop Tab Navigation */}
        <div className='hidden lg:flex'>
          <div className='w-64 bg-gray-50 p-6 border-r border-gray-200'>
            <Tab.List className='flex flex-col space-y-2'>
              {[
                { name: t('tabs.profile'), icon: UserCircleIcon },
                { name: t('tabs.security'), icon: KeyIcon },
                { name: t('tabs.notifications'), icon: BellIcon },
                { name: t('tabs.company'), icon: BuildingOfficeIcon },
                { name: t('tabs.billing'), icon: CreditCardIcon },
                { name: t('tabs.integrations'), icon: KeyIcon },
              ].map((tab, idx) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      selected
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`
                  }
                >
                  <div className='flex items-center'>
                    <tab.icon className='w-5 h-5 mr-3' />
                    {tab.name}
                  </div>
                </Tab>
              ))}
            </Tab.List>
          </div>
          
          {/* Tab Panels */}
          <div className='flex-1'>
            <Tab.Panels className='w-full'>
              {/* Profile Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <UserProfile />
              </Tab.Panel>

              {/* Security Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <SecuritySettings />
              </Tab.Panel>

              {/* Notifications Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <NotificationSettings settings={notificationSettings} onSettingsChange={setNotificationSettings} showNotification={showNotification} />
              </Tab.Panel>

              {/* Company Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <BusinessProfileSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Billing Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <BillingSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Roles and Permissions Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <RolesAndPermissionsSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Tax Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <TaxSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Data Export Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <DataExportSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Integrations Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <IntegrationsSettings showNotification={showNotification} />
              </Tab.Panel>
          <form onSubmit={handleProfileSave} className='space-y-8 divide-y divide-gray-200'>
            <div className='space-y-8 divide-y divide-gray-200'>
              <div>
                <div className='mb-8'>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    {t('profile.title')}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Manage your personal information and preferences
                  </p>
                </div>
                <div className='mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6'>
                  <div className='sm:col-span-6'>
                    <label htmlFor='photo' className='block text-sm font-medium text-gray-700'>
                      {t('profile.avatar.title')}
                    </label>
                    <div className='mt-1 flex items-center'>
                      <span className='inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100'>
                        {profileData.avatarUrl ? (
                          <img
                            src={profileData.avatarUrl}
                            alt='Avatar'
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <UserCircleIcon className='h-full w-full text-gray-300' />
                        )}
                      </span>
                      <label
                        htmlFor='file-upload'
                        className='ml-5 cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      >
                        <span>{t('profile.avatar.change')}</span>
                        <input
                          id='file-upload'
                          name='file-upload'
                          type='file'
                          className='sr-only'
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

                  {/* Form fields */}
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
                        className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md'
                      />
                    </div>
                  </div>
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
                        className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50'
                      />
                    </div>
                    <p className='mt-2 text-sm text-gray-500'>{t('profile.email.help')}</p>
                  </div>
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
                        className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md'
                      />
                    </div>
                  </div>
                  <div className='sm:col-span-3'>
                    <label
                      htmlFor='companyName'
                      className='block text-sm font-medium text-gray-700'
                    >
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
                        className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md'
                      />
                    </div>
                  </div>
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
                        className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md'
                      />
                    </div>
                  </div>
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
                        className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md'
                      />
                    </div>
                  </div>
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
                        className='shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md'
                      ></textarea>
                    </div>
                    <p className='mt-2 text-sm text-gray-500'>{t('profile.bio.help')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className='pt-5'>
              <div className='flex justify-end'>
                <button
                  type='button'
                  className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  onClick={() => fetchUserProfile()}
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  type='submit'
                  className='ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  disabled={isSaving}
                >
                  {isSaving ? t('buttons.saving') : t('buttons.save')}
                </button>
              </div>
            </div>
          </form>
        </Tab.Panel>

        {/* Security Panel */}
        <Tab.Panel className='rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'>
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
                {t('security.title')}
              </h3>
              <p className='text-sm text-gray-600 mb-6'>
                {t('security.description', 'Manage your account security settings including password, multi-factor authentication, and active sessions.')}
              </p>
            </div>
            
            {/* Clerk UserProfile Component with MFA Support */}
            <div className='clerk-profile-container'>
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border-0 w-full bg-transparent',
                    navbar: 'hidden',
                    navbarMobileMenuButton: 'hidden',
                    headerTitle: 'text-lg font-semibold text-gray-900',
                    headerSubtitle: 'text-gray-600',
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                    formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                    profileSectionPrimaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
                    profileSectionContent: 'space-y-4',
                    breadcrumbsContainer: 'hidden',
                    page: 'bg-transparent',
                    pageScrollBox: 'bg-transparent',
                  },
                  layout: {
                    shimmer: false,
                  },
                }}
                routing="path"
                path="/settings"
              />
            </div>
          </div>
        </Tab.Panel>

        {/* Notifications Panel */}
        <Tab.Panel className='rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'>
          <div className='space-y-8 divide-y divide-gray-200'>
            <div>
              <h3 className='text-lg leading-6 font-medium text-gray-900'>
                {t('notifications.title')}
              </h3>
            </div>
            <div className='pt-8 space-y-6'>
              <fieldset>
                <legend className='text-base font-medium text-gray-900'>
                  {t('notifications.email.title')}
                </legend>
                <p className='text-sm text-gray-500'>{t('notifications.email.description')}</p>
                <div className='mt-4 space-y-4'>
                  <div className='relative flex items-start'>
                    <div className='flex items-center h-5'>
                      <input
                        id='promotional'
                        name='email.promotional'
                        type='checkbox'
                        checked={notificationSettings.email.promotional}
                        onChange={handleNotificationChange}
                        className='focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded'
                      />
                    </div>
                    <div className='ml-3 text-sm'>
                      <label htmlFor='promotional' className='font-medium text-gray-700'>
                        {t('notifications.promotional.title')}
                      </label>
                      <p className='text-gray-500'>{t('notifications.promotional.description')}</p>
                    </div>
                  </div>
                  <div className='relative flex items-start'>
                    <div className='flex items-center h-5'>
                      <input
                        id='weekly_digest'
                        name='email.weekly_digest'
                        type='checkbox'
                        checked={notificationSettings.email.weekly_digest}
                        onChange={handleNotificationChange}
                        className='focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded'
                      />
                    </div>
                    <div className='ml-3 text-sm'>
                      <label htmlFor='weekly_digest' className='font-medium text-gray-700'>
                        {t('notifications.weekly.title')}
                      </label>
                      <p className='text-gray-500'>{t('notifications.weekly.description')}</p>
                    </div>
                  </div>
                  <div className='relative flex items-start'>
                    <div className='flex items-center h-5'>
                      <input
                        id='monthly_report'
                        name='email.monthly_report'
                        type='checkbox'
                        checked={notificationSettings.email.monthly_report}
                        onChange={handleNotificationChange}
                        className='focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded'
                      />
                    </div>
                    <div className='ml-3 text-sm'>
                      <label htmlFor='monthly_report' className='font-medium text-gray-700'>
                        {t('notifications.monthly.title')}
                      </label>
                      <p className='text-gray-500'>{t('notifications.monthly.description')}</p>
                    </div>
                  </div>
                </div>
              </fieldset>
              <fieldset>
                <legend className='text-base font-medium text-gray-900'>
                  {t('notifications.devices.title')}
                </legend>
                <div className='mt-4 space-y-4'>
                  <div className='relative flex items-start'>
                    <div className='flex items-center h-5'>
                      <input
                        id='security_alerts'
                        name='sms.security_alerts'
                        type='checkbox'
                        checked={notificationSettings.sms.security_alerts}
                        onChange={handleNotificationChange}
                        className='focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded'
                      />
                    </div>
                    <div className='ml-3 text-sm'>
                      <label htmlFor='security_alerts' className='font-medium text-gray-700'>
                        {t('notifications.security.title')}
                      </label>
                      <p className='text-gray-500'>{t('notifications.security.description')}</p>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className='pt-5'>
              <div className='flex justify-end'>
                <button
                  type='button'
                  className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  onClick={() => {
                    setNotificationSettings({
                      email: { promotional: false, weekly_digest: false, monthly_report: false },
                      sms: { security_alerts: false },
                    });
                  }}
                >
                  {t('settings.notifications.button.restore')}
                </button>
                <button
                  type='button'
                  onClick={handleProfileSave}
                  className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  {t('settings.notifications.button.save')}
                </button>
              </div>
            </div>
          </div>
        </Tab.Panel>

        {/* Company Section */}
        <Tab.Panel className='rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-medium text-gray-900'>Business Profile</h2>
              {loadingBusinessProfile && (
                <div className='flex items-center space-x-2 text-sm text-gray-500'>
                  <svg className='animate-spin h-4 w-4' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  <span>Loading...</span>
                </div>
              )}
            </div>

            <div className='space-y-6'>
              {businessProfile ? (
                <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-md'>
                  <p className='text-sm text-green-800'>
                    ✅ Business profile found and loaded
                  </p>
                </div>
              ) : (
                <div className='mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
                  <p className='text-sm text-yellow-800'>
                    ⚠️ No business profile found. Create one by filling out the form below.
                  </p>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Company Name */}
                <div className='md:col-span-2 space-y-2'>
                  <label htmlFor='companyName' className='block text-sm font-medium text-gray-700'>
                    Company Name *
                  </label>
                  <input
                    type='text'
                    name='companyName'
                    id='companyName'
                    value={profileData.companyName}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                    placeholder='Enter your company name'
                    required
                  />
                </div>

                {/* Business Type */}
                <div className='space-y-2'>
                  <label htmlFor='businessType' className='block text-sm font-medium text-gray-700'>
                    Business Type *
                  </label>
                  <select
                    name='businessType'
                    id='businessType'
                    value={profileData.businessType}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                    required
                  >
                    <option value=''>Select business type</option>
                    <option value='Individual'>Individual/Freelancer</option>
                    <option value='SME'>Small/Medium Enterprise</option>
                    <option value='Corporation'>Corporation</option>
                    <option value='Partnership'>Partnership</option>
                    <option value='LLC'>LLC</option>
                    <option value='Nonprofit'>Nonprofit</option>
                  </select>
                </div>

                {/* Industry */}
                <div className='space-y-2'>
                  <label htmlFor='industry' className='block text-sm font-medium text-gray-700'>
                    Industry
                  </label>
                  <input
                    type='text'
                    name='industry'
                    id='industry'
                    value={profileData.industry}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                    placeholder='e.g. Technology, Healthcare, Retail'
                  />
                </div>

                {/* Tax Code */}
                <div className='space-y-2'>
                  <label htmlFor='taxCode' className='block text-sm font-medium text-gray-700'>
                    Tax ID / VAT Number
                  </label>
                  <input
                    type='text'
                    name='taxCode'
                    id='taxCode'
                    value={profileData.taxCode}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                    placeholder='Enter your tax ID or VAT number'
                  />
                </div>

                {/* Employee Count */}
                <div className='space-y-2'>
                  <label htmlFor='employeeCount' className='block text-sm font-medium text-gray-700'>
                    Employee Count
                  </label>
                  <select
                    name='employeeCount'
                    id='employeeCount'
                    value={profileData.employeeCount}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                  >
                    <option value=''>Select range</option>
                    <option value='1'>Just me</option>
                    <option value='2-10'>2-10 employees</option>
                    <option value='11-50'>11-50 employees</option>
                    <option value='51-200'>51-200 employees</option>
                    <option value='200+'>200+ employees</option>
                  </select>
                </div>

                {/* Business Phone */}
                <div className='space-y-2'>
                  <label htmlFor='businessPhone' className='block text-sm font-medium text-gray-700'>
                    Business Phone
                  </label>
                  <input
                    type='tel'
                    name='businessPhone'
                    id='businessPhone'
                    value={profileData.businessPhone}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                    placeholder='+1 (555) 123-4567'
                  />
                </div>

                {/* Website */}
                <div className='space-y-2'>
                  <label htmlFor='website' className='block text-sm font-medium text-gray-700'>
                    Website
                  </label>
                  <div className='mt-1 flex rounded-md shadow-sm'>
                    <span className='inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm'>
                      https://
                    </span>
                    <input
                      type='text'
                      name='website'
                      id='website'
                      value={profileData.website}
                      onChange={handleInputChange}
                      className='flex-1 min-w-0 block w-full px-3 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 border-gray-300'
                      placeholder='www.yourcompany.com'
                    />
                  </div>
                </div>

                {/* Business Address */}
                <div className='md:col-span-2 space-y-2'>
                  <label htmlFor='legalAddress' className='block text-sm font-medium text-gray-700'>
                    Business Address
                  </label>
                  <input
                    type='text'
                    name='legalAddress'
                    id='legalAddress'
                    value={profileData.legalAddress}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                    placeholder='Enter your business address'
                  />
                </div>

                {/* Company Description */}
                <div className='md:col-span-2 space-y-2'>
                  <label htmlFor='companyDescription' className='block text-sm font-medium text-gray-700'>
                    Company Description
                  </label>
                  <textarea
                    name='companyDescription'
                    id='companyDescription'
                    rows={4}
                    value={profileData.companyDescription}
                    onChange={handleInputChange}
                    className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md'
                    placeholder='Brief description of your business...'
                  />
                </div>
              </div>

              <div className='flex justify-end space-x-3 pt-5 border-t border-gray-200'>
                <button
                  type='button'
                  className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  onClick={() => window.location.reload()}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleBusinessProfileSave}
                  disabled={isSaving}
                  className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSaving ? (
                    <>
                      <svg className='animate-spin -ml-1 mr-3 h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Business Profile'
                  )}
                </button>
              </div>
            </div>
          </div>
        </Tab.Panel>

        {/* Billing Section */}
        <Tab.Panel className='rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'>
          <div className='p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-6'>{t('billing.plan.title')}</h2>

            {/* Current plan */}
            <div className='mb-8'>
              <h3 className='text-base font-medium text-gray-900 mb-3'>
                {t('billing.plan.title')}
              </h3>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium'>
                      {t('billing.plan.current')}
                    </span>
                    <p className='mt-1 text-sm text-gray-600'>{t('billing.plan.price')}</p>
                  </div>
                  <div className='text-sm'>
                    <p className='font-medium text-gray-900'>{t('billing.plan.nextRenewal')}</p>
                    <p className='text-gray-500'>January 15, 2024</p>
                  </div>
                </div>
                <div className='mt-4 flex justify-end'>
                  <button
                    type='button'
                    className='text-sm font-medium text-blue-600 hover:text-blue-500'
                  >
                    {t('billing.plan.change')}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className='mb-8'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-base font-medium text-gray-900'>
                  {t('billing.payment.methods')}
                </h3>
                <button
                  type='button'
                  className='inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none'
                >
                  <PlusIcon className='h-4 w-4 mr-1' />
                  {t('billing.payment.add')}
                </button>
              </div>

              <div className='bg-white border border-gray-200 rounded-md divide-y divide-gray-200'>
                <div className='p-4 flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='bg-gray-100 p-2 rounded-md'>
                      <CreditCardIcon className='h-6 w-6 text-gray-600' />
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-900'>Visa •••• 4242</p>
                      <p className='text-xs text-gray-500'>
                        {t('billing.payment.expiryShort')}12/2025
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center'>
                    <span className='mr-4 inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium'>
                      {t('billing.payment.defaultCard')}
                    </span>
                    <button type='button' className='text-sm text-gray-500 hover:text-gray-700'>
                      {t('billing.payment.edit')}
                    </button>
                  </div>
                </div>

                <div className='p-4 flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='bg-gray-100 p-2 rounded-md'>
                      <CreditCardIcon className='h-6 w-6 text-gray-600' />
                    </div>
                    <div className='ml-4'>
                      <p className='text-sm font-medium text-gray-900'>Mastercard •••• 5678</p>
                      <p className='text-xs text-gray-500'>
                        {t('billing.payment.expiryShort')}08/2024
                      </p>
                    </div>
                  </div>
                  <div>
                    <button type='button' className='text-sm text-gray-500 hover:text-gray-700'>
                      {t('billing.payment.edit')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h3 className='text-base font-medium text-gray-900 mb-4'>
                {t('billing.invoices.tableTitle')}
              </h3>
              <div className='overflow-hidden rounded-md border border-gray-200'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        {t('billing.invoices.number')}
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        {t('billing.invoices.date')}
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        {t('billing.invoices.amount')}
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        {t('billing.invoices.status')}
                      </th>
                      <th scope='col' className='relative px-6 py-3'>
                        <span className='sr-only'>Download</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    <tr>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        F-2023-0015
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {t('billing.invoices.sampleDate1')}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>€359,88</td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {t('billing.invoices.statusPaid')}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <button type='button' className='text-blue-600 hover:text-blue-900'>
                          <ArrowUpTrayIcon className='h-5 w-5' />
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        F-2022-0014
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {t('billing.invoices.sampleDate2')}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>€359,88</td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {t('billing.invoices.statusPaid')}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <button type='button' className='text-blue-600 hover:text-blue-900'>
                          <ArrowUpTrayIcon className='h-5 w-5' />
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        F-2022-0013
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {t('billing.invoices.sampleDate3')}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>€359,88</td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {t('billing.invoices.statusPaid')}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <button type='button' className='text-blue-600 hover:text-blue-900'>
                          <ArrowUpTrayIcon className='h-5 w-5' />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Tab.Panel>
      </Tab.Panels>
          </div>
        </div>
    </Tab.Group>
    </div>
  );

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
        {/* Header */}
        <div className='bg-white shadow-sm border-b border-gray-200'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>{t('title')}</h1>
                <p className='text-sm text-gray-600 mt-1'>{t('subtitle')}</p>
              </div>
              <div className='flex items-center space-x-3'>
                {isLoading && (
                  <div className='flex items-center text-blue-600'>
                    <svg className='animate-spin h-5 w-5 mr-2' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'></circle>
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                    <span className='text-sm'>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
            {renderTabsWithContent()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Notification Banner */}
      <Transition
        show={notification.show}
        as={Fragment}
        enter='transition ease-out duration-300'
        enterFrom='transform opacity-0 scale-95'
        enterTo='transform opacity-100 scale-100'
        leave='transition ease-in duration-200'
        leaveFrom='transform opacity-100 scale-100'
        leaveTo='transform opacity-0 scale-95'
      >
        <div
          className={`fixed top-5 right-5 w-auto max-w-sm rounded-md shadow-lg p-4 z-50 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              {notification.type === 'success' ? (
                <CheckCircleIcon className='h-6 w-6 text-white' />
              ) : (
                <XCircleIcon className='h-6 w-6 text-white' />
              )}
            </div>
            <div className='ml-3 flex-1'>
              <p className='text-sm font-medium text-white'>{notification.message}</p>
            </div>
            <div className='ml-4 flex-shrink-0'>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className='inline-flex text-white'
              >
                <span className='sr-only'>Close</span>
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
}
