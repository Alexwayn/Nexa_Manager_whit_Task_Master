import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudIcon,
  ServerIcon,
  KeyIcon,
  GlobeAltIcon,
  ClockIcon,
  ChartBarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import emailService from '../services/emailService';
import { useTranslation } from 'react-i18next';

const EmailProviderSettings = () => {
  const { t } = useTranslation('email');
  const [providers, setProviders] = useState([]);
  const [activeProvider, setActiveProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResults, setTestResults] = useState({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Configuration forms for each provider
  const [configurations, setConfigurations] = useState({
    sendgrid: {
      apiKey: '',
      fromEmail: '',
      fromName: '',
    },
    ses: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      fromEmail: '',
      fromName: '',
    },
    mailgun: {
      apiKey: '',
      domain: '',
      fromEmail: '',
      fromName: '',
    },
    postmark: {
      serverToken: '',
      fromEmail: '',
      fromName: '',
    },
    smtp: {
      host: '',
      port: 587,
      secure: false,
      user: '',
      password: '',
      fromEmail: '',
      fromName: '',
    },
  });

  useEffect(() => {
    loadProviders();
    loadActiveProvider();
  }, []);

  const loadProviders = () => {
    const allProviders = emailService.getAllProviders();
    setProviders(allProviders);
  };

  const loadActiveProvider = () => {
    const current = emailService.getProviderInfo();
    setActiveProvider(current);
  };

  const handleTestProvider = async providerId => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    setLoading(true);
    setTestResults(prev => ({ ...prev, [providerId]: { testing: true } }));

    try {
      const result = await emailService.testEmailConfiguration(testEmail, providerId);

      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          testing: false,
          success: result.success,
          message: result.success ? 'Test email sent successfully!' : result.error,
          provider: result.provider,
          note: result.note,
        },
      }));

      if (result.success) {
        loadProviders();
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          testing: false,
          success: false,
          message: error.message,
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProvider = async providerId => {
    const success = emailService.setActiveProvider(providerId);
    if (success) {
      loadActiveProvider();
      loadProviders();
      alert(`Switched to ${providerId} successfully!`);
    } else {
      alert('Failed to switch provider');
    }
  };

  const handleConfigureProvider = providerId => {
    setSelectedProvider(providerId);
    setShowConfigModal(true);
  };

  const handleSaveConfiguration = () => {
    // In a real implementation, this would save to environment variables or a secure store
    alert('Configuration saved! Please restart the application for changes to take effect.');
    setShowConfigModal(false);
    setSelectedProvider(null);
    loadProviders();
  };

  const getProviderIcon = providerId => {
    const icons = {
      sendgrid: CloudIcon,
      ses: ServerIcon,
      mailgun: GlobeAltIcon,
      postmark: CloudIcon,
      smtp: ServerIcon,
      mock: InformationCircleIcon,
    };

    const IconComponent = icons[providerId] || CloudIcon;
    return <IconComponent className='h-6 w-6' />;
  };

  const getProviderColor = provider => {
    if (provider.active) return 'border-blue-500 bg-blue-50';
    if (provider.configured) return 'border-green-500 bg-green-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getStatusIcon = provider => {
    if (provider.active) {
      return <CheckCircleIcon className='h-5 w-5 text-blue-600' />;
    }
    if (provider.configured) {
      return <CheckCircleIcon className='h-5 w-5 text-green-600' />;
    }
    return <ExclamationTriangleIcon className='h-5 w-5 text-yellow-600' />;
  };

  const renderConfigurationForm = () => {
    if (!selectedProvider) return null;

    const config = configurations[selectedProvider];

    return (
      <div className='space-y-4'>
        {selectedProvider === 'sendgrid' && (
          <>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                SendGrid API Key
              </label>
              <input
                type='password'
                value={config.apiKey}
                onChange={e =>
                  setConfigurations(prev => ({
                    ...prev,
                    sendgrid: { ...prev.sendgrid, apiKey: e.target.value },
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='SG.xxxxxxxxxxxxxx'
              />
            </div>
          </>
        )}

        {selectedProvider === 'ses' && (
          <>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Access Key ID
                </label>
                <input
                  type='text'
                  value={config.accessKeyId}
                  onChange={e =>
                    setConfigurations(prev => ({
                      ...prev,
                      ses: { ...prev.ses, accessKeyId: e.target.value },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='AKIAIOSFODNN7EXAMPLE'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Secret Access Key
                </label>
                <input
                  type='password'
                  value={config.secretAccessKey}
                  onChange={e =>
                    setConfigurations(prev => ({
                      ...prev,
                      ses: { ...prev.ses, secretAccessKey: e.target.value },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>AWS Region</label>
              <select
                value={config.region}
                onChange={e =>
                  setConfigurations(prev => ({
                    ...prev,
                    ses: { ...prev.ses, region: e.target.value },
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='us-east-1'>US East (N. Virginia)</option>
                <option value='us-west-2'>US West (Oregon)</option>
                <option value='eu-west-1'>Europe (Ireland)</option>
                <option value='ap-southeast-1'>Asia Pacific (Singapore)</option>
              </select>
            </div>
          </>
        )}

        {selectedProvider === 'mailgun' && (
          <>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Mailgun API Key
              </label>
              <input
                type='password'
                value={config.apiKey}
                onChange={e =>
                  setConfigurations(prev => ({
                    ...prev,
                    mailgun: { ...prev.mailgun, apiKey: e.target.value },
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Domain</label>
              <input
                type='text'
                value={config.domain}
                onChange={e =>
                  setConfigurations(prev => ({
                    ...prev,
                    mailgun: { ...prev.mailgun, domain: e.target.value },
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='sandbox-xxx.mailgun.org'
              />
            </div>
          </>
        )}

        {selectedProvider === 'postmark' && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Server Token</label>
            <input
              type='password'
              value={config.serverToken}
              onChange={e =>
                setConfigurations(prev => ({
                  ...prev,
                  postmark: { ...prev.postmark, serverToken: e.target.value },
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            />
          </div>
        )}

        {selectedProvider === 'smtp' && (
          <>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>SMTP Host</label>
                <input
                  type='text'
                  value={config.host}
                  onChange={e =>
                    setConfigurations(prev => ({
                      ...prev,
                      smtp: { ...prev.smtp, host: e.target.value },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='smtp.gmail.com'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Port</label>
                <input
                  type='number'
                  value={config.port}
                  onChange={e =>
                    setConfigurations(prev => ({
                      ...prev,
                      smtp: { ...prev.smtp, port: parseInt(e.target.value) },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='587'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Username</label>
                <input
                  type='text'
                  value={config.user}
                  onChange={e =>
                    setConfigurations(prev => ({
                      ...prev,
                      smtp: { ...prev.smtp, user: e.target.value },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='your-email@gmail.com'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
                <input
                  type='password'
                  value={config.password}
                  onChange={e =>
                    setConfigurations(prev => ({
                      ...prev,
                      smtp: { ...prev.smtp, password: e.target.value },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='your-app-password'
                />
              </div>
            </div>
            <div>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={config.secure}
                  onChange={e =>
                    setConfigurations(prev => ({
                      ...prev,
                      smtp: { ...prev.smtp, secure: e.target.checked },
                    }))
                  }
                  className='mr-2'
                />
                Use SSL/TLS
              </label>
            </div>
          </>
        )}

        {/* Common fields for all providers */}
        <div className='border-t pt-4'>
          <h4 className='font-medium text-gray-900 mb-3'>Default Sender Information</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>From Email</label>
              <input
                type='email'
                value={config.fromEmail}
                onChange={e =>
                  setConfigurations(prev => ({
                    ...prev,
                    [selectedProvider]: { ...prev[selectedProvider], fromEmail: e.target.value },
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='noreply@yourcompany.com'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>From Name</label>
              <input
                type='text'
                value={config.fromName}
                onChange={e =>
                  setConfigurations(prev => ({
                    ...prev,
                    [selectedProvider]: { ...prev[selectedProvider], fromName: e.target.value },
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Your Company Name'
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold flex items-center'>
          <CogIcon className='h-6 w-6 mr-2' />
          Email Provider Settings
        </h1>
        <p className='text-gray-600'>Configure and manage email service providers</p>
      </div>

      {/* Test Email Section */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-medium mb-4'>Test Configuration</h3>
        <div className='flex space-x-3'>
          <input
            type='email'
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder='Enter test email address'
            className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <button
            onClick={() => handleTestProvider(activeProvider?.id)}
            disabled={loading || !testEmail || !activeProvider}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Testing...' : 'Test Active Provider'}
          </button>
        </div>
      </div>

      {/* Providers Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {providers.map(provider => (
          <div
            key={provider.id}
            className={`bg-white rounded-lg shadow border-2 ${getProviderColor(provider)} p-6`}
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center'>
                {getProviderIcon(provider.id)}
                <div className='ml-3'>
                  <h3 className='text-lg font-medium'>{provider.name}</h3>
                  <div className='flex items-center mt-1'>
                    {getStatusIcon(provider)}
                    <span className='ml-1 text-sm text-gray-600'>
                      {provider.active
                        ? 'Active'
                        : provider.configured
                          ? 'Configured'
                          : 'Not Configured'}
                    </span>
                  </div>
                </div>
              </div>
              <div className='flex space-x-2'>
                <button
                  onClick={() => handleConfigureProvider(provider.id)}
                  className='p-2 text-gray-400 hover:text-gray-600'
                  title='Configure'
                >
                  <KeyIcon className='h-4 w-4' />
                </button>
                {provider.configured && !provider.active && (
                  <button
                    onClick={() => handleSwitchProvider(provider.id)}
                    className='px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700'
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>

            {/* Provider Details */}
            <div className='space-y-2 text-sm text-gray-600'>
              <div className='flex justify-between'>
                <span>Auth Type:</span>
                <span className='font-medium'>{provider.authType}</span>
              </div>
              {provider.limits?.daily && (
                <div className='flex justify-between'>
                  <span>Daily Limit:</span>
                  <span className='font-medium'>{provider.limits.daily.toLocaleString()}</span>
                </div>
              )}
              {provider.limits?.monthly && (
                <div className='flex justify-between'>
                  <span>Monthly Limit:</span>
                  <span className='font-medium'>{provider.limits.monthly.toLocaleString()}</span>
                </div>
              )}
              <div className='flex justify-between'>
                <span>Delivery Time:</span>
                <span className='font-medium'>
                  {emailService.getEstimatedDeliveryTime(provider.id)}
                </span>
              </div>
            </div>

            {/* Test Results */}
            {testResults[provider.id] && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  testResults[provider.id].success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className='flex items-center'>
                  {testResults[provider.id].success ? (
                    <CheckCircleIcon className='h-4 w-4 text-green-600 mr-2' />
                  ) : (
                    <ExclamationTriangleIcon className='h-4 w-4 text-red-600 mr-2' />
                  )}
                  <span
                    className={`text-sm ${
                      testResults[provider.id].success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {testResults[provider.id].message}
                  </span>
                </div>
                {testResults[provider.id].note && (
                  <p className='text-xs text-gray-600 mt-1'>{testResults[provider.id].note}</p>
                )}
              </div>
            )}

            {/* Test Button */}
            <button
              onClick={() => handleTestProvider(provider.id)}
              disabled={loading || !testEmail}
              className='w-full mt-4 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
            >
              {testResults[provider.id]?.testing ? 'Testing...' : 'Test Provider'}
            </button>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto'>
            <div className='p-6 border-b'>
              <h2 className='text-xl font-bold'>
                Configure {providers.find(p => p.id === selectedProvider)?.name}
              </h2>
              <p className='text-gray-600 mt-1'>
                Set up your email provider credentials and settings
              </p>
            </div>

            <div className='p-6'>
              {renderConfigurationForm()}

              <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6'>
                <div className='flex'>
                  <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400 mr-2' />
                  <div className='text-sm text-yellow-800'>
                    <p className='font-medium'>Important Security Note</p>
                    <p className='mt-1'>
                      In production, these credentials should be stored as environment variables or
                      in a secure configuration management system. This interface is for
                      demonstration purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-6 border-t flex items-center justify-between'>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setSelectedProvider(null);
                }}
                className='px-4 py-2 text-gray-600 hover:text-gray-800'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfiguration}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Notice */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
        <div className='flex'>
          <InformationCircleIcon className='h-5 w-5 text-blue-400 mr-3 mt-0.5' />
          <div className='text-sm text-blue-800'>
            <p className='font-medium'>Email Provider Configuration</p>
            <p className='mt-1'>
              To configure email providers, set the appropriate environment variables in your .env
              file:
            </p>
            <ul className='mt-2 space-y-1 text-xs font-mono'>
              <li>• REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key</li>
              <li>• REACT_APP_AWS_ACCESS_KEY_ID=your_aws_access_key</li>
              <li>• REACT_APP_MAILGUN_API_KEY=your_mailgun_api_key</li>
              <li>• REACT_APP_POSTMARK_SERVER_TOKEN=your_postmark_token</li>
            </ul>
            <p className='mt-2'>
              Currently using mock provider for development. Configure a real provider for
              production use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailProviderSettings;
