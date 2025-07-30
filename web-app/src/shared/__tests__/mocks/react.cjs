// Mock for React
let stateIndex = 0;
const stateValues = [];
const stateSetters = [];
let forceUpdateCallbacks = [];

const React = {
  // Internal React properties
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentDispatcher: {
      current: null,
    },
    ReactCurrentBatchConfig: {
      transition: null,
    },
    ReactCurrentOwner: {
      current: null,
    },
  },

  // Force update mechanism for testing
  _forceUpdate: jest.fn(() => {
    forceUpdateCallbacks.forEach(callback => callback());
  }),

  _addForceUpdateCallback: (callback) => {
    forceUpdateCallbacks.push(callback);
  },

  _clearForceUpdateCallbacks: () => {
    forceUpdateCallbacks = [];
  },

  // Reset state for testing
  _resetState: () => {
    stateIndex = 0;
    stateValues.length = 0;
    stateSetters.length = 0;
    forceUpdateCallbacks = [];
  },

  // Mock useState with actual state management
  useState: jest.fn((initialValue) => {
    const currentIndex = stateIndex++;
    
    if (stateValues[currentIndex] === undefined) {
      stateValues[currentIndex] = initialValue;
    }
    
    const setState = jest.fn((newValue) => {
      if (typeof newValue === 'function') {
        stateValues[currentIndex] = newValue(stateValues[currentIndex]);
      } else {
        stateValues[currentIndex] = newValue;
      }
      // Trigger re-render simulation
      if (React._forceUpdate) {
        React._forceUpdate();
      }
    });
    
    stateSetters[currentIndex] = setState;
    
    return [stateValues[currentIndex], setState];
  }),

  // Mock useEffect
  useEffect: jest.fn((effect, deps) => {
    if (typeof effect === 'function') {
      effect();
    }
  }),

  // Mock useCallback
  useCallback: jest.fn((callback, deps) => callback),

  // Mock useMemo
  useMemo: jest.fn((factory, deps) => factory()),

  // Mock useRef
  useRef: jest.fn((initialValue) => ({ current: initialValue })),

  // Mock useContext
  useContext: jest.fn(() => ({})),

  // Mock createElement
  createElement: jest.fn((type, props, ...children) => ({
    type,
    props: { ...props, children },
  })),

  // Mock Fragment
  Fragment: 'Fragment',

  // Mock Component
  Component: class Component {
    constructor(props) {
      this.props = props;
    }
    render() {
      return null;
    }
  },

  // Mock PureComponent
  PureComponent: class PureComponent {
    constructor(props) {
      this.props = props;
    }
    render() {
      return null;
    }
  },

  // Mock forwardRef
  forwardRef: jest.fn((component) => component),

  // Mock memo
  memo: jest.fn((component) => component),

  // Mock createContext
  createContext: jest.fn(() => ({
    Provider: jest.fn(({ children }) => children),
    Consumer: jest.fn(({ children }) => children({})),
  })),

  // Mock version
  version: '18.0.0',
};

module.exports = React;