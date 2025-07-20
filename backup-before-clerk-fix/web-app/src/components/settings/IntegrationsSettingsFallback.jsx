import React, { useState } from 'react';
import {
  LinkIcon,
  CloudIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function IntegrationsSettingsFallback({ showNotification }) {
  console.log('🔗 IntegrationsSettingsFallback: Component mounted - Demo Mode');

  const [integrations] = useState([
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Elaborazione pagamenti online',
      icon: CreditCardIcon,
      connected: true,
      status: 'active',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Archiviazione documenti cloud',
      icon: CloudIcon,
      connected: false,
      status: 'disconnected',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Backup e sincronizzazione file',
      icon: DocumentTextIcon,
      connected: true,
      status: 'active',
    },
  ]);

  const handleConnect = integrationId => {
    console.log(
      '🔗 IntegrationsSettingsFallback: Connecting integration (Demo Mode)',
      integrationId,
    );
    if (showNotification) {
      showNotification(`Connessione a ${integrationId} avviata (Demo Mode)`, 'success');
    }
  };

  const handleDisconnect = integrationId => {
    console.log(
      '🔗 IntegrationsSettingsFallback: Disconnecting integration (Demo Mode)',
      integrationId,
    );
    if (showNotification) {
      showNotification(`Disconnessione da ${integrationId} completata (Demo Mode)`, 'success');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Demo Mode Banner */}
      <div className='bg-blue-50 border-l-4 border-blue-400 p-4'>
        <div className='flex'>
          <LinkIcon className='h-5 w-5 text-blue-400' />
          <div className='ml-3'>
            <p className='text-sm text-blue-700'>
              <strong>Modalità Demo:</strong> Integrazioni simulate per testing locale.
            </p>
          </div>
        </div>
      </div>

      {/* Available Integrations */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900'>Integrazioni Disponibili</h3>
          <p className='text-sm text-gray-500'>
            Connetti servizi esterni per migliorare il tuo workflow
          </p>
        </div>

        <div className='divide-y divide-gray-200'>
          {integrations.map(integration => (
            <div key={integration.id} className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <integration.icon className='h-10 w-10 text-gray-400' />
                  <div className='ml-4'>
                    <h4 className='text-lg font-medium text-gray-900'>{integration.name}</h4>
                    <p className='text-sm text-gray-500'>{integration.description}</p>
                  </div>
                </div>

                <div className='flex items-center space-x-3'>
                  {integration.connected ? (
                    <>
                      <div className='flex items-center'>
                        <CheckCircleIcon className='h-5 w-5 text-green-500 mr-2' />
                        <span className='text-sm text-green-600'>Connesso</span>
                      </div>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className='bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700'
                      >
                        Disconnetti
                      </button>
                    </>
                  ) : (
                    <>
                      <div className='flex items-center'>
                        <XCircleIcon className='h-5 w-5 text-gray-400 mr-2' />
                        <span className='text-sm text-gray-500'>Non connesso</span>
                      </div>
                      <button
                        onClick={() => handleConnect(integration.id)}
                        className='bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700'
                      >
                        Connetti
                      </button>
                    </>
                  )}
                </div>
              </div>

              {integration.connected && (
                <div className='mt-4 p-3 bg-green-50 rounded-md'>
                  <p className='text-sm text-green-700'>✅ Integrazione attiva e funzionante</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Integration Settings */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Impostazioni Globali</h3>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-900'>Sincronizzazione Automatica</h4>
              <p className='text-sm text-gray-500'>
                Sincronizza automaticamente i dati con i servizi connessi
              </p>
            </div>
            <button className='relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
              <span className='pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5' />
            </button>
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-900'>Notifiche Integrazione</h4>
              <p className='text-sm text-gray-500'>Ricevi notifiche per errori di connessione</p>
            </div>
            <button className='relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
              <span className='pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
