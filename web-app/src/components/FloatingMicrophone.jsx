import React from 'react';
import { VoiceActivationButton } from '@/components/voice';
import { VoiceFeedbackFloatingButton } from '@/components/voice/VoiceFeedbackButton';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';

/**
 * FloatingMicrophone Component
 * A floating microphone button that provides quick access to voice assistant functionality
 * This component replaces the old FloatingMicrophone with the new voice assistant system
 */

export default function FloatingMicrophone() {
  const { isEnabled, microphonePermission, lastCommand } = useVoiceAssistant();

  // Don't show if voice assistant is disabled or microphone permission is denied
  if (!isEnabled || microphonePermission === 'denied') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <VoiceActivationButton 
        size="lg"
        variant="primary"
        showLabel={false}
        className="shadow-lg hover:shadow-xl transition-shadow duration-300"
      />
      
      {/* Show feedback button if there was a recent command */}
      {lastCommand && (
        <VoiceFeedbackFloatingButton 
          className="shadow-lg hover:shadow-xl transition-shadow duration-300"
        />
      )}
    </div>
  );
}
