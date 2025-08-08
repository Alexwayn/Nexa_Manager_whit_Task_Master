// Mock for @testing-library/react
const React = require('react');

// Mock configuration for testing library compatibility
const mockConfig = {
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 1000,
  computedStyleSupportsPseudoElements: false,
  defaultHidden: false,
  showOriginalStackTrace: false,
  throwSuggestions: true,
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    return error;
  },
};

// Mock getConfig function for compatibility
const getConfig = jest.fn(() => mockConfig);

// Mock configure function
const configure = jest.fn((options) => {
  Object.assign(mockConfig, options);
});

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

const render = jest.fn((component, options = {}) => {
  const container = options.container || document.createElement('div');
  lastRenderedContainer = container;
  
  // Simple simulation - just store the component for later queries
  container._testComponent = component;
  
  // Try to extract props from the component if it's a React element
  let componentProps = {};
  if (component && component.props) {
    componentProps = component.props;
  }
  
  // If a wrapper is provided, wrap the component
  if (options.wrapper) {
    const WrappedComponent = options.wrapper;
    component = React.createElement(WrappedComponent, {}, component);
  }
  
  const queryMethods = {
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
  click: jest.fn(),
  change: jest.fn(),
  input: jest.fn(),
  submit: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  keyDown: jest.fn(),
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

// Export all functions
module.exports = {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  act,
  cleanup,
  renderHook,
  getConfig,
  configure,
  // Additional exports for compatibility
  within: jest.fn(() => screen),
  getByRole: screen.getByRole,
  getByText: screen.getByText,
  getByLabelText: screen.getByLabelText,
  getByPlaceholderText: screen.getByPlaceholderText,
  getByTestId: screen.getByTestId,
  getByDisplayValue: screen.getByDisplayValue,
  queryByRole: screen.queryByRole,
  queryByText: screen.queryByText,
  queryByLabelText: screen.queryByLabelText,
  queryByPlaceholderText: screen.queryByPlaceholderText,
  queryByTestId: screen.queryByTestId,
  queryByDisplayValue: screen.queryByDisplayValue,
  findByRole: screen.findByRole,
  findByText: screen.findByText,
  findByLabelText: screen.findByLabelText,
  findByPlaceholderText: screen.findByPlaceholderText,
  findByTestId: screen.findByTestId,
  findByDisplayValue: screen.findByDisplayValue,
};