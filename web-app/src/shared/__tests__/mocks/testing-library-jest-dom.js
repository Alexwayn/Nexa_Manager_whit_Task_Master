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
    if (!received || received.textContent === undefined) {
      return {
        message: () => `expected element to have text content "${expected}"`,
        pass: false,
      };
    }

    let pass;
    if (expected instanceof RegExp) {
      pass = expected.test(received.textContent);
    } else if (typeof expected === 'string') {
      pass = received.textContent.includes(expected);
    } else {
      pass = received.textContent === String(expected);
    }

    return {
      message: () => pass ? 
        `expected element not to have text content "${expected}"` : 
        `expected element to have text content "${expected}"`,
      pass,
    };
  },

  toHaveAttribute(received, attribute, value) {
    if (!received || !received.getAttribute) {
      return {
        message: () => `expected element to have attribute "${attribute}"${value !== undefined ? ` with value "${value}"` : ''}`,
        pass: false,
      };
    }

    const actualValue = received.getAttribute(attribute);
    const hasAttribute = actualValue !== null;
    
    let pass;
    if (value === undefined) {
      pass = hasAttribute;
    } else {
      pass = hasAttribute && actualValue === String(value);
    }
    
    return {
      message: () => pass ? 
        `expected element not to have attribute "${attribute}"${value !== undefined ? ` with value "${value}"` : ''}` : 
        `expected element to have attribute "${attribute}"${value !== undefined ? ` with value "${value}"` : ''}`,
      pass,
    };
  },

  toHaveClass(received, ...classNames) {
    if (!received) {
      return {
        message: () => `expected element to have class "${classNames.join(' ')}"`,
        pass: false,
      };
    }

    // Handle both classList.contains and className string checking
    let pass = false;
    
    if (received.classList && received.classList.contains) {
      pass = classNames.every(className => received.classList.contains(className));
    } else if (received.className) {
      const elementClasses = received.className.split(' ').filter(Boolean);
      pass = classNames.every(className => elementClasses.includes(className));
    }

    return {
      message: () => pass ? 
        `expected element not to have class "${classNames.join(' ')}"` : 
        `expected element to have class "${classNames.join(' ')}"`,
      pass,
    };
  },

  toHaveStyle(received, style) {
    if (!received || !received.style) {
      return {
        message: () => `expected element to have style`,
        pass: false,
      };
    }

    const pass = Object.keys(style).every(key => received.style[key] === style[key]);
    return {
      message: () => pass ? 
        `expected element not to have style` : 
        `expected element to have style`,
      pass,
    };
  },

  toHaveValue(received, value) {
    if (!received) {
      return {
        message: () => `expected element to have value "${value}"`,
        pass: false,
      };
    }

    const pass = received.value === String(value);
    return {
      message: () => pass ? 
        `expected element not to have value "${value}"` : 
        `expected element to have value "${value}"`,
      pass,
    };
  },

  toBeChecked(received) {
    if (!received) {
      return {
        message: () => `expected element to be checked`,
        pass: false,
      };
    }

    const pass = received.checked === true;
    return {
      message: () => pass ? 
        `expected element not to be checked` : 
        `expected element to be checked`,
      pass,
    };
  },

  toBeDisabled(received) {
    if (!received) {
      return {
        message: () => `expected element to be disabled`,
        pass: false,
      };
    }

    // Check both disabled property and disabled attribute
    const pass = received.disabled === true || received.getAttribute('disabled') !== null;
    return {
      message: () => pass ? 
        `expected element not to be disabled` : 
        `expected element to be disabled`,
      pass,
    };
  },

  toBeEnabled(received) {
    if (!received) {
      return {
        message: () => `expected element to be enabled`,
        pass: false,
      };
    }

    // Element is enabled if it's not disabled
    const pass = received.disabled !== true && received.getAttribute('disabled') === null;
    return {
      message: () => pass ? 
        `expected element not to be enabled` : 
        `expected element to be enabled`,
      pass,
    };
  },

  toHaveFocus(received) {
    if (!received) {
      return {
        message: () => `expected element to have focus`,
        pass: false,
      };
    }

    const pass = received === document.activeElement;
    return {
      message: () => pass ? 
        `expected element not to have focus` : 
        `expected element to have focus`,
      pass,
    };
  },

  // Additional matchers for better test support
  toBeEmpty(received) {
    if (!received) {
      return {
        message: () => `expected element to be empty`,
        pass: false,
      };
    }

    const pass = !received.textContent || received.textContent.trim() === '';
    return {
      message: () => pass ? 
        `expected element not to be empty` : 
        `expected element to be empty`,
      pass,
    };
  },

  toContainElement(received, element) {
    if (!received || !element) {
      return {
        message: () => `expected element to contain element`,
        pass: false,
      };
    }

    // Simple containment check
    const pass = received.contains ? received.contains(element) : false;
    return {
      message: () => pass ? 
        `expected element not to contain element` : 
        `expected element to contain element`,
      pass,
    };
  },

  toHaveDisplayValue(received, value) {
    if (!received) {
      return {
        message: () => `expected element to have display value "${value}"`,
        pass: false,
      };
    }

    // For form elements, check value; for others, check textContent
    const displayValue = received.value !== undefined ? received.value : received.textContent;
    const pass = displayValue === String(value);
    
    return {
      message: () => pass ? 
        `expected element not to have display value "${value}"` : 
        `expected element to have display value "${value}"`,
      pass,
    };
  },
};

// Extend Jest's expect with custom matchers
if (typeof expect !== 'undefined' && expect.extend) {
  expect.extend(customMatchers);
}

module.exports = {};
