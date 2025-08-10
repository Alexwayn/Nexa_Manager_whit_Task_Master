import React from 'react';

// Centralized Heroicons Solid mock for all voice tests
const createMockIcon = (iconName, emoji = null) => {
  const MockIcon = React.forwardRef((props, ref) => {
    if (emoji) {
      return React.createElement('div', {
        ref,
        'data-testid': `${iconName.toLowerCase()}-icon`,
        'aria-hidden': 'true',
        ...props
      }, emoji);
    }

    return React.createElement('svg', {
      ref,
      'data-testid': `${iconName.toLowerCase()}-icon`,
      'aria-hidden': 'true',
      role: 'img',
      ...props
    });
  });

  MockIcon.displayName = `Mock${iconName}`;
  return MockIcon;
};

// Commonly used solid icons
export const StarIcon = createMockIcon('Star');
export const MicrophoneIcon = createMockIcon('Microphone');
export const StopIcon = createMockIcon('Stop');
export const CheckIcon = createMockIcon('Check');
export const HeartIcon = createMockIcon('Heart');

// Default export for any other icon not explicitly defined
const defaultMockIcon = createMockIcon('Default');
export default defaultMockIcon;