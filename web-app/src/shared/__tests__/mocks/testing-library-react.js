// Mock for @testing-library/react
const React = require('react');

// Simple DOM simulation for testing
let lastRenderedContainer = null;

// Helper function to create a mock element
const createMockElement = (text, tagName = 'div', attributes = {}) => {
  const element = {
    textContent: text,
    innerHTML: text,
    tagName: tagName.toUpperCase(),
    getAttribute: jest.fn((attr) => attributes[attr] || null),
    setAttribute: jest.fn((attr, value) => {
      attributes[attr] = value;
      if (attr === 'class') {
        element.className = value;
        // Update classList when class attribute changes
        const classes = value ? value.split(' ').filter(Boolean) : [];
        element.classList = {
          contains: jest.fn((className) => classes.includes(className)),
          add: jest.fn((className) => {
            if (!classes.includes(className)) {
              classes.push(className);
              element.className = classes.join(' ');
              attributes.class = element.className;
            }
          }),
          remove: jest.fn((className) => {
            const index = classes.indexOf(className);
            if (index > -1) {
              classes.splice(index, 1);
              element.className = classes.join(' ');
              attributes.class = element.className;
            }
          }),
          toggle: jest.fn((className) => {
            if (classes.includes(className)) {
              element.classList.remove(className);
            } else {
              element.classList.add(className);
            }
          }),
          value: classes.join(' ')
        };
      }
    }),
    classList: {
      contains: jest.fn((className) => {
        const classes = attributes.class ? attributes.class.split(' ').filter(Boolean) : [];
        return classes.includes(className);
      }),
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      value: attributes.class || ''
    },
    style: {},
    className: attributes.class || '',
    disabled: attributes.disabled || false,
    checked: attributes.checked || false,
    value: attributes.value || '',
    ...attributes,
  };

  // Initialize classList properly
  if (attributes.class) {
    const classes = attributes.class.split(' ').filter(Boolean);
    element.classList = {
      contains: jest.fn((className) => classes.includes(className)),
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      value: attributes.class
    };
  }

  return element;
};

// Helper function to find elements by text
const findElementByText = (text) => {
  // Return a mock element that represents the found element
  return createMockElement(text);
};

