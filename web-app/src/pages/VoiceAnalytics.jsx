import React from 'react';
import { VoiceAnalyticsDashboard } from '@components/analytics/VoiceAnalyticsDashboard';

/**
 * Voice Analytics Page
 * 
 * Displays comprehensive analytics for voice command usage,
 * recognition failures, and session data.
 */
const VoiceAnalytics = () => {
  return (
    <div className="voice-analytics-page">
      <div className="page-header">
        <h1>Voice Analytics</h1>
        <p className="page-description">
          Monitor voice command usage, recognition performance, and user interaction patterns
        </p>
      </div>
      
      <VoiceAnalyticsDashboard />
    </div>
  );
};

export default VoiceAnalytics;