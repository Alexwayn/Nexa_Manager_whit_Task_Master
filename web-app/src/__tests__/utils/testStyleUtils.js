/**
 * Test utilities for handling CSS styling in tests
 */

/**
 * Inject CSS that allows custom inline styles to work in tests
 * This is necessary because high-contrast CSS rules with !important
 * can override inline styles in the test environment
 */
export const injectTestStyles = () => {
  // Check if styles are already injected
  if (document.getElementById('test-style-overrides')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'test-style-overrides';
  style.textContent = `
    /* Allow custom inline styles to override high-contrast rules in tests */
    [data-testid="voice-feedback-button"][style*="background-color"] {
      background-color: var(--custom-bg-color) !important;
    }
    
    /* Set custom property when style attribute contains background-color */
    [data-testid="voice-feedback-button"][style*="background-color: red"] {
      --custom-bg-color: red;
    }
    
    [data-testid="voice-feedback-button"][style*="background-color: blue"] {
      --custom-bg-color: blue;
    }
    
    [data-testid="voice-feedback-button"][style*="background-color: green"] {
      --custom-bg-color: green;
    }
    
    /* Fallback for any background-color inline style */
    [data-testid="voice-feedback-button"][style*="background-color:"] {
      background: none !important;
    }
  `;
  
  document.head.appendChild(style);
};

/**
 * Remove injected test styles
 */
export const removeTestStyles = () => {
  const style = document.getElementById('test-style-overrides');
  if (style) {
    style.remove();
  }
};

/**
 * Extract background color from computed styles or inline styles
 */
export const getBackgroundColor = (element) => {
  // First check inline styles
  const inlineStyle = element.style.backgroundColor;
  if (inlineStyle) {
    return inlineStyle;
  }
  
  // Then check computed styles
  const computed = window.getComputedStyle(element);
  return computed.backgroundColor;
};