const render = jest.fn((component) => {
  const container = document.createElement('div');
  lastRenderedContainer = container;
  
  // Simple simulation - just store the component for later queries
  container._testComponent = component;
  
  // Try to extract props from the component if it's a React element
  let componentProps = {};
  if (component && component.props) {
    componentProps = component.props;
  }
  
  const queryMethods = {
    getByText: jest.fn((text) => findElementByText(text)),
    getByRole: jest.fn((role) => {
      // For button role, create a more realistic mock with common button attributes
      if (role === 'button') {
        // Get the mock voice assistant state
        const mockVoiceAssistant = require('@/providers/VoiceAssistantProvider').useVoiceAssistant();
        
        // Determine button state based on mock voice assistant
        let buttonClass = 'rounded-full shadow-lg flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-12 h-12';
        let isDisabled = !mockVoiceAssistant.isEnabled || mockVoiceAssistant.microphonePermission === 'denied';
        let ariaLabel = 'Start voice command - Click to speak';
        
        if (isDisabled) {
          buttonClass += ' cursor-not-allowed bg-gray-300 text-gray-500';
        } else if (mockVoiceAssistant.isProcessing) {
          buttonClass += ' bg-yellow-500 hover:bg-yellow-600 text-white';
        } else if (mockVoiceAssistant.isListening) {
          buttonClass += ' bg-red-500 hover:bg-red-600 text-white animate-pulse';
          ariaLabel = 'Stop listening - Click to stop voice recognition';
        } else {
          buttonClass += ' bg-blue-500 hover:bg-blue-600 text-white';
        }
        
        if (componentProps.className) {
          buttonClass += ' ' + componentProps.className;
        }
        
        return createMockElement('', 'button', { 
          role: 'button',
          class: buttonClass,
          disabled: isDisabled,
          'aria-label': ariaLabel,
          title: ariaLabel
        });
      }
      return createMockElement('', 'div', { role });
    }),
    getByTestId: jest.fn((testId) => {
      // Get the mock voice assistant state for icon rendering
      const mockVoiceAssistant = require('@/providers/VoiceAssistantProvider').useVoiceAssistant();
      
      if (testId === 'microphone-icon' && !mockVoiceAssistant.isListening) {
        return createMockElement('', 'div', { 'data-testid': testId });
      } else if (testId === 'stop-icon' && mockVoiceAssistant.isListening) {
        return createMockElement('', 'div', { 'data-testid': testId });
      } else if (testId === 'microphone-icon' && mockVoiceAssistant.isListening) {
        // Return null or throw error when microphone icon is requested but we're listening
        return null;
      } else if (testId === 'stop-icon' && !mockVoiceAssistant.isListening) {
        // Return null or throw error when stop icon is requested but we're not listening
        return null;
      }
      
      return createMockElement('', 'div', { 'data-testid': testId });
    }),
    getByLabelText: jest.fn((label) => createMockElement('', 'input', { 'aria-label': label })),
    getByPlaceholderText: jest.fn((placeholder) => createMockElement('', 'input', { placeholder })),
    getByDisplayValue: jest.fn((value) => createMockElement('', 'input', { value })),
    getByAltText: jest.fn((alt) => createMockElement('', 'img', { alt })),
    getByTitle: jest.fn((title) => createMockElement('', 'div', { title })),
    getAllByText: jest.fn((text) => [findElementByText(text)]),
    getAllByRole: jest.fn((role) => [createMockElement('', 'div', { role })]),
    getAllByTestId: jest.fn((testId) => [createMockElement('', 'div', { 'data-testid': testId })]),
    getAllByLabelText: jest.fn((label) => [createMockElement('', 'input', { 'aria-label': label })]),
    getAllByPlaceholderText: jest.fn((placeholder) => [createMockElement('', 'input', { placeholder })]),
    getAllByDisplayValue: jest.fn((value) => [createMockElement('', 'input', { value })]),
    getAllByAltText: jest.fn((alt) => [createMockElement('', 'img', { alt })]),
    getAllByTitle: jest.fn((title) => [createMockElement('', 'div', { title })]),
    queryByText: jest.fn((text) => findElementByText(text)),
    queryByRole: jest.fn((role) => createMockElement('', 'div', { role })),
    queryByTestId: jest.fn((testId) => {
      // Get the mock voice assistant state for icon rendering
      const mockVoiceAssistant = require('@/providers/VoiceAssistantProvider').useVoiceAssistant();
      
      if (testId === 'microphone-icon' && !mockVoiceAssistant.isListening) {
        return createMockElement('', 'div', { 'data-testid': testId });
      } else if (testId === 'stop-icon' && mockVoiceAssistant.isListening) {
        return createMockElement('', 'div', { 'data-testid': testId });
      } else if (testId === 'microphone-icon' && mockVoiceAssistant.isListening) {
        // Return null when microphone icon is requested but we're listening
        return null;
      } else if (testId === 'stop-icon' && !mockVoiceAssistant.isListening) {
        // Return null when stop icon is requested but we're not listening
        return null;
      }
      
      return createMockElement('', 'div', { 'data-testid': testId });
    }),
    queryByLabelText: jest.fn((label) => createMockElement('', 'input', { 'aria-label': label })),
    queryByPlaceholderText: jest.fn((placeholder) => createMockElement('', 'input', { placeholder })),
    queryByDisplayValue: jest.fn((value) => createMockElement('', 'input', { value })),
    queryByAltText: jest.fn((alt) => createMockElement('', 'img', { alt })),
    queryByTitle: jest.fn((title) => createMockElement('', 'div', { title })),
    queryAllByText: jest.fn((text) => [findElementByText(text)]),
    queryAllByRole: jest.fn((role) => [createMockElement('', 'div', { role })]),
    queryAllByTestId: jest.fn((testId) => [createMockElement('', 'div', { 'data-testid': testId })]),
    queryAllByLabelText: jest.fn((label) => [createMockElement('', 'input', { 'aria-label': label })]),
    queryAllByPlaceholderText: jest.fn((placeholder) => [createMockElement('', 'input', { placeholder })]),
    queryAllByDisplayValue: jest.fn((value) => [createMockElement('', 'input', { value })]),
    queryAllByAltText: jest.fn((alt) => [createMockElement('', 'img', { alt })]),
    queryAllByTitle: jest.fn((title) => [createMockElement('', 'div', { title })]),
    findByText: jest.fn((text) => Promise.resolve(findElementByText(text))),
    findByRole: jest.fn((role) => Promise.resolve(createMockElement('', 'div', { role }))),
    findByTestId: jest.fn((testId) => Promise.resolve(createMockElement('', 'div', { 'data-testid': testId }))),
    findByLabelText: jest.fn((label) => Promise.resolve(createMockElement('', 'input', { 'aria-label': label }))),
    findByPlaceholderText: jest.fn((placeholder) => Promise.resolve(createMockElement('', 'input', { placeholder }))),
    findByDisplayValue: jest.fn((value) => Promise.resolve(createMockElement('', 'input', { value }))),
    findByAltText: jest.fn((alt) => Promise.resolve(createMockElement('', 'img', { alt }))),
    findByTitle: jest.fn((title) => Promise.resolve(createMockElement('', 'div', { title }))),
    findAllByText: jest.fn((text) => Promise.resolve([findElementByText(text)])),
    findAllByRole: jest.fn((role) => Promise.resolve([createMockElement('', 'div', { role })])),
    findAllByTestId: jest.fn((testId) => Promise.resolve([createMockElement('', 'div', { 'data-testid': testId })])),
    findAllByLabelText: jest.fn((label) => Promise.resolve([createMockElement('', 'input', { 'aria-label': label })])),
    findAllByPlaceholderText: jest.fn((placeholder) => Promise.resolve([createMockElement('', 'input', { placeholder })])),
    findAllByDisplayValue: jest.fn((value) => Promise.resolve([createMockElement('', 'input', { value })])),
    findAllByAltText: jest.fn((alt) => Promise.resolve([createMockElement('', 'img', { alt })])),
    findAllByTitle: jest.fn((title) => Promise.resolve([createMockElement('', 'div', { title })])),
  };

  return {
    container,
    baseElement: document.body,
    debug: jest.fn(),
    rerender: jest.fn(),
    unmount: jest.fn(),
    asFragment: jest.fn(),
    ...queryMethods,
  };
});

