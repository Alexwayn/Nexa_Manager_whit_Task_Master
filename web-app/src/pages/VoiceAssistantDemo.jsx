import React, { useState } from 'react';
import { 
  VoiceActivationButton, 
  VoiceIndicator, 
  VoiceSettings, 
  VoiceOnboarding 
} from '@/components/voice';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';
import { 
  MicrophoneIcon, 
  Cog6ToothIcon, 
  AcademicCapIcon,
  InformationCircleIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

/**
 * VoiceAssistantDemo Component
 * A demo page to test and showcase voice assistant functionality
 */

export default function VoiceAssistantDemo() {
  const { 
    isEnabled, 
    isListening, 
    isProcessing, 
    lastCommand, 
    lastResponse, 
    error,
    microphonePermission,
    settings,
    // Wake word detection state
    wakeWordEnabled,
    wakeWordDetected,
    wakeWordConfidence,
    showWakeWordFeedback,
    // Timeout state
    timeoutActive,
    timeoutRemaining,
    showTimeoutCountdown,
    // Functions
    startWakeWordDetection,
    stopWakeWordDetection,
    cancelVoiceTimeout,
    activateVoiceFromWakeWord
  } = useVoiceAssistant();

  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Assistant Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test and configure the Nexa Manager voice assistant
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                isEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <h3 className="text-lg font-medium text-gray-900">Status</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {isEnabled ? 'Voice Assistant Enabled' : 'Voice Assistant Disabled'}
            </p>
            {isListening && (
              <p className="text-sm text-blue-600 font-medium">Listening...</p>
            )}
            {isProcessing && (
              <p className="text-sm text-yellow-600 font-medium">Processing...</p>
            )}
          </div>

          {/* Microphone Permission */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MicrophoneIcon className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Microphone</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Permission: <span className={`font-medium ${
                microphonePermission === 'granted' ? 'text-green-600' :
                microphonePermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {microphonePermission || 'Not requested'}
              </span>
            </p>
          </div>

          {/* Settings Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Cog6ToothIcon className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Wake Word: {settings.wakeWord}</p>
              <p>Speech Rate: {settings.speechRate}x</p>
              <p>Auto-listen: {settings.autoListen ? 'On' : 'Off'}</p>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Voice Controls</h2>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Voice Activation Buttons */}
            <VoiceActivationButton 
              size="lg" 
              variant="primary" 
              showLabel={true}
            />
            
            <VoiceActivationButton 
              size="md" 
              variant="secondary" 
              showLabel={false}
            />
            
            <VoiceActivationButton 
              size="sm" 
              variant="minimal" 
              showLabel={false}
            />

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              Settings
            </button>

            {/* Onboarding Button */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            >
              <AcademicCapIcon className="w-5 h-5" />
              Tutorial
            </button>
          </div>
        </div>

        {/* Wake Word & Timeout Testing */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wake Word & Timeout Testing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wake Word Detection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Wake Word Detection</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${
                    wakeWordEnabled ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {wakeWordEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                {wakeWordEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Detected:</span>
                      <span className={`text-sm font-medium ${
                        wakeWordDetected ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {wakeWordDetected ? 'Yes' : 'No'}
                      </span>
                    </div>
                    
                    {wakeWordDetected && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <span className="text-sm font-medium text-blue-600">
                          {Math.round(wakeWordConfidence * 100)}%
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Feedback Visible:</span>
                      <span className={`text-sm font-medium ${
                        showWakeWordFeedback ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {showWakeWordFeedback ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={startWakeWordDetection}
                    disabled={!wakeWordEnabled}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 disabled:text-gray-500 rounded-md transition-colors text-sm"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Start Detection
                  </button>
                  
                  <button
                    onClick={stopWakeWordDetection}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors text-sm"
                  >
                    <StopIcon className="w-4 h-4" />
                    Stop Detection
                  </button>
                </div>
              </div>
            </div>

            {/* Timeout Testing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Voice Activation Timeout</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active:</span>
                  <span className={`text-sm font-medium ${
                    timeoutActive ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {timeoutActive ? 'Yes' : 'No'}
                  </span>
                </div>
                
                {timeoutActive && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className="text-sm font-medium text-orange-600">
                        {Math.ceil(timeoutRemaining / 1000)}s
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${((settings.listeningTimeout * 1000 - timeoutRemaining) / (settings.listeningTimeout * 1000)) * 100}%` 
                        }}
                      />
                    </div>
                  </>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Countdown Visible:</span>
                  <span className={`text-sm font-medium ${
                    showTimeoutCountdown ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {showTimeoutCountdown ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={activateVoiceFromWakeWord}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors text-sm"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Simulate Wake Word
                  </button>
                  
                  <button
                    onClick={cancelVoiceTimeout}
                    disabled={!timeoutActive}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-700 disabled:text-gray-500 rounded-md transition-colors text-sm"
                  >
                    <StopIcon className="w-4 h-4" />
                    Cancel Timeout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Command History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Last Command */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Last Command</h3>
            {lastCommand ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 font-medium">"{lastCommand}"</p>
                <p className="text-blue-600 text-sm mt-1">
                  Received at {new Date().toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No commands yet</p>
            )}
          </div>

          {/* Last Response */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Last Response</h3>
            {lastResponse ? (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800">{lastResponse}</p>
                <p className="text-green-600 text-sm mt-1">
                  Responded at {new Date().toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No responses yet</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <InformationCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-red-800 font-medium">Error</h3>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Sample Commands */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Try These Commands</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Navigation</h4>
              <div className="space-y-1 text-sm">
                <div className="bg-gray-50 rounded px-3 py-2">"Go to dashboard"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Open clients"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Show invoices"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Navigate to reports"</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Actions</h4>
              <div className="space-y-1 text-sm">
                <div className="bg-gray-50 rounded px-3 py-2">"Create new invoice"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Add new client"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Search for John"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Export data"</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Help</h4>
              <div className="space-y-1 text-sm">
                <div className="bg-gray-50 rounded px-3 py-2">"What can you do?"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Help me with invoices"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"Voice commands"</div>
                <div className="bg-gray-50 rounded px-3 py-2">"How do I create a report?"</div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Indicator (floating) */}
        <VoiceIndicator 
          position="bottom-right" 
          showLabel={true}
          size="md"
        />

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <VoiceSettings 
              onClose={() => setShowSettings(false)}
              className="max-w-md w-full"
            />
          </div>
        )}

        {/* Onboarding Modal */}
        {showOnboarding && (
          <VoiceOnboarding
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
      </div>
    </div>
  );
}