// Mock for @testing-library/user-event
const { fireEvent } = require('./testing-library-react');

// Mock userEvent with setup() API for v14 compatibility
const userEvent = {
  setup: jest.fn(() => ({
    click: jest.fn(async (element) => {
      if (element && typeof element === 'object') {
        fireEvent.click(element);
      }
      return Promise.resolve();
    }),
    type: jest.fn(async (element, text, options = {}) => {
      if (element && typeof element === 'object' && typeof text === 'string') {
        // Simulate typing character by character if needed
        if (options.delay) {
          for (let i = 0; i < text.length; i++) {
            await new Promise(resolve => setTimeout(resolve, options.delay));
            fireEvent.input(element, { target: { value: element.value + text[i] } });
          }
        } else {
          fireEvent.change(element, { target: { value: text } });
          fireEvent.input(element, { target: { value: text } });
        }
      }
      return Promise.resolve();
    }),
    clear: jest.fn(async (element) => {
      if (element && typeof element === 'object') {
        fireEvent.change(element, { target: { value: '' } });
        fireEvent.input(element, { target: { value: '' } });
      }
      return Promise.resolve();
    }),
    selectOptions: jest.fn(async (element, values) => {
      if (element && typeof element === 'object') {
        const value = Array.isArray(values) ? values[0] : values;
        fireEvent.change(element, { target: { value } });
      }
      return Promise.resolve();
    }),
    keyboard: jest.fn(async (keys) => {
      // Mock keyboard events - could be enhanced based on needs
      return Promise.resolve();
    }),
    hover: jest.fn(async (element) => {
      if (element && typeof element === 'object') {
        fireEvent.mouseEnter(element);
      }
      return Promise.resolve();
    }),
    unhover: jest.fn(async (element) => {
      if (element && typeof element === 'object') {
        fireEvent.mouseLeave(element);
      }
      return Promise.resolve();
    }),
    tab: jest.fn(async (options = {}) => {
      // Mock tab navigation
      return Promise.resolve();
    }),
    upload: jest.fn(async (element, files) => {
      if (element && typeof element === 'object') {
        const fileList = Array.isArray(files) ? files : [files];
        fireEvent.change(element, { target: { files: fileList } });
      }
      return Promise.resolve();
    }),
    paste: jest.fn(async (element, text) => {
      if (element && typeof element === 'object' && typeof text === 'string') {
        fireEvent.paste(element, { clipboardData: { getData: () => text } });
      }
      return Promise.resolve();
    }),
    dblClick: jest.fn(async (element) => {
      if (element && typeof element === 'object') {
        fireEvent.doubleClick(element);
      }
      return Promise.resolve();
    }),
    tripleClick: jest.fn(async (element) => {
      if (element && typeof element === 'object') {
        fireEvent.click(element);
        fireEvent.click(element);
        fireEvent.click(element);
      }
      return Promise.resolve();
    }),
  })),
  
  // Legacy API methods for backward compatibility
  click: jest.fn(async (element) => {
    if (element && typeof element === 'object') {
      fireEvent.click(element);
    }
    return Promise.resolve();
  }),
  type: jest.fn(async (element, text) => {
    if (element && typeof element === 'object' && typeof text === 'string') {
      fireEvent.change(element, { target: { value: text } });
      fireEvent.input(element, { target: { value: text } });
    }
    return Promise.resolve();
  }),
  clear: jest.fn(async (element) => {
    if (element && typeof element === 'object') {
      fireEvent.change(element, { target: { value: '' } });
      fireEvent.input(element, { target: { value: '' } });
    }
    return Promise.resolve();
  }),
};

// Default export for ES6 imports
module.exports = userEvent;
module.exports.default = userEvent;
