import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder polyfills for react-router
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Web Speech API globally
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  serviceURI: '',
  grammars: null,
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null,
  onnomatch: null,
  onsoundstart: null,
  onsoundend: null,
  onspeechstart: null,
  onspeechend: null,
  onaudiostart: null,
  onaudioend: null
};

global.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

// Mock Speech Synthesis API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null
};

global.speechSynthesis = mockSpeechSynthesis;

global.SpeechSynthesisUtterance = jest.fn(() => ({
  text: '',
  lang: 'en-US',
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null
}));

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{
        stop: jest.fn(),
        getSettings: () => ({ deviceId: 'default' })
      }]
    })),
    enumerateDevices: jest.fn(() => Promise.resolve([
      {
        deviceId: 'default',
        kind: 'audioinput',
        label: 'Default Microphone',
        groupId: 'default'
      }
    ]))
  }
});

// Mock Permissions API
Object.defineProperty(navigator, 'permissions', {
  writable: true,
  value: {
    query: jest.fn(() => Promise.resolve({ state: 'granted' }))
  }
});

// Mock AudioContext
global.AudioContext = jest.fn(() => ({
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1 }
  })),
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 },
    type: 'sine'
  })),
  close: jest.fn(),
  resume: jest.fn(() => Promise.resolve()),
  suspend: jest.fn(() => Promise.resolve()),
  state: 'running',
  sampleRate: 44100,
  currentTime: 0,
  destination: {
    connect: jest.fn(),
    disconnect: jest.fn()
  }
}));

global.webkitAudioContext = global.AudioContext;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock JSDOM navigation before any other setup
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].toString().includes('Not implemented: navigation')) {
    return; // Suppress JSDOM navigation errors
  }
  originalError.call(console, ...args);
};

// Mock window.location (handle jsdom's non-configurable location)
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  assign: jest.fn(),
  replace: jest.fn()
};

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    back: jest.fn(),
    forward: jest.fn(),
    go: jest.fn(),
    pushState: jest.fn(),
    replaceState: jest.fn(),
    length: 1,
    state: null
  },
  writable: true
});

// Mock navigation to prevent JSDOM navigation errors
Object.defineProperty(window, 'navigation', {
  value: {
    navigate: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    canGoBack: false,
    canGoForward: false,
    currentEntry: {
      url: 'http://localhost:3000/',
      key: 'mock-key',
      id: 'mock-id',
      index: 0,
      sameDocument: true
    },
    entries: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock MutationObserver
global.MutationObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob
global.Blob = jest.fn((content, options) => ({
  size: content ? content.reduce((acc, item) => acc + item.length, 0) : 0,
  type: options?.type || '',
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn(() => Promise.resolve(content ? content.join('') : '')),
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0)))
}));

// Mock File
global.File = jest.fn((content, name, options) => ({
  ...new Blob(content, options),
  name,
  lastModified: Date.now(),
  webkitRelativePath: ''
}));

// Mock FileReader
global.FileReader = jest.fn(() => ({
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  readAsBinaryString: jest.fn(),
  abort: jest.fn(),
  result: null,
  error: null,
  readyState: 0,
  onload: null,
  onerror: null,
  onabort: null,
  onloadstart: null,
  onloadend: null,
  onprogress: null
}));

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
  }
});

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    navigation: {
      type: 0,
      redirectCount: 0
    },
    timing: {
      navigationStart: Date.now(),
      loadEventEnd: Date.now() + 1000
    }
  }
});

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Restore console for debugging when needed
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
  setProperty: jest.fn(),
  removeProperty: jest.fn()
}));

// Mock Element methods
Element.prototype.scrollIntoView = jest.fn();
Element.prototype.scrollTo = jest.fn();
Element.prototype.scroll = jest.fn();

// Mock HTMLElement methods
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();
HTMLElement.prototype.click = jest.fn();

// Mock HTMLMediaElement
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  set: jest.fn(),
  get: jest.fn(() => false)
});

Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
  set: jest.fn(),
  get: jest.fn(() => 1)
});

HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
HTMLMediaElement.prototype.pause = jest.fn();
HTMLMediaElement.prototype.load = jest.fn();

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  fillText: jest.fn(),
  strokeText: jest.fn()
}));

// Mock DOMRect
global.DOMRect = jest.fn(() => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  toJSON: jest.fn()
}));

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => new DOMRect());

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
    write: jest.fn(() => Promise.resolve()),
    read: jest.fn(() => Promise.resolve([]))
  },
  writable: true
});

// Mock online/offline status
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

// Mock user agent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  writable: true
});

// Mock language
Object.defineProperty(navigator, 'language', {
  value: 'en-US',
  writable: true
});

Object.defineProperty(navigator, 'languages', {
  value: ['en-US', 'en'],
  writable: true
});

// Mock timezone
Object.defineProperty(Intl, 'DateTimeFormat', {
  value: jest.fn(() => ({
    resolvedOptions: jest.fn(() => ({ timeZone: 'America/New_York' })),
    format: jest.fn(() => '1/1/2023'),
    formatToParts: jest.fn(() => [])
  }))
});

// Mock Worker
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: null,
  onerror: null
}));

// Mock SharedWorker
global.SharedWorker = jest.fn(() => ({
  port: {
    postMessage: jest.fn(),
    start: jest.fn(),
    close: jest.fn(),
    onmessage: null,
    onerror: null
  }
}));

// Mock ServiceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      scope: 'http://localhost:3000/',
      update: jest.fn(() => Promise.resolve()),
      unregister: jest.fn(() => Promise.resolve(true))
    })),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      scope: 'http://localhost:3000/'
    }),
    controller: null,
    oncontrollerchange: null,
    onmessage: null
  },
  writable: true
});

// Mock Notification API
global.Notification = jest.fn(() => ({
  close: jest.fn(),
  onclick: null,
  onclose: null,
  onerror: null,
  onshow: null
}));

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true
});

Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(() => true),
  writable: true
});

// Mock battery API
Object.defineProperty(navigator, 'getBattery', {
  value: jest.fn(() => Promise.resolve({
    charging: true,
    chargingTime: Infinity,
    dischargingTime: Infinity,
    level: 1,
    onchargingchange: null,
    onchargingtimechange: null,
    ondischargingtimechange: null,
    onlevelchange: null
  })),
  writable: true
});

// Mock network information API
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
    onchange: null
  },
  writable: true
});

// Export mock objects for use in tests
export {
  mockSpeechRecognition,
  mockSpeechSynthesis,
  localStorageMock,
  sessionStorageMock
};
