import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellIcon,
  UserIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useEmailContext } from '@context/EmailContext';

export default function EmailSettings({ isOpen, onClose }) {
  const { addNotification } = useEmailContext();
  
  const [emailSettings, setEmailSettings] = useState({
    provider: 'smtp',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: 'your-email@gmail.com',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: 'noreply@yourcompany.com',
    from_name: 'Your Company Name',
    signature: '',
    autoReply: false,
    autoReplyMessage: '',
    notifications: {
      newEmails: true,
      replies: true,
      mentions: true,
      newsletters: false,
      promotions: false,
    },
    display: {
      emailsPerPage: 25,
      showPreview: true,
      markAsReadOnSelect: true,
      showImages: false,
      compactView: false,
    },
  });

  const [activeTab, setActiveTab] = useState('account');
  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      // In a real app, this would load from the email service
      console.log('Loading email settings...');
      // For now, we'll use the default settings
    } catch (error) {
      console.error('Error loading email settings:', error);
      addNotification?.('Failed to load email settings', 'error');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to the email service
      console.log('Saving email settings:', emailSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addNotification?.('Email settings saved successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error saving email settings:', error);
      addNotification?.('Failed to save email settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      addNotification?.('Please enter a test email address', 'error');
      return;
    }

    setIsTestingEmail(true);
    try {
      // In a real app, this would test the email configuration
      console.log('Testing email configuration:', { testEmail, settings: emailSettings });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification?.(`Test email sent successfully to ${testEmail}!`, 'success');
    } catch (error) {
      console.error('Error testing email:', error);
      addNotification?.('Failed to send test email', 'error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const tabs = [
    { key: 'account', name: 'Account', icon: UserIcon },
    { key: 'smtp', name: 'SMTP', icon: Cog6ToothIcon },
    { key: 'notifications', name: 'Notifications', icon: BellIcon },
    { key: 'display', name: 'Display', icon: EnvelopeIcon },
  ];

  const encryptionOptions = [
    { value: 'none', label: 'None' },
    { value: 'tls', label: 'TLS' },
    { value: 'ssl', label: 'SSL' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure your email account, notifications, and display preferences
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                    <input
                      type="text"
                      value={emailSettings.from_name}
                      onChange={e => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                    <input
                      type="email"
                      value={emailSettings.from_email}
                      onChange={e => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="noreply@yourcompany.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Signature</label>
                  <textarea
                    value={emailSettings.signature}
                    onChange={e => setEmailSettings({ ...emailSettings, signature: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Best regards,&#10;Your Name&#10;Your Company"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoReply"
                    checked={emailSettings.autoReply}
                    onChange={e => setEmailSettings({ ...emailSettings, autoReply: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoReply" className="ml-2 block text-sm text-gray-900">
                    Enable auto-reply
                  </label>
                </div>

                {emailSettings.autoReply && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auto-reply Message</label>
                    <textarea
                      value={emailSettings.autoReplyMessage}
                      onChange={e => setEmailSettings({ ...emailSettings, autoReplyMessage: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Thank you for your email. I will get back to you soon."
                    />
                  </div>
                )}
              </div>
            )}

            {/* SMTP Tab */}
            {activeTab === 'smtp' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-800 font-medium">Advanced Settings</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    These settings are for advanced users. Incorrect configuration may prevent email delivery.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={emailSettings.smtp_host}
                      onChange={e => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={emailSettings.smtp_port}
                      onChange={e => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="email"
                      value={emailSettings.smtp_username}
                      onChange={e => setEmailSettings({ ...emailSettings, smtp_username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={emailSettings.smtp_password}
                      onChange={e => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Encryption</label>
                    <select
                      value={emailSettings.smtp_encryption}
                      onChange={e => setEmailSettings({ ...emailSettings, smtp_encryption: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {encryptionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Test Email */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Test Configuration</h4>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="test@example.com"
                      />
                    </div>
                    <button
                      onClick={handleTestEmail}
                      disabled={isTestingEmail || !testEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTestingEmail ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Email Notifications</h4>
                  <div className="space-y-4">
                    {Object.entries(emailSettings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-sm text-gray-500">
                            {key === 'newEmails' && 'Get notified when you receive new emails'}
                            {key === 'replies' && 'Get notified when someone replies to your emails'}
                            {key === 'mentions' && 'Get notified when you are mentioned in emails'}
                            {key === 'newsletters' && 'Receive newsletter and update notifications'}
                            {key === 'promotions' && 'Receive promotional and marketing emails'}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={e => setEmailSettings({
                            ...emailSettings,
                            notifications: {
                              ...emailSettings.notifications,
                              [key]: e.target.checked
                            }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Display Preferences</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emails per page</label>
                      <select
                        value={emailSettings.display.emailsPerPage}
                        onChange={e => setEmailSettings({
                          ...emailSettings,
                          display: {
                            ...emailSettings.display,
                            emailsPerPage: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {Object.entries(emailSettings.display).filter(([key]) => key !== 'emailsPerPage').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-sm text-gray-500">
                            {key === 'showPreview' && 'Show email preview in the list'}
                            {key === 'markAsReadOnSelect' && 'Automatically mark emails as read when selected'}
                            {key === 'showImages' && 'Automatically load images in emails'}
                            {key === 'compactView' && 'Use compact view for email list'}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={e => setEmailSettings({
                            ...emailSettings,
                            display: {
                              ...emailSettings.display,
                              [key]: e.target.checked
                            }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}