import React, { useState } from 'react';
import { 
  EnvelopeIcon, 
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function EmailSettingsFallback({ showNotification }) {
  console.log('🔧 EmailSettingsFallback: Component mounted - Demo Mode');

  const [emailSettings, setEmailSettings] = useState({
    provider: 'smtp',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: 'your-email@gmail.com',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: 'noreply@yourcompany.com',
    from_name: 'Your Company Name',
    notifications: {
      invoices: true,
      quotes: true,
      payments: true,
      reminders: true,
      system: false
    }
  });

  const [activeTab, setActiveTab] = useState('smtp');
  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const handleSaveSettings = () => {
    console.log('💾 EmailSettingsFallback: Saving settings (Demo Mode)', emailSettings);
    showNotification?.('Email settings saved successfully! (Demo Mode)', 'success');
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      showNotification?.('Please enter a test email address', 'error');
      return;
    }

    setIsTestingEmail(true);
    console.log('📧 EmailSettingsFallback: Testing email configuration (Demo Mode)', { testEmail, settings: emailSettings });
    
    // Simulate API call
    setTimeout(() => {
      setIsTestingEmail(false);
      showNotification?.(`Test email sent successfully to ${testEmail}! (Demo Mode)`, 'success');
    }, 2000);
  };

  const providers = [
    { key: 'smtp', name: 'SMTP Configuration', icon: Cog6ToothIcon },
    { key: 'notifications', name: 'Email Notifications', icon: EnvelopeIcon }
  ];

  const encryptionOptions = [
    { value: 'none', label: 'None' },
    { value: 'tls', label: 'TLS' },
    { value: 'ssl', label: 'SSL' }
  ];

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-blue-800 font-medium">Demo Mode</span>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          This is a simplified email settings interface. No actual email configuration will be saved.
        </p>
      </div>

      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Configure SMTP settings and email notification preferences
        </p>
      </div>

      {/* Provider Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {providers.map((provider) => (
            <button
              key={provider.key}
              onClick={() => setActiveTab(provider.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === provider.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <provider.icon className="h-4 w-4" />
              <span>{provider.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* SMTP Configuration Tab */}
      {activeTab === 'smtp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SMTP Host */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={emailSettings.smtp_host}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="smtp.gmail.com"
              />
            </div>

            {/* SMTP Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={emailSettings.smtp_port}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="587"
              />
            </div>

            {/* SMTP Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="email"
                value={emailSettings.smtp_username}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtp_username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your-email@gmail.com"
              />
            </div>

            {/* SMTP Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={emailSettings.smtp_password}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            {/* Encryption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption
              </label>
              <select
                value={emailSettings.smtp_encryption}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtp_encryption: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {encryptionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* From Settings */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">From Address Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  value={emailSettings.from_email}
                  onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="noreply@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  value={emailSettings.from_name}
                  onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your Company Name"
                />
              </div>
            </div>
          </div>

          {/* Test Email */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Test Email Configuration</h4>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="test@example.com"
                />
              </div>
              <button
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isTestingEmail ? 'Testing...' : 'Test Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Email Notification Preferences</h4>
            <div className="space-y-4">
              {Object.entries(emailSettings.notifications).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 capitalize">
                      {key} Notifications
                    </h5>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for {key.toLowerCase()} related activities
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailSettings({
                      ...emailSettings,
                      notifications: {
                        ...emailSettings.notifications,
                        [key]: !enabled
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
        >
          <CheckCircleIcon className="h-4 w-4" />
          <span>Save Email Settings</span>
        </button>
      </div>
    </div>
  );
} 