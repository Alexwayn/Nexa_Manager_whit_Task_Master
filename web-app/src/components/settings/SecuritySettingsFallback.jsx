import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

export default function SecuritySettingsFallback({ showNotification }) {
  console.log('🔐 SecuritySettingsFallback: Component mounted - Demo Mode');

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
    sessionTimeout: 30,
    loginNotifications: true,
  });

  const [activeDevices] = useState([
    { id: 1, name: 'Chrome - Windows', lastActive: '2 minuti fa', current: true },
    { id: 2, name: 'Safari - iPhone', lastActive: '1 ora fa', current: false },
    { id: 3, name: 'Firefox - Linux', lastActive: '3 giorni fa', current: false },
  ]);

  const handleToggle = setting => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));

    if (showNotification) {
      showNotification(`Impostazione di sicurezza aggiornata (Demo Mode)`, 'success');
    }
  };

  const handlePasswordChange = () => {
    console.log('🔐 SecuritySettingsFallback: Password change requested (Demo Mode)');
    if (showNotification) {
      showNotification('Richiesta cambio password inviata (Demo Mode)', 'success');
    }
  };

  const handleEnable2FA = () => {
    console.log('🔐 SecuritySettingsFallback: 2FA setup requested (Demo Mode)');
    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
    if (showNotification) {
      showNotification('Autenticazione a due fattori abilitata (Demo Mode)', 'success');
    }
  };

  const handleRevokeSession = deviceId => {
    console.log('🔐 SecuritySettingsFallback: Session revoked (Demo Mode)', deviceId);
    if (showNotification) {
      showNotification('Sessione revocata (Demo Mode)', 'success');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Demo Mode Banner */}
      <div className='bg-blue-50 border-l-4 border-blue-400 p-4'>
        <div className='flex'>
          <ShieldCheckIcon className='h-5 w-5 text-blue-400' />
          <div className='ml-3'>
            <p className='text-sm text-blue-700'>
              <strong>Modalità Demo:</strong> Impostazioni di sicurezza semplificate per testing.
            </p>
          </div>
        </div>
      </div>

      {/* Password Settings */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex items-center mb-4'>
          <KeyIcon className='h-6 w-6 text-gray-400 mr-3' />
          <h3 className='text-lg font-medium text-gray-900'>Password e Accesso</h3>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-900'>Cambia Password</h4>
              <p className='text-sm text-gray-500'>Ultima modifica: 30 giorni fa</p>
            </div>
            <button
              onClick={handlePasswordChange}
              className='bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700'
            >
              Cambia Password
            </button>
          </div>

          <div className='border-t pt-4'>
            <h4 className='text-sm font-medium text-gray-900 mb-3'>Requisiti Password</h4>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex items-center'>
                <CheckCircleIcon className='h-4 w-4 text-green-500 mr-2' />
                <span className='text-sm text-gray-600'>Minimo 8 caratteri</span>
              </div>
              <div className='flex items-center'>
                <CheckCircleIcon className='h-4 w-4 text-green-500 mr-2' />
                <span className='text-sm text-gray-600'>Lettere maiuscole</span>
              </div>
              <div className='flex items-center'>
                <CheckCircleIcon className='h-4 w-4 text-green-500 mr-2' />
                <span className='text-sm text-gray-600'>Numeri</span>
              </div>
              <div className='flex items-center'>
                <CheckCircleIcon className='h-4 w-4 text-green-500 mr-2' />
                <span className='text-sm text-gray-600'>Simboli speciali</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex items-center mb-4'>
          <DevicePhoneMobileIcon className='h-6 w-6 text-gray-400 mr-3' />
          <h3 className='text-lg font-medium text-gray-900'>Autenticazione a Due Fattori</h3>
        </div>

        <div className='flex items-center justify-between'>
          <div>
            <h4 className='text-sm font-medium text-gray-900'>
              {securitySettings.twoFactorEnabled ? 'Abilitata' : 'Disabilitata'}
            </h4>
            <p className='text-sm text-gray-500'>
              {securitySettings.twoFactorEnabled
                ? 'Il tuo account è protetto con 2FA'
                : 'Aggiungi un livello extra di sicurezza'}
            </p>
          </div>
          <button
            onClick={handleEnable2FA}
            disabled={securitySettings.twoFactorEnabled}
            className={`px-4 py-2 rounded-md text-sm ${
              securitySettings.twoFactorEnabled
                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {securitySettings.twoFactorEnabled ? 'Abilitata' : 'Abilita 2FA'}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex items-center mb-4'>
          <ComputerDesktopIcon className='h-6 w-6 text-gray-400 mr-3' />
          <h3 className='text-lg font-medium text-gray-900'>Sessioni Attive</h3>
        </div>

        <div className='space-y-3'>
          {activeDevices.map(device => (
            <div
              key={device.id}
              className='flex items-center justify-between p-3 border rounded-lg'
            >
              <div className='flex items-center'>
                <ComputerDesktopIcon className='h-5 w-5 text-gray-400 mr-3' />
                <div>
                  <h4 className='text-sm font-medium text-gray-900'>
                    {device.name}
                    {device.current && (
                      <span className='ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                        Corrente
                      </span>
                    )}
                  </h4>
                  <p className='text-xs text-gray-500'>Ultimo accesso: {device.lastActive}</p>
                </div>
              </div>
              {!device.current && (
                <button
                  onClick={() => handleRevokeSession(device.id)}
                  className='text-red-600 text-sm hover:text-red-800'
                >
                  Revoca
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Notifications */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex items-center mb-4'>
          <LockClosedIcon className='h-6 w-6 text-gray-400 mr-3' />
          <h3 className='text-lg font-medium text-gray-900'>Notifiche di Sicurezza</h3>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-900'>Notifiche di Login</h4>
              <p className='text-sm text-gray-500'>Ricevi email per nuovi accessi</p>
            </div>
            <button
              onClick={() => handleToggle('loginNotifications')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                securitySettings.loginNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  securitySettings.loginNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