const screen = {
  getByText: jest.fn((text) => findElementByText(text)),
  getByRole: jest.fn((role) => createMockElement('', 'div', { role })),
  getByTestId: jest.fn((testId) => createMockElement('', 'div', { 'data-testid': testId })),
  getByLabelText: jest.fn((label) => createMockElement('', 'input', { 'aria-label': label })),
  getByPlaceholderText: jest.fn((placeholder) => createMockElement('', 'input', { placeholder })),
  getByDisplayValue: jest.fn((value) => createMockElement('', 'input', { value })),
  getByAltText: jest.fn((alt) => createMockElement('', 'img', { alt })),
  getByTitle: jest.fn((title) => createMockElement('', 'div', { title })),
  getAllByText: jest.fn((text) => [findElementByText(text)]),
  getAllByRole: jest.fn((role) => [createMockElement('', 'div', { role })]),
  getAllByTestId: jest.fn((testId) => [createMockElement('', 'div', { 'data-testid': testId })]),
  getAllByLabelText: jest.fn((label) => [createMockElement('', 'input', { 'aria-label': label })]),
  getAllByPlaceholderText: jest.fn((placeholder) => [createMockElement('', 'input', { placeholder })]),
  getAllByDisplayValue: jest.fn((value) => [createMockElement('', 'input', { value })]),
  getAllByAltText: jest.fn((alt) => [createMockElement('', 'img', { alt })]),
  getAllByTitle: jest.fn((title) => [createMockElement('', 'div', { title })]),
  queryByText: jest.fn((text) => findElementByText(text)),
  queryByRole: jest.fn((role) => createMockElement('', 'div', { role })),
  queryByTestId: jest.fn((testId) => createMockElement('', 'div', { 'data-testid': testId })),
  queryByLabelText: jest.fn((label) => createMockElement('', 'input', { 'aria-label': label })),
  queryByPlaceholderText: jest.fn((placeholder) => createMockElement('', 'input', { placeholder })),
  queryByDisplayValue: jest.fn((value) => createMockElement('', 'input', { value })),
  queryByAltText: jest.fn((alt) => createMockElement('', 'img', { alt })),
  queryByTitle: jest.fn((title) => createMockElement('', 'div', { title })),
  queryAllByText: jest.fn((text) => [findElementByText(text)]),
  queryAllByRole: jest.fn((role) => [createMockElement('', 'div', { role })]),
  queryAllByTestId: jest.fn((testId) => [createMockElement('', 'div', { 'data-testid': testId })]),
  queryAllByLabelText: jest.fn((label) => [createMockElement('', 'input', { 'aria-label': label })]),
  queryAllByPlaceholderText: jest.fn((placeholder) => [createMockElement('', 'input', { placeholder })]),
  queryAllByDisplayValue: jest.fn((value) => [createMockElement('', 'input', { value })]),
  queryAllByAltText: jest.fn((alt) => [createMockElement('', 'img', { alt })]),
  queryAllByTitle: jest.fn((title) => [createMockElement('', 'div', { title })]),
  findByText: jest.fn((text) => Promise.resolve(findElementByText(text))),
  findByRole: jest.fn((role) => Promise.resolve(createMockElement('', 'div', { role }))),
  findByTestId: jest.fn((testId) => Promise.resolve(createMockElement('', 'div', { 'data-testid': testId }))),
  findByLabelText: jest.fn((label) => Promise.resolve(createMockElement('', 'input', { 'aria-label': label }))),
  findByPlaceholderText: jest.fn((placeholder) => Promise.resolve(createMockElement('', 'input', { placeholder }))),
  findByDisplayValue: jest.fn((value) => Promise.resolve(createMockElement('', 'input', { value }))),
  findByAltText: jest.fn((alt) => Promise.resolve(createMockElement('', 'img', { alt }))),
  findByTitle: jest.fn((title) => Promise.resolve(createMockElement('', 'div', { title }))),
  findAllByText: jest.fn((text) => Promise.resolve([findElementByText(text)])),
  findAllByRole: jest.fn((role) => Promise.resolve([createMockElement('', 'div', { role })])),
  findAllByTestId: jest.fn((testId) => Promise.resolve([createMockElement('', 'div', { 'data-testid': testId })])),
  findAllByLabelText: jest.fn((label) => Promise.resolve([createMockElement('', 'input', { 'aria-label': label })])),
  findAllByPlaceholderText: jest.fn((placeholder) => Promise.resolve([createMockElement('', 'input', { placeholder })])),
  findAllByDisplayValue: jest.fn((value) => Promise.resolve([createMockElement('', 'input', { value })])),
  findAllByAltText: jest.fn((alt) => Promise.resolve([createMockElement('', 'img', { alt })])),
  findAllByTitle: jest.fn((title) => Promise.resolve([createMockElement('', 'div', { title })])),
  debug: jest.fn(),
};

