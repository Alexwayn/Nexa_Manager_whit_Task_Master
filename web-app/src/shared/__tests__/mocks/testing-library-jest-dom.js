// Mock for @testing-library/jest-dom
// This provides mock implementations for custom Jest matchers

const customMatchers = {
  toBeInTheDocument(received) {
    // Accept any object that looks like a DOM element (has textContent or tagName)
    const pass = received && (received.textContent !== undefined || received.tagName !== undefined);
    
    if (pass) {
      return {
        message: () => `expected element not to be in the document`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be in the document`,
        pass: false,
      };
    }
  },

  toBeVisible(received) {
    const pass = received && received.style && received.style.display !== 'none';
    return {
      message: () => pass ? 
        `expected element not to be visible` : 
        `expected element to be visible`,
      pass,
    };
  },

  toHaveTextContent(received, expected) {
    const pass = received && received.textContent && received.textContent.includes(expected);
    return {
      message: () => pass ? 
        `expected element not to have text content "${expected}"` : 
        `expected element to have text content "${expected}"`,
      pass,
    };
  },

  toHaveAttribute(received, attribute, value) {
    const hasAttribute = received && received.getAttribute && received.getAttribute(attribute) !== null;
    const hasCorrectValue = value === undefined || (hasAttribute && received.getAttribute(attribute) === value);
    const pass = hasAttribute && hasCorrectValue;
    
    return {
      message: () => pass ? 
        `expected element not to have attribute "${attribute}"${value ? ` with value "${value}"` : ''}` : 
        `expected element to have attribute "${attribute}"${value ? ` with value "${value}"` : ''}`,
      pass,
    };
  },

  toHaveClass(received, ...classNames) {
    if (!received || !received.classList || !received.classList.contains) {
      return {
        message: () => `expected element to have class "${classNames.join(' ')}"`,
        pass: false,
      };
    }

    const pass = classNames.every(className => received.classList.contains(className));
    return {
      message: () => pass ? 
        `expected element not to have class "${classNames.join(' ')}"` : 
        `expected element to have class "${classNames.join(' ')}"`,
      pass,
    };
  },

  toHaveStyle(received, style) {
    const pass = received && received.style && Object.keys(style).every(key => received.style[key] === style[key]);
    return {
      message: () => pass ? 
        `expected element not to have style` : 
        `expected element to have style`,
      pass,
    };
  },

  toHaveValue(received, value) {
    const pass = received && received.value === value;
    return {
      message: () => pass ? 
        `expected element not to have value "${value}"` : 
        `expected element to have value "${value}"`,
      pass,
    };
  },

  toBeChecked(received) {
    const pass = received && received.checked === true;
    return {
      message: () => pass ? 
        `expected element not to be checked` : 
        `expected element to be checked`,
      pass,
    };
  },

  toBeDisabled(received) {
    const pass = received && received.disabled === true;
    return {
      message: () => pass ? 
        `expected element not to be disabled` : 
        `expected element to be disabled`,
      pass,
    };
  },

  toBeEnabled(received) {
    const pass = received && received.disabled !== true;
    return {
      message: () => pass ? 
        `expected element not to be enabled` : 
        `expected element to be enabled`,
      pass,
    };
  },

  toHaveFocus(received) {
    const pass = received && received === document.activeElement;
    return {
      message: () => pass ? 
        `expected element not to have focus` : 
        `expected element to have focus`,
      pass,
    };
  },
};

// Extend Jest's expect with custom matchers
if (typeof expect !== 'undefined' && expect.extend) {
  expect.extend(customMatchers);
}

module.exports = {};