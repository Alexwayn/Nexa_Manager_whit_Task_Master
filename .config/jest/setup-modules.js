// Jest setup for module resolution issues
console.log('Setting up Jest modules...');

// Patch the @testing-library/dom configure function issue
try {
  // First, let's try to load the module normally
  const dom = require('@testing-library/dom');
  
  // Check if configure exists and is accessible
  if (dom && 'configure' in dom) {
    // Get the configure function using property descriptor
    const configureDescriptor = Object.getOwnPropertyDescriptor(dom, 'configure');
    
    if (configureDescriptor && configureDescriptor.get) {
      // It's a getter, let's try to get the actual function
      try {
        const configureFunction = configureDescriptor.get();
        if (typeof configureFunction === 'function') {
          // Patch the dom object to have a direct configure property
          Object.defineProperty(dom, 'configure', {
            value: configureFunction,
            writable: true,
            enumerable: true,
            configurable: true
          });
          console.log('SUCCESS: Patched @testing-library/dom configure function');
        }
      } catch (getterError) {
        console.log('Could not access configure via getter:', getterError.message);
      }
    } else if (typeof dom.configure === 'function') {
      console.log('SUCCESS: @testing-library/dom configure function already accessible');
    } else {
      console.log('WARNING: configure property exists but is not a function:', typeof dom.configure);
    }
  } else {
    console.log('WARNING: @testing-library/dom configure property not found');
  }
  
  // Also ensure the module is properly cached
  require.cache[require.resolve('@testing-library/dom')] = require.cache[require.resolve('@testing-library/dom')] || {
    exports: dom,
    loaded: true
  };
  
} catch (error) {
  console.error('Failed to patch @testing-library/dom:', error.message);
}

// Import voice test setup to ensure voice APIs are mocked globally
try {
  require('../../web-app/src/__tests__/config/voiceTestSetup.js');
  console.log('SUCCESS: Voice test setup loaded');
} catch (error) {
  console.error('Failed to load voice test setup:', error.message);
}