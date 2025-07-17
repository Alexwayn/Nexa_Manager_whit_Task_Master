import { useState, useEffect } from 'react';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  LinkIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import Logger from '../../utils/Logger';
import integrationsService from '../../lib/integrationsService';

export default function IntegrationsSettings({ showNotification }) {
  const { t } = useTranslation('settings');
  const { user } = useUser();
  const { isAuthenticated } = useClerkAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('apiKeys');

  // State management
  const [apiKeys, setApiKeys] = useState([]);
  const [integrations, setIntegrations] = useState({});
  const [activityHistory, setActivityHistory] = useState([]);
  const [showApiKey, setShowApiKey] = useState({});
  const [newApiKeyModal, setNewApiKeyModal] = useState(false);
  const [newApiKeyData, setNewApiKeyData] = useState({
    name: '',
    permissions: ['read'],
    scopes: ['invoices', 'clients'],
    rateLimitRequests: 1000,
    expiresAt: null,
    ipWhitelist: [],
  });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [configModal, setConfigModal] = useState({ open: false, service: null, data: {} });

  // integrationsService is now imported as a singleton instance

  useEffect(() => {
    // Load integrations data when component mounts
    if (isAuthenticated && user) {
      loadIntegrationsData();
    }
  }, [isAuthenticated, user]);

  const loadIntegrationsData = async () => {
    try {
      setIsLoading(true);

      // Load API keys and integrations in parallel
      const [apiKeysData, integrationsData, activityData] = await Promise.all([
        integrationsService.getApiKeys(),
        integrationsService.getIntegrations(),
        integrationsService.getActivityHistory({ limit: 50 }),
      ]);

      setApiKeys(apiKeysData);
      setIntegrations(integrationsData);
      setActivityHistory(activityData);

      Logger.info('Integrations data loaded successfully');
    } catch (error) {
      Logger.error('Error loading integrations data:', error);
      showNotification?.('Error loading integrations data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      setIsSaving(true);

      const newKey = await integrationsService.generateApiKey(newApiKeyData);

      setApiKeys(prev => [newKey, ...prev]);
      setGeneratedKey(newKey); // Show the generated key modal
      setNewApiKeyModal(false);
      setNewApiKeyData({
        name: '',
        permissions: ['read'],
        scopes: ['invoices', 'clients'],
        rateLimitRequests: 1000,
        expiresAt: null,
        ipWhitelist: [],
      });

      Logger.info('New API key generated successfully');
      showNotification?.('API key generated successfully', 'success');
    } catch (error) {
      Logger.error('Error generating API key:', error);
      showNotification?.('Error generating API key', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const revokeApiKey = async keyId => {
    try {
      setIsSaving(true);

      await integrationsService.revokeApiKey(keyId, 'Revoked by user');
      setApiKeys(prev => prev.filter(key => key.id !== keyId));

      Logger.info(`API key ${keyId} revoked successfully`);
      showNotification?.('API key revoked successfully', 'success');
    } catch (error) {
      Logger.error('Error revoking API key:', error);
      showNotification?.('Error revoking API key', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleApiKeyVisibility = keyId => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification?.('Copied to clipboard', 'success');
    } catch (error) {
      Logger.error('Error copying to clipboard:', error);
      showNotification?.('Error copying to clipboard', 'error');
    }
  };

  const connectIntegration = async (category, service) => {
    try {
      setIsSaving(true);

      const result = await integrationsService.connectIntegration(service, {
        category,
        enableSync: true,
        syncFrequency: 'daily',
      });

      // Handle OAuth redirect if needed
      if (result.requiresOAuth && result.oauthUrl) {
        window.location.href = result.oauthUrl;
        return;
      }

      // Update local state
      setIntegrations(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [service]: {
            connected: true,
            status: 'active',
            lastSync: new Date().toISOString(),
            configuration: result.configuration || {},
          },
        },
      }));

      Logger.info(`Connected to ${service} successfully`);
      showNotification?.(`Successfully connected to ${service}`, 'success');
    } catch (error) {
      Logger.error(`Error connecting to ${service}:`, error);
      showNotification?.(`Error connecting to ${service}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const disconnectIntegration = async (category, service) => {
    try {
      setIsSaving(true);

      await integrationsService.disconnectIntegration(service);

      setIntegrations(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [service]: {
            connected: false,
            status: 'inactive',
            lastSync: null,
            configuration: {},
          },
        },
      }));

      Logger.info(`Disconnected from ${service} successfully`);
      showNotification?.(`Successfully disconnected from ${service}`, 'success');
    } catch (error) {
      Logger.error(`Error disconnecting from ${service}:`, error);
      showNotification?.(`Error disconnecting from ${service}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const syncIntegration = async (category, service) => {
    try {
      setIsSaving(true);

      const result = await integrationsService.syncIntegration(service);

      // Update integration with new sync time
      setIntegrations(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [service]: {
            ...prev[category][service],
            lastSync: new Date().toISOString(),
            syncStatus: result.status,
          },
        },
      }));

      Logger.info(`Synced ${service} successfully`);
      showNotification?.(`Successfully synced ${service}`, 'success');
    } catch (error) {
      Logger.error(`Error syncing ${service}:`, error);
      showNotification?.(`Error syncing ${service}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openConfigModal = (category, service) => {
    const serviceConfig = integrations[category]?.[service] || {};
    setConfigModal({
      open: true,
      service,
      category,
      data: serviceConfig.configuration || {},
    });
  };

  const saveIntegrationConfig = async () => {
    try {
      setIsSaving(true);

      await integrationsService.updateIntegrationConfig(configModal.service, configModal.data);

      // Update local state
      setIntegrations(prev => ({
        ...prev,
        [configModal.category]: {
          ...prev[configModal.category],
          [configModal.service]: {
            ...prev[configModal.category][configModal.service],
            configuration: configModal.data,
          },
        },
      }));

      setConfigModal({ open: false, service: null, data: {} });
      showNotification?.('Configuration saved successfully', 'success');
    } catch (error) {
      Logger.error('Error saving configuration:', error);
      showNotification?.('Error saving configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Never';

    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Enhanced permission options
  const permissionOptions = [
    { value: 'read', label: 'Read', description: 'View data only' },
    { value: 'write', label: 'Write', description: 'Create and update data' },
    { value: 'delete', label: 'Delete', description: 'Delete data' },
    { value: 'admin', label: 'Admin', description: 'Full administrative access' },
  ];

  // Enhanced scope options
  const scopeOptions = [
    { value: 'invoices', label: 'Invoices', description: 'Access invoice data' },
    { value: 'clients', label: 'Clients', description: 'Access client information' },
    { value: 'payments', label: 'Payments', description: 'Access payment data' },
    { value: 'projects', label: 'Projects', description: 'Access project data' },
    { value: 'reports', label: 'Reports', description: 'Access reporting data' },
    { value: 'settings', label: 'Settings', description: 'Access configuration' },
  ];

  const renderApiKeys = () => (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h4 className='text-lg font-medium text-gray-900 mb-2'>
            {t('integrations.apiKeys.title', 'API Keys')}
          </h4>
          <p className='text-sm text-gray-600'>
            {t(
              'integrations.apiKeys.description',
              'Generate and manage API keys for accessing your data programmatically.',
            )}
          </p>
        </div>
        <button
          onClick={() => setNewApiKeyModal(true)}
          className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <PlusIcon className='h-4 w-4' />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* API Keys List */}
      <div className='bg-white border border-gray-200 rounded-lg'>
        {apiKeys.length === 0 ? (
          <div className='p-8 text-center'>
            <KeyIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h5 className='text-lg font-medium text-gray-900 mb-2'>No API Keys</h5>
            <p className='text-gray-600 mb-4'>
              Generate your first API key to start integrating with external applications.
            </p>
            <button
              onClick={() => setNewApiKeyModal(true)}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Generate API Key
            </button>
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {apiKeys.map(apiKey => (
              <li key={apiKey.id} className='p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <h5 className='text-sm font-medium text-gray-900'>{apiKey.name}</h5>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          apiKey.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : apiKey.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {apiKey.status}
                      </span>
                    </div>

                    <div className='flex items-center space-x-2 mb-2'>
                      <span className='text-sm text-gray-600 font-mono'>
                        {showApiKey[apiKey.id]
                          ? apiKey.key || apiKey.key_prefix
                          : apiKey.key_prefix}
                      </span>
                      <button
                        onClick={() => toggleApiKeyVisibility(apiKey.id)}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        {showApiKey[apiKey.id] ? (
                          <EyeSlashIcon className='h-4 w-4' />
                        ) : (
                          <EyeIcon className='h-4 w-4' />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key || apiKey.key_prefix)}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        <ClipboardDocumentIcon className='h-4 w-4' />
                      </button>
                    </div>

                    <div className='flex flex-wrap gap-4 text-xs text-gray-500'>
                      <span>Permissions: {apiKey.permissions?.join(', ')}</span>
                      <span>Scopes: {apiKey.scopes?.join(', ')}</span>
                      <span>Usage: {apiKey.usage_count || 0} requests</span>
                      <span>Last used: {formatDate(apiKey.last_used_at)}</span>
                      <span>Created: {formatDate(apiKey.created_at)}</span>
                      {apiKey.expires_at && (
                        <span className='text-amber-600'>
                          Expires: {formatDate(apiKey.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => revokeApiKey(apiKey.id)}
                    className='ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors'
                    title='Revoke API Key'
                  >
                    <TrashIcon className='h-5 w-5' />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* API Key Generation Modal */}
      {newApiKeyModal && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Generate New API Key</h3>

            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Key Name *</label>
                <input
                  type='text'
                  value={newApiKeyData.name}
                  onChange={e => setNewApiKeyData(prev => ({ ...prev, name: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g. Production API, Mobile App'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Permissions</label>
                <div className='space-y-2'>
                  {permissionOptions.map(permission => (
                    <label key={permission.value} className='flex items-start space-x-3'>
                      <input
                        type='checkbox'
                        checked={newApiKeyData.permissions.includes(permission.value)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewApiKeyData(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission.value],
                            }));
                          } else {
                            setNewApiKeyData(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission.value),
                            }));
                          }
                        }}
                        className='mt-1'
                      />
                      <div>
                        <span className='text-sm text-gray-700 font-medium'>
                          {permission.label}
                        </span>
                        <p className='text-xs text-gray-500'>{permission.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Access Scopes
                </label>
                <div className='space-y-2'>
                  {scopeOptions.map(scope => (
                    <label key={scope.value} className='flex items-start space-x-3'>
                      <input
                        type='checkbox'
                        checked={newApiKeyData.scopes.includes(scope.value)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewApiKeyData(prev => ({
                              ...prev,
                              scopes: [...prev.scopes, scope.value],
                            }));
                          } else {
                            setNewApiKeyData(prev => ({
                              ...prev,
                              scopes: prev.scopes.filter(s => s !== scope.value),
                            }));
                          }
                        }}
                        className='mt-1'
                      />
                      <div>
                        <span className='text-sm text-gray-700 font-medium'>{scope.label}</span>
                        <p className='text-xs text-gray-500'>{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Rate Limit (requests/hour)
                  </label>
                  <input
                    type='number'
                    value={newApiKeyData.rateLimitRequests}
                    onChange={e =>
                      setNewApiKeyData(prev => ({
                        ...prev,
                        rateLimitRequests: parseInt(e.target.value),
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    min='1'
                    max='10000'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Expires At (Optional)
                  </label>
                  <input
                    type='datetime-local'
                    value={newApiKeyData.expiresAt || ''}
                    onChange={e =>
                      setNewApiKeyData(prev => ({ ...prev, expiresAt: e.target.value || null }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>

            <div className='mt-6 flex justify-end space-x-3'>
              <button
                onClick={() => setNewApiKeyModal(false)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={generateApiKey}
                disabled={!newApiKeyData.name || newApiKeyData.permissions.length === 0 || isSaving}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
              >
                {isSaving ? 'Generating...' : 'Generate Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Key Display Modal */}
      {generatedKey && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center space-x-3 mb-4'>
              <CheckCircleIcon className='h-8 w-8 text-green-500' />
              <h3 className='text-lg font-medium text-gray-900'>API Key Generated!</h3>
            </div>

            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Your API Key (Copy this now - it won't be shown again)
              </label>
              <div className='flex items-center space-x-2'>
                <code className='flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-2 font-mono'>
                  {generatedKey.key}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedKey.key)}
                  className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded'
                >
                  <ClipboardDocumentIcon className='h-5 w-5' />
                </button>
              </div>
            </div>

            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4'>
              <div className='flex items-start space-x-2'>
                <ExclamationTriangleIcon className='h-5 w-5 text-amber-600 mt-0.5' />
                <div>
                  <p className='text-sm text-amber-800 font-medium'>Important Security Notice</p>
                  <p className='text-sm text-amber-700 mt-1'>
                    Store this API key securely. It won't be displayed again and provides access to
                    your account data.
                  </p>
                </div>
              </div>
            </div>

            <div className='flex justify-end'>
              <button
                onClick={() => setGeneratedKey(null)}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
              >
                I've Saved It Securely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderIntegrations = () => (
    <div className='space-y-6'>
      <div>
        <h4 className='text-lg font-medium text-gray-900 mb-2'>
          {t('integrations.thirdParty.title', 'Third-Party Integrations')}
        </h4>
        <p className='text-sm text-gray-600'>
          {t(
            'integrations.thirdParty.description',
            'Connect with external services to enhance your workflow.',
          )}
        </p>
      </div>

      {Object.entries(integrations).map(([category, services]) => (
        <div key={category} className='bg-white border border-gray-200 rounded-lg p-6'>
          <h5 className='text-md font-medium text-gray-900 mb-4 capitalize'>
            {category.replace(/([A-Z])/g, ' €1').trim()}
          </h5>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Object.entries(services).map(([service, config]) => (
              <div
                key={service}
                className='border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors'
              >
                <div className='flex items-center justify-between mb-3'>
                  <h6 className='text-sm font-medium text-gray-900 capitalize'>
                    {service.replace(/([A-Z])/g, ' €1').trim()}
                  </h6>
                  {config.connected ? (
                    <CheckCircleIcon className='h-5 w-5 text-green-500' />
                  ) : (
                    <XCircleIcon className='h-5 w-5 text-gray-400' />
                  )}
                </div>

                <div className='space-y-2 mb-4'>
                  <p className='text-xs text-gray-500'>
                    Status:{' '}
                    <span
                      className={config.connected ? 'text-green-600 font-medium' : 'text-gray-500'}
                    >
                      {config.status}
                    </span>
                  </p>

                  {config.connected && config.lastSync && (
                    <p className='text-xs text-gray-500'>
                      Last sync: {formatDate(config.lastSync)}
                    </p>
                  )}

                  {config.syncStatus === 'error' && (
                    <p className='text-xs text-red-600'>Sync error detected</p>
                  )}
                </div>

                <div className='flex flex-col space-y-2'>
                  {config.connected ? (
                    <>
                      <div className='flex space-x-2'>
                        <button
                          onClick={() => syncIntegration(category, service)}
                          className='flex-1 flex items-center justify-center space-x-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors'
                          disabled={isSaving}
                        >
                          <ArrowPathIcon className='h-3 w-3' />
                          <span>Sync</span>
                        </button>
                        <button
                          onClick={() => openConfigModal(category, service)}
                          className='flex-1 flex items-center justify-center space-x-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors'
                        >
                          <Cog6ToothIcon className='h-3 w-3' />
                          <span>Config</span>
                        </button>
                      </div>
                      <button
                        onClick={() => disconnectIntegration(category, service)}
                        className='w-full px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors'
                        disabled={isSaving}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => connectIntegration(category, service)}
                      className='w-full flex items-center justify-center space-x-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors'
                      disabled={isSaving}
                    >
                      <LinkIcon className='h-3 w-3' />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Integration Configuration Modal */}
      {configModal.open && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Configure {configModal.service}
            </h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Sync Frequency
                </label>
                <select
                  value={configModal.data.syncFrequency || 'daily'}
                  onChange={e =>
                    setConfigModal(prev => ({
                      ...prev,
                      data: { ...prev.data, syncFrequency: e.target.value },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='hourly'>Every Hour</option>
                  <option value='daily'>Daily</option>
                  <option value='weekly'>Weekly</option>
                  <option value='manual'>Manual Only</option>
                </select>
              </div>

              <div>
                <label className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={configModal.data.enableWebhooks || false}
                    onChange={e =>
                      setConfigModal(prev => ({
                        ...prev,
                        data: { ...prev.data, enableWebhooks: e.target.checked },
                      }))
                    }
                  />
                  <span className='text-sm text-gray-700'>Enable Webhooks</span>
                </label>
              </div>

              <div>
                <label className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={configModal.data.bidirectionalSync || false}
                    onChange={e =>
                      setConfigModal(prev => ({
                        ...prev,
                        data: { ...prev.data, bidirectionalSync: e.target.checked },
                      }))
                    }
                  />
                  <span className='text-sm text-gray-700'>Bidirectional Sync</span>
                </label>
              </div>
            </div>

            <div className='mt-6 flex justify-end space-x-3'>
              <button
                onClick={() => setConfigModal({ open: false, service: null, data: {} })}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={saveIntegrationConfig}
                disabled={isSaving}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div className='space-y-6'>
      <div>
        <h4 className='text-lg font-medium text-gray-900 mb-2'>Integration Activity</h4>
        <p className='text-sm text-gray-600'>Monitor API usage and integration sync history.</p>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h5 className='text-md font-medium text-gray-900'>Recent Activity</h5>
        </div>

        {activityHistory.length === 0 ? (
          <div className='p-8 text-center'>
            <ChartBarIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-600'>No activity recorded yet</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                    Activity
                  </th>
                  <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                    Service
                  </th>
                  <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {activityHistory.map(activity => (
                  <tr key={activity.id}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {activity.activity_type}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                      {activity.service_name || 'API Key'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.activity_status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : activity.activity_status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {activity.activity_status}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                      {formatDate(activity.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-gray-500'>Please sign in to access integrations settings.</p>
        </div>
      </div>
    );
  }

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
        <h3 className='text-lg leading-6 font-medium text-gray-900'>
          {t('integrations.title', 'Integrations')}
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          {t(
            'integrations.description',
            'Manage API access and connect with third-party services.',
          )}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {[
            { key: 'apiKeys', label: 'API Keys', icon: KeyIcon },
            { key: 'integrations', label: 'Connected Services', icon: LinkIcon },
            { key: 'activity', label: 'Activity', icon: ChartBarIcon },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className='h-4 w-4' />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'apiKeys' && renderApiKeys()}
      {activeTab === 'integrations' && renderIntegrations()}
      {activeTab === 'activity' && renderActivityTab()}
    </div>
  );
}
