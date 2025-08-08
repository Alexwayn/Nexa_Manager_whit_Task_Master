import React, { useState } from 'react';
import { 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import { cn } from '@/shared/utils/cn';

/**
 * VoiceSettings Component
 * Provides configuration options for the voice assistant
 */

export function VoiceSettings({ className = '', onClose }) {
  const { 
    settings, 
    updateSettings, 
    isEnabled,
    microphonePermission,
    requestMicrophonePermission,
    testSpeech
  } = useVoiceAssistant();

  const [localSettings, setLocalSettings] = useState({
    ...settings,
    wakeWordEnabled: settings.wakeWordEnabled || false,
    wakeWordSensitivity: settings.wakeWordSensitivity || 0.7,
    listeningTimeout: settings.listeningTimeout || 10000,
    showTimeoutCountdown: settings.showTimeoutCountdown || true
  });
  const [isTesting, setIsTesting] = useState(false);

  // Handle settings change
  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save settings
  const handleSave = () => {
    updateSettings(localSettings);
    if (onClose) onClose();
  };

  // Cancel changes
  const handleCancel = () => {
    setLocalSettings(settings);
    if (onClose) onClose();
  };

  // Test speech synthesis
  const handleTestSpeech = async () => {
    setIsTesting(true);
    try {
      await testSpeech("This is a test of the voice assistant speech synthesis.");
    } catch (error) {
      console.error('Speech test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  // Request microphone permission
  const handleRequestPermission = async () => {
    await requestMicrophonePermission();
  };

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md w-full',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Voice Assistant Settings
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Microphone Permission Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <div className="flex items-center gap-3 mb-2">
          <MicrophoneIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Microphone Access</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-sm',
            microphonePermission === 'granted' ? 'text-green-600' : 
            microphonePermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
          )}>
            {microphonePermission === 'granted' ? 'Granted' :
             microphonePermission === 'denied' ? 'Denied' : 'Not requested'}
          </span>
          {microphonePermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Request Access
            </button>
          )}
        </div>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Enable/Disable Voice Assistant */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-900">
              Enable Voice Assistant
            </label>
            <p className="text-sm text-gray-600">
              Turn voice commands on or off
            </p>
          </div>
          <button
            onClick={() => handleSettingChange('enabled', !localSettings.enabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              localSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                localSettings.enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Wake Word Detection */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-900">
              Wake Word Detection
            </label>
            <p className="text-sm text-gray-600">
              Automatically activate when wake word is detected
            </p>
          </div>
          <button
            onClick={() => handleSettingChange('wakeWordEnabled', !localSettings.wakeWordEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              localSettings.wakeWordEnabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
            disabled={!localSettings.enabled}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                localSettings.wakeWordEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Wake Word Sensitivity */}
        {localSettings.wakeWordEnabled && (
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              Wake Word Sensitivity: {Math.round(localSettings.wakeWordSensitivity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={localSettings.wakeWordSensitivity}
              onChange={(e) => handleSettingChange('wakeWordSensitivity', parseFloat(e.target.value))}
              className="w-full"
              disabled={!localSettings.enabled || !localSettings.wakeWordEnabled}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Less Sensitive</span>
              <span>More Sensitive</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Higher sensitivity may cause false activations
            </p>
          </div>
        )}

        {/* Wake Word */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Wake Word
          </label>
          <select
            value={localSettings.wakeWord}
            onChange={(e) => handleSettingChange('wakeWord', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!localSettings.enabled}
          >
            <option value="hey nexa">Hey Nexa</option>
            <option value="nexa">Nexa</option>
            <option value="assistant">Assistant</option>
            <option value="computer">Computer</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            The phrase to activate voice commands
          </p>
        </div>

        {/* Speech Rate */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Speech Rate: {localSettings.speechRate}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={localSettings.speechRate}
            onChange={(e) => handleSettingChange('speechRate', parseFloat(e.target.value))}
            className="w-full"
            disabled={!localSettings.enabled}
          />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Slow</span>
            <span>Normal</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Speech Volume */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Speech Volume: {Math.round(localSettings.speechVolume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={localSettings.speechVolume}
            onChange={(e) => handleSettingChange('speechVolume', parseFloat(e.target.value))}
            className="w-full"
            disabled={!localSettings.enabled}
          />
        </div>

        {/* Voice Activation Timeout */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Voice Activation Timeout: {localSettings.listeningTimeout / 1000}s
          </label>
          <input
            type="range"
            min="5000"
            max="30000"
            step="1000"
            value={localSettings.listeningTimeout}
            onChange={(e) => handleSettingChange('listeningTimeout', parseInt(e.target.value))}
            className="w-full"
            disabled={!localSettings.enabled}
          />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>5s</span>
            <span>15s</span>
            <span>30s</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            How long to wait for voice input before timing out
          </p>
        </div>

        {/* Show Timeout Countdown */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-900">
              Show Timeout Countdown
            </label>
            <p className="text-sm text-gray-600">
              Display visual countdown during voice activation
            </p>
          </div>
          <button
            onClick={() => handleSettingChange('showTimeoutCountdown', !localSettings.showTimeoutCountdown)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              localSettings.showTimeoutCountdown ? 'bg-blue-600' : 'bg-gray-200'
            )}
            disabled={!localSettings.enabled}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                localSettings.showTimeoutCountdown ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Voice
          </label>
          <select
            value={localSettings.voice}
            onChange={(e) => handleSettingChange('voice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!localSettings.enabled}
          >
            <option value="default">Default</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>

        {/* Auto-listen after response */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-900">
              Auto-listen after response
            </label>
            <p className="text-sm text-gray-600">
              Continue listening after each response
            </p>
          </div>
          <button
            onClick={() => handleSettingChange('autoListen', !localSettings.autoListen)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              localSettings.autoListen ? 'bg-blue-600' : 'bg-gray-200'
            )}
            disabled={!localSettings.enabled}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                localSettings.autoListen ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Confirmation for actions */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-900">
              Confirm destructive actions
            </label>
            <p className="text-sm text-gray-600">
              Ask for confirmation before deleting or modifying data
            </p>
          </div>
          <button
            onClick={() => handleSettingChange('confirmActions', !localSettings.confirmActions)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              localSettings.confirmActions ? 'bg-blue-600' : 'bg-gray-200'
            )}
            disabled={!localSettings.enabled}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                localSettings.confirmActions ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Test Speech */}
        <div>
          <button
            onClick={handleTestSpeech}
            disabled={!localSettings.enabled || isTesting}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors',
              'bg-gray-100 hover:bg-gray-200 text-gray-700',
              (!localSettings.enabled || isTesting) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <SpeakerWaveIcon className="w-5 h-5" />
            {isTesting ? 'Testing...' : 'Test Speech'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <CheckIcon className="w-4 h-4" />
          Save Settings
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

export default VoiceSettings;
