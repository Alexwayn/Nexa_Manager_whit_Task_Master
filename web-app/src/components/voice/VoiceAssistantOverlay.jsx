import React from 'react';
import { useVoiceAssistant } from '../../providers/VoiceAssistantProvider';
import VoiceActivationCountdown from './VoiceActivationCountdown';
import WakeWordFeedback from './WakeWordFeedback';

/**
 * VoiceAssistantOverlay Component
 * Renders all voice assistant visual feedback components
 */
const VoiceAssistantOverlay = () => {
  const {
    // Wake word feedback state
    showWakeWordFeedback,
    wakeWordDetected,
    wakeWordConfidence,
    isListening,
    wakeWordFeedbackPosition,
    
    // Timeout countdown state
    showTimeoutCountdown,
    timeoutActive,
    timeoutRemaining,
    timeoutPercentage,
    timeoutCountdownPosition,
    
    // Actions
    cancelVoiceTimeout
  } = useVoiceAssistant();

  return (
    <>
      {/* Wake Word Detection Feedback */}
      {showWakeWordFeedback && (wakeWordDetected || isListening) && (
        <WakeWordFeedback
          isVisible={true}
          confidence={wakeWordConfidence}
          isListening={isListening}
          position={wakeWordFeedbackPosition}
          size="medium"
          autoHide={true}
          autoHideDelay={3000}
        />
      )}

      {/* Voice Activation Timeout Countdown */}
      {showTimeoutCountdown && timeoutActive && (
        <VoiceActivationCountdown
          isVisible={true}
          totalTime={10000} // This should come from settings
          remainingTime={timeoutRemaining}
          percentage={timeoutPercentage}
          position={timeoutCountdownPosition}
          size="medium"
          showCancelButton={true}
          onCancel={() => cancelVoiceTimeout('manual')}
        />
      )}
    </>
  );
};

export default VoiceAssistantOverlay;