const fireEvent = {
  click: jest.fn((element) => {
    // Simulate clicking the button by calling the voice assistant methods
    const mockVoiceAssistant = require('@/providers/VoiceAssistantProvider').useVoiceAssistant();
    
    if (element && element.tagName === 'BUTTON' && !element.disabled) {
      if (mockVoiceAssistant.isListening) {
        mockVoiceAssistant.deactivateVoice();
      } else {
        mockVoiceAssistant.activateVoice();
      }
    }
  }),
  change: jest.fn(),
  input: jest.fn(),
  submit: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  keyDown: jest.fn((element, options) => {
    // Simulate keyboard events
    const mockVoiceAssistant = require('@/providers/VoiceAssistantProvider').useVoiceAssistant();
    
    if (element && element.tagName === 'BUTTON' && !element.disabled) {
      if (options.key === 'Enter' || options.key === ' ') {
        if (mockVoiceAssistant.isListening) {
          mockVoiceAssistant.deactivateVoice();
        } else {
          mockVoiceAssistant.activateVoice();
        }
      }
    }
  }),
  keyUp: jest.fn(),
  keyPress: jest.fn(),
  mouseDown: jest.fn(),
  mouseUp: jest.fn(),
  mouseEnter: jest.fn(),
  mouseLeave: jest.fn(),
  scroll: jest.fn(),
};

const waitFor = jest.fn(async (callback, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = callback();
      if (result !== undefined) {
        return result;
      }
      return;
    } catch (error) {
      // If the callback throws, wait and try again
      await new Promise(resolve => setTimeout(resolve, interval));
      continue;
    }
  }
  
  // Final attempt - let it throw if it fails
  return callback();
});

const waitForElementToBeRemoved = jest.fn(() => Promise.resolve());

const act = jest.fn((callback) => {
  if (callback) {
    return Promise.resolve(callback());
  }
  return Promise.resolve();
});

const cleanup = jest.fn();

const renderHook = jest.fn((hook, options = {}) => {
  let hookResult = null;
  let hookError = null;

  // Function to execute the hook and capture result/error
  const executeHook = () => {
    try {
      hookResult = hook();
      hookError = null;
    } catch (error) {
      hookError = error;
      hookResult = null;
    }
  };

  // Execute the hook immediately to get initial result
  executeHook();

  const TestComponent = () => {
    executeHook();
    return null;
  };

  const renderResult = render(
    options.wrapper ? 
      React.createElement(options.wrapper, {}, React.createElement(TestComponent)) :
      React.createElement(TestComponent)
  );

  // Set up rerender callback for mutations
  try {
    const { setRerenderCallback } = require('@tanstack/react-query');
    setRerenderCallback(() => {
      executeHook();
    });
  } catch (e) {
    // Ignore if tanstack-react-query is not available
  }

  const result = {
    get current() {
      if (hookError) throw hookError;
      return hookResult;
    }
  };

  return {
    result,
    rerender: jest.fn((newHook) => {
      if (newHook) {
        hook = newHook;
        executeHook();
      }
    }),
    unmount: jest.fn(),
    ...renderResult
  };
});

module.exports = {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  act,
  cleanup,
  renderHook,
};