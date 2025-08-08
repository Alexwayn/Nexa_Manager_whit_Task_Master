import React from 'react';
import { render, screen } from '@testing-library/react';

// Try to import the component directly
let VoiceFeedbackButton;
try {
  VoiceFeedbackButton = require('../../../components/voice/VoiceFeedbackButton').default;
  console.log('VoiceFeedbackButton imported successfully:', typeof VoiceFeedbackButton);
  console.log('VoiceFeedbackButton:', VoiceFeedbackButton);
} catch (error) {
  console.log('Error importing VoiceFeedbackButton:', error.message);
}

describe('Import Test', () => {
  test('can import VoiceFeedbackButton', () => {
    console.log('VoiceFeedbackButton type:', typeof VoiceFeedbackButton);
    expect(typeof VoiceFeedbackButton).toBe('function');
  });
});