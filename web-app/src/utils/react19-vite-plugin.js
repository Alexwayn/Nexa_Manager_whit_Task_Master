// Vite plugin to inject React 19 compatibility fix
export function react19CompatPlugin() {
  return {
    name: 'react19-compat',
    generateBundle(options, bundle) {
      // Find the main entry chunk
      const entryChunk = Object.values(bundle).find(
        chunk => chunk.type === 'chunk' && chunk.isEntry
      );
      
      if (entryChunk) {
        // Prepend React compatibility code
        const compatCode = `
// React 19 Compatibility Shim - Enhanced
(function() {
  if (typeof window !== 'undefined') {
    // Create a comprehensive React mock
    const ReactMock = {
      forwardRef: function(render) {
        const ForwardRef = function(props, ref) {
          return render(props, ref);
        };
        ForwardRef.$$typeof = Symbol.for('react.forward_ref');
        ForwardRef.render = render;
        return ForwardRef;
      },
      
      createContext: function(defaultValue) {
        const context = {
          $$typeof: Symbol.for('react.context'),
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: function(props) {
            return props.children;
          },
          Consumer: function(props) {
            return props.children(defaultValue);
          },
          _defaultValue: defaultValue,
          _globalName: null
        };
        
        context.Provider.$$typeof = Symbol.for('react.provider');
        context.Consumer.$$typeof = Symbol.for('react.context');
        context.Provider._context = context;
        context.Consumer._context = context;
        
        return context;
      },
      
      useState: function(initial) {
        return [initial, function() {}];
      },
      
      useEffect: function() {},
      useLayoutEffect: function() {},
      useRef: function(initial) { 
        return { current: initial || null }; 
      },
      useMemo: function(fn, deps) { 
        return fn(); 
      },
      useCallback: function(fn, deps) { 
        return fn; 
      },
      useContext: function(context) {
        return context._currentValue;
      },
      useReducer: function(reducer, initialArg, init) {
        const initialState = init ? init(initialArg) : initialArg;
        return [initialState, function() {}];
      },
      useImperativeHandle: function() {},
      useDebugValue: function() {},
      
      createElement: function(type, props, ...children) {
        return {
          $$typeof: Symbol.for('react.element'),
          type: type,
          key: props && props.key || null,
          ref: props && props.ref || null,
          props: {
            ...(props || {}),
            children: children.length === 1 ? children[0] : children
          }
        };
      },
      
      Fragment: function(props) { 
        return props.children; 
      },
      
      Component: function(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = {};
        this.updater = updater || {};
      },
      
      PureComponent: function(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = {};
        this.updater = updater || {};
      },
      
      memo: function(Component, propsAreEqual) {
        const MemoComponent = function(props) {
          return Component(props);
        };
        MemoComponent.$$typeof = Symbol.for('react.memo');
        MemoComponent.type = Component;
        MemoComponent.compare = propsAreEqual || null;
        return MemoComponent;
      },
      
      lazy: function(ctor) {
        const LazyComponent = {
          $$typeof: Symbol.for('react.lazy'),
          _payload: { _status: -1, _result: ctor },
          _init: function(payload) {
            if (payload._status === -1) {
              payload._status = 0;
              payload._result = payload._result();
            }
            return payload._result;
          }
        };
        return LazyComponent;
      },
      
      Suspense: function(props) {
        return props.children;
      },
      
      version: '19.0.0',
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {}
    };
    
    // Set up Component prototype
    ReactMock.Component.prototype.isReactComponent = {};
    ReactMock.Component.prototype.setState = function() {};
    ReactMock.Component.prototype.forceUpdate = function() {};
    
    // Set up PureComponent prototype
    ReactMock.PureComponent.prototype = Object.create(ReactMock.Component.prototype);
    ReactMock.PureComponent.prototype.constructor = ReactMock.PureComponent;
    ReactMock.PureComponent.prototype.isPureReactComponent = true;
    
    // Set Fragment symbol
    ReactMock.Fragment.$$typeof = Symbol.for('react.fragment');
    
    // Ensure React namespace exists and populate it
    window.React = window.React || {};
    Object.assign(window.React, ReactMock);
    
    // Also set it globally for modules that might expect it
    if (typeof global !== 'undefined') {
      global.React = window.React;
    }
  }
})();

`;
        entryChunk.code = compatCode + entryChunk.code;
      }
    }
  };
}