import { useState, Fragment, useEffect } from 'react';
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
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';

export default function Settings() {
  const { t } = useTranslation('settings');
  const { user, updateUserAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Default profile data that will be overwritten with actual data
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

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { name: t('tabs.profile'), icon: UserCircleIcon },
    { name: t('tabs.security'), icon: KeyIcon },
    { name: t('tabs.notifications'), icon: BellIcon },
    { name: t('tabs.company'), icon: BuildingOfficeIcon },
    { name: t('tabs.billing'), icon: CreditCardIcon },
  ];

  // Fetch user profile on component mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Load sessions when Security tab is activated
  useEffect(() => {
    if (activeTab === 1 && sessions.length === 0) {
      Logger.log(t('logs.loadSessionsSecurityTab'));
      fetchUserSessions();
    }
  }, [activeTab]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
    Logger.log(`${message} - ${t('logs.hideAfterSeconds')}`);
  };

  async function fetchUserProfile() {
    try {
      setIsLoading(true);
      Logger.log(`${t('logs.fetchingProfile')} ${user.id}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile not found
        Logger.log(t('logs.profileNotFound'));
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, username: user.email.split('@')[0], email: user.email }])
          .select()
          .single();
        if (createError) throw createError;
        Logger.log(t('logs.profileCreated'), newProfile);
        setProfileData({
          ...profileData,
          firstName: newProfile.full_name || '',
          email: newProfile.email,
          avatarUrl: newProfile.avatar_url,
        });
      } else if (error) {
        throw error;
      } else {
        Logger.log(t('logs.profileFetched'), data);
        setProfileData({
          firstName: data.full_name?.split(' ')[0] || '',
          lastName: data.full_name?.split(' ').slice(1).join(' ') || '',
          email: data.email || user.email,
          phone: data.phone || '',
          companyName: data.company_name || '',
          position: data.position || '',
          address: data.address || '',
          bio: data.bio || '',
          avatarUrl: data.avatar_url,
          companyLogoUrl: data.company_logo_url || '',
          companyVatNumber: data.company_vat_number || '',
          companyTaxCode: data.company_tax_code || '',
          companyLegalAddress: data.company_legal_address || '',
          companyBusinessPhone: data.company_business_phone || '',
          companyBusinessEmail: data.company_business_email || '',
          companyWebsite: data.company_website || '',
        });
        
        if (data.notification_settings) {
          if (typeof data.notification_settings === 'string') {
            try {
              const parsedSettings = JSON.parse(data.notification_settings);
              setNotificationSettings(parsedSettings);
              Logger.log(t('logs.notificationConverted'));
            } catch (e) {
              Logger.error(t('logs.notificationParseError'), e);
            }
          } else {
            setNotificationSettings(data.notification_settings);
          }
        }
      }
    } catch (error) {
      showNotification(`${t('errors.profileSave')} ${error.message}`, 'error');
      Logger.error(`${t('errors.profileSave')}`, error);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchUserSessions = async () => {
    setLoadingSessions(true);
    const { data, error } = await supabase.auth.admin.listUserSessions(user.id);
    if (error) {
      Logger.error(t('errors.sessionsFetch'), error);
      showNotification(`${t('errors.sessionsFetch')}: ${error.message}`, 'error');
    } else {
      setSessions(data.sessions || []);
    }
    setLoadingSessions(false);
  };

  const revokeSession = async (sessionId) => {
    const { error } = await supabase.auth.admin.revokeUserSessions(user.id, sessionId);
    if (error) {
      showNotification(`${t('errors.deviceDisconnect')} ${error.message}`, 'error');
    } else {
      showNotification(t('success.deviceDisconnected'), 'success');
      fetchUserSessions(); // Refresh the list
    }
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    setIsSaving(true);
    Logger.log(`${t('logs.savingProfile')} ${user.id}`);
    
    try {
      const updates = {
        id: user.id,
        full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.email,
        phone: profileData.phone,
        company_name: profileData.companyName,
        position: profileData.position,
        address: profileData.address,
        bio: profileData.bio,
        updated_at: new Date(),
        company_vat_number: profileData.companyVatNumber,
        company_tax_code: profileData.companyTaxCode,
        company_legal_address: profileData.companyLegalAddress,
        company_business_phone: profileData.companyBusinessPhone,
        company_business_email: profileData.companyBusinessEmail,
        company_website: profileData.companyWebsite,
        notification_settings: notificationSettings,
      };

      Logger.log(t('logs.dataToSave'), updates);

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      
      showNotification(t('success.profile'), 'success');

    } catch (error) {
      Logger.error(t('errors.profileSave'), error);
      showNotification(`${t('errors.profileSave')} ${error.message || t('errors.checkConsole')}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async e => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification(t('errors.passwordMismatch'), 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showNotification(t('errors.passwordLength'), 'error');
      return;
    }
    setIsUpdatingPassword(true);
    
    // Supabase does not provide a direct way to verify the current password.
    // The recommended approach is to re-authenticate the user.
    const { error: reauthError } = await supabase.auth.reauthenticate();
    if (reauthError) {
      showNotification(`${t('errors.passwordUpdate')} ${reauthError.message}`, 'error');
      setIsUpdatingPassword(false);
      return;
    }
    
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
    if (error) {
      showNotification(`${t('errors.passwordUpdate')} ${error.message}`, 'error');
    } else {
      showNotification(t('success.passwordUpdated'), 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    setIsUpdatingPassword(false);
  };
  
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

      Logger.log(`${isCompanyLogo ? t('logs.uploadingLogo') : t('logs.uploadingFile')}`, { bucket, filePath });

      let { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      Logger.log(`${isCompanyLogo ? t('logs.publicLogoUrl') : t('logs.publicImageUrl')}`, publicUrl);
      
      // Add timestamp to URL to force refresh
      const urlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;
      Logger.log(t('logs.addTimestampToUrl'));
      
      // Save original URL (without timestamp) to DB
      const dbUrl = publicUrl; 
      Logger.log(t('logs.saveOriginalUrl'));

      if (isCompanyLogo) {
        setProfileData({ ...profileData, companyLogoUrl: urlWithTimestamp });
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ company_logo_url: dbUrl })
          .eq('id', user.id);
        if (dbError) throw dbError;
        showNotification(t('success.companyLogo'), 'success');
      } else {
        setProfileData({ ...profileData, avatarUrl: urlWithTimestamp });
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ avatar_url: dbUrl })
          .eq('id', user.id);
        if (dbError) throw dbError;
        updateUserAvatar(urlWithTimestamp);
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
      const { error } = await supabase
        .from('profiles')
        .update({ company_logo_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setProfileData({ ...profileData, companyLogoUrl: '' });
      showNotification(t('success.companyLogoRemoved'), 'success');
    } catch (error) {
      Logger.error(t('errors.logoRemove'), error);
      showNotification(t('errors.logoRemove'), 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };
  
  const handleNotificationChange = (e) => {
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
  
  // Renders the list of tabs with icons for navigation
  const renderTabs = () => (
    <div className="w-full max-w-xs px-2 py-8 sm:px-0">
      <Tab.Group vertical selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex flex-col space-y-1 rounded-xl bg-white p-1">
          {[
            { name: t('tabs.profile'), icon: UserCircleIcon },
            { name: t('tabs.security'), icon: KeyIcon },
            { name: t('tabs.notifications'), icon: BellIcon },
            { name: t('tabs.company'), icon: BuildingOfficeIcon },
            { name: t('tabs.billing'), icon: CreditCardIcon },
          ].map((tab, idx) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 px-3 text-sm font-medium leading-5 text-gray-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 flex items-center
                ${
                  selected
                    ? 'bg-blue-100 text-blue-700 shadow'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </div>
  );
  
  // Main form content based on selected tab
  const renderTabContent = () => (
    <div className="mt-8 flex-1">
      <Tab.Panels as={Fragment}>
        {/* Profile Panel */}
        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
          <form onSubmit={handleProfileSave} className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-8 divide-y divide-gray-200">
              <div>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profile.title')}</h3>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                      {t('profile.avatar.title')}
                    </label>
                    <div className="mt-1 flex items-center">
                      <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        {profileData.avatarUrl ? (
                          <img
                            src={profileData.avatarUrl}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="h-full w-full text-gray-300" />
                        )}
                      </span>
                      <label
                        htmlFor="file-upload"
                        className="ml-5 cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <span>{t('profile.avatar.change')}</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                      {isUploading && <p className="ml-4 text-sm text-gray-500">{t('buttons.uploading')}</p>}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{t('profile.avatar.help')}</p>
                  </div>
                  
                  {/* Form fields */}
                  <div className="sm:col-span-3">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      {t('profile.firstName.label')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      {t('profile.lastName.label')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      {t('profile.email.label')}
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                     <p className="mt-2 text-sm text-gray-500">{t('profile.email.help')}</p>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      {t('profile.phone.label')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        placeholder={t('profile.phone.placeholder')}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      {t('profile.company.label')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="companyName"
                        id="companyName"
                        value={profileData.companyName}
                        onChange={handleInputChange}
                        placeholder={t('profile.company.placeholder')}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                      {t('profile.position.label')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="position"
                        id="position"
                        value={profileData.position}
                        onChange={handleInputChange}
                        placeholder={t('profile.position.placeholder')}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      {t('profile.address.label')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        placeholder={t('profile.address.placeholder')}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-6">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      {t('profile.bio.label')}
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        value={profileData.bio}
                        onChange={handleInputChange}
                        placeholder={t('profile.bio.placeholder')}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      ></textarea>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{t('profile.bio.help')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => fetchUserProfile()}
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSaving}
                >
                  {isSaving ? t('buttons.saving') : t('buttons.save')}
                </button>
              </div>
            </div>
          </form>
        </Tab.Panel>

        {/* Security Panel */}
        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
           <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('security.title')}</h3>
            </div>
            <div className="pt-8">
              <h4 className="text-md leading-6 font-medium text-gray-900">{t('security.password.title')}</h4>
               <form onSubmit={handlePasswordUpdate} className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                 <div className="sm:col-span-4">
                    <label htmlFor="currentPassword"
                           className="block text-sm font-medium text-gray-700">{t('security.password.current')}</label>
                    <div className="mt-1">
                      <input type="password" name="currentPassword" id="currentPassword"
                             value={passwordData.currentPassword} onChange={handlePasswordChange}
                             className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                  </div>
                 <div className="sm:col-span-4">
                    <label htmlFor="newPassword"
                           className="block text-sm font-medium text-gray-700">{t('security.password.new')}</label>
                    <div className="mt-1">
                      <input type="password" name="newPassword" id="newPassword"
                             value={passwordData.newPassword} onChange={handlePasswordChange}
                             className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                     <p className="mt-2 text-sm text-gray-500">{t('security.password.minLength')}</p>
                  </div>
                 <div className="sm:col-span-4">
                    <label htmlFor="confirmPassword"
                           className="block text-sm font-medium text-gray-700">{t('security.password.confirm')}</label>
                    <div className="mt-1">
                      <input type="password" name="confirmPassword" id="confirmPassword"
                             value={passwordData.confirmPassword} onChange={handlePasswordChange}
                             className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                  </div>
                  <div className="sm:col-span-6">
                    <button type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? t('buttons.updating') : t('security.password.button')}
                    </button>
                  </div>
               </form>
            </div>
             <div className="pt-8">
               <h4 className="text-md leading-6 font-medium text-gray-900">{t('security.sessions.title')}</h4>
               <p className="mt-1 text-sm text-gray-500">{t('security.sessions.description')}</p>
               <div className="mt-6">
                 {loadingSessions ? (
                   <p>{t('security.sessions.loading')}</p>
                 ) : sessions.length > 0 ? (
                   <ul role="list" className="divide-y divide-gray-200">
                     {sessions.map((session) => (
                       <li key={session.id} className="py-4 flex items-center justify-between">
                         <div className="flex items-center">
                           <DevicePhoneMobileIcon className="h-6 w-6 text-gray-500"/>
                           <div className="ml-3">
                             <p className="text-sm font-medium text-gray-900">
                               {session.user_agent?.os?.name || 'Unknown OS'}
                               {session.id === supabase.auth.session()?.id && <span className="text-xs text-green-600"> ({t('security.sessions.current')})</span>}
                             </p>
                             <p className="text-sm text-gray-500">
                               {session.user_agent?.browser?.name || 'Unknown Browser'} - {session.ip}
                             </p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm text-gray-900">{t('security.sessions.lastActive')}: {new Date(session.last_seen).toLocaleString()}</p>
                           <button onClick={() => revokeSession(session.id)}
                                   className="text-sm font-medium text-red-600 hover:text-red-800">{t('security.sessions.revoke')}</button>
                         </div>
                       </li>
                     ))}
                   </ul>
                 ) : (
                    <p>{t('security.sessions.none')}</p>
                  )}
                  <p className="mt-4 text-xs text-gray-500">{t('security.sessions.currentNote')}</p>
               </div>
             </div>
           </div>
        </Tab.Panel>

        {/* Notifications Panel */}
        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
          <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('notifications.title')}</h3>
            </div>
            <div className="pt-8 space-y-6">
              <fieldset>
                <legend className="text-base font-medium text-gray-900">{t('notifications.email.title')}</legend>
                <p className="text-sm text-gray-500">{t('notifications.email.description')}</p>
                <div className="mt-4 space-y-4">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input id="promotional" name="email.promotional" type="checkbox"
                             checked={notificationSettings.email.promotional} onChange={handleNotificationChange}
                             className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="promotional"
                             className="font-medium text-gray-700">{t('notifications.promotional.title')}</label>
                      <p className="text-gray-500">{t('notifications.promotional.description')}</p>
                    </div>
                  </div>
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input id="weekly_digest" name="email.weekly_digest" type="checkbox"
                             checked={notificationSettings.email.weekly_digest} onChange={handleNotificationChange}
                             className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="weekly_digest"
                             className="font-medium text-gray-700">{t('notifications.weekly.title')}</label>
                      <p className="text-gray-500">{t('notifications.weekly.description')}</p>
                    </div>
                  </div>
                   <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input id="monthly_report" name="email.monthly_report" type="checkbox"
                             checked={notificationSettings.email.monthly_report} onChange={handleNotificationChange}
                             className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="monthly_report"
                             className="font-medium text-gray-700">{t('notifications.monthly.title')}</label>
                      <p className="text-gray-500">{t('notifications.monthly.description')}</p>
                    </div>
                  </div>
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-base font-medium text-gray-900">{t('notifications.devices.title')}</legend>
                 <div className="mt-4 space-y-4">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input id="security_alerts" name="sms.security_alerts" type="checkbox"
                             checked={notificationSettings.sms.security_alerts} onChange={handleNotificationChange}
                             className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="security_alerts"
                             className="font-medium text-gray-700">{t('notifications.security.title')}</label>
                      <p className="text-gray-500">{t('notifications.security.description')}</p>
                    </div>
                  </div>
                 </div>
              </fieldset>
            </div>
             <div className="pt-5">
              <div className="flex justify-end">
                 <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                        type="button"
                        onClick={handleSubmit}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {t('settings.notifications.button.save')}
                      </button>
                    </div>
                  </div>
          </div>
        </Tab.Panel>

        {/* Company Section */}
        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">
                      {t('company.logo.title')}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label
                            htmlFor="companyLogo"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            {t('company.logo.title')}
                          </label>
                          <div className="flex items-center mt-1">
                            <div className="relative flex-shrink-0 h-16 w-16 overflow-hidden rounded border border-gray-200">
                              <img
                                className="h-full w-full object-contain"
                                src={profileData.companyLogo}
                                alt="Company logo"
                              />
                              {isUploadingCompanyLogo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                  <svg
                                    className="animate-spin h-8 w-8 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-5">
                              <div className="flex">
                                <label
                                  htmlFor="company-logo-upload"
                                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer"
                                >
                                  {t('settings.company.logo.change')}
                                </label>
                                <input
                                  id="company-logo-upload"
                                  name="company-logo-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleCompanyLogoUpload}
                                />
                                <button
                                  type="button"
                                  onClick={removeCompanyLogo}
                                  className="ml-2 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                >
                                  {t('settings.company.logo.remove')}
                                </button>
                              </div>
                              <p className="mt-2 text-xs text-gray-500">{t('settings.company.logo.help')}</p>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label
                            htmlFor="companyName"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t('settings.company.name.label')}
                          </label>
                          <input
                            type="text"
                            name="companyName"
                            id="companyName"
                            value={profileData.companyName}
                            onChange={handleProfileChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="vatNumber"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t('settings.company.vatNumber.label')}
                          </label>
                          <input
                            type="text"
                            name="vatNumber"
                            id="vatNumber"
                            value={profileData.vatNumber}
                            onChange={handleProfileChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md"
                            placeholder={t('settings.company.vatNumber.placeholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="taxCode"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t('settings.company.taxCode.label')}
                          </label>
                          <input
                            type="text"
                            name="taxCode"
                            id="taxCode"
                            value={profileData.taxCode}
                            onChange={handleProfileChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md"
                            placeholder={t('settings.company.taxCode.placeholder')}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label
                            htmlFor="legalAddress"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t('settings.company.legalAddress.label')}
                          </label>
                          <input
                            type="text"
                            name="legalAddress"
                            id="legalAddress"
                            value={profileData.legalAddress}
                            onChange={handleProfileChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md"
                            placeholder={t('settings.company.legalAddress.placeholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="businessPhone"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t('settings.company.businessPhone.label')}
                          </label>
                          <input
                            type="tel"
                            name="businessPhone"
                            id="businessPhone"
                            value={profileData.businessPhone}
                            onChange={handleProfileChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md"
                            placeholder={t('settings.company.businessPhone.placeholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="businessEmail"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t('settings.company.businessEmail.label')}
                          </label>
                          <input
                            type="email"
                            name="businessEmail"
                            id="businessEmail"
                            value={profileData.businessEmail}
                            onChange={handleProfileChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md"
                            placeholder={t('settings.company.businessEmail.placeholder')}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label
                            htmlFor="website"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t('settings.company.website.label')}
                          </label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                              https://
                            </span>
                            <input
                              type="text"
                              name="website"
                              id="website"
                              value={profileData.website}
                              onChange={handleProfileChange}
                              className="flex-1 min-w-0 block w-full px-3 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                              placeholder={t('settings.company.website.placeholder')}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                        <button
                          type="button"
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {t('settings.button.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {t('settings.button.save')}
                        </button>
                      </div>
                    </form>
                  </div>
        </Tab.Panel>

        {/* Billing Section */}
        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">
                      {t('billing.plan.title')}
                    </h2>

                    {/* Current plan */}
                    <div className="mb-8">
                      <h3 className="text-base font-medium text-gray-900 mb-3">{t('billing.plan.title')}</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                              {t('billing.plan.current')}
                            </span>
                            <p className="mt-1 text-sm text-gray-600">
                              {t('billing.plan.price')}
                            </p>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{t('billing.plan.nextRenewal')}</p>
                            <p className="text-gray-500">January 15, 2024</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            {t('billing.plan.change')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Payment methods */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-medium text-gray-900">{t('billing.payment.methods')}</h3>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          {t('billing.payment.add')}
                        </button>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-2 rounded-md">
                              <CreditCardIcon className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">Visa •••• 4242</p>
                              <p className="text-xs text-gray-500">{t('billing.payment.expiryShort')}12/2025</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-4 inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                                                            {t('billing.payment.defaultCard')}
                              </span>
                              <button
                                type="button"
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                {t('billing.payment.edit')}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-2 rounded-md">
                              <CreditCardIcon className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                Mastercard •••• 5678
                              </p>
                              <p className="text-xs text-gray-500">{t('billing.payment.expiryShort')}08/2024</p>
                            </div>
                          </div>
                                                      <div>
                              <button
                                type="button"
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                {t('billing.payment.edit')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Invoices */}
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-4">{t('billing.invoices.tableTitle')}</h3>
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {t('billing.invoices.number')}
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {t('billing.invoices.date')}
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {t('billing.invoices.amount')}
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {t('billing.invoices.status')}
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Download</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                F-2023-0015
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {t('billing.invoices.sampleDate1')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                €359,88
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {t('billing.invoices.statusPaid')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button type="button" className="text-blue-600 hover:text-blue-900">
                                  <ArrowUpTrayIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                F-2022-0014
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {t('billing.invoices.sampleDate2')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                €359,88
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {t('billing.invoices.statusPaid')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button type="button" className="text-blue-600 hover:text-blue-900">
                                  <ArrowUpTrayIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                F-2022-0013
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {t('billing.invoices.sampleDate3')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                €359,88
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {t('billing.invoices.statusPaid')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button type="button" className="text-blue-600 hover:text-blue-900">
                                  <ArrowUpTrayIcon className="h-5 w-5" />
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
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex">
                {renderTabs()}
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Notification Banner */}
      <Transition
        show={notification.show}
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div
          className={`fixed top-5 right-5 w-auto max-w-sm rounded-md shadow-lg p-4 z-50 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckCircleIcon className="h-6 w-6 text-white" />
              ) : (
                 <XCircleIcon className="h-6 w-6 text-white" />
               )}
             </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">{notification.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className="inline-flex text-white"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
}
