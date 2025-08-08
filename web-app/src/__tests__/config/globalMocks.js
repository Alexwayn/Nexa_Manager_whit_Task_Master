/**
 * Global mocks for voice assistant testing
 * This file sets up essential mocks that need to be available globally
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock window.matchMedia
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
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  takeRecords() {
    return [];
  }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock performance API
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Mock URL and URLSearchParams
global.URL = class URL {
  constructor(url, base) {
    this.href = url;
    this.origin = base || 'http://localhost:3000';
    this.protocol = 'http:';
    this.host = 'localhost:3000';
    this.hostname = 'localhost';
    this.port = '3000';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }
  
  toString() {
    return this.href;
  }
};

global.URLSearchParams = class URLSearchParams {
  constructor(init) {
    this.params = new Map();
    if (typeof init === 'string') {
      init.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
      });
    }
  }
  
  get(name) {
    return this.params.get(name);
  }
  
  set(name, value) {
    this.params.set(name, value);
  }
  
  has(name) {
    return this.params.has(name);
  }
  
  delete(name) {
    this.params.delete(name);
  }
  
  toString() {
    const pairs = [];
    this.params.forEach((value, key) => {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    return pairs.join('&');
  }
};

// Mock Blob and File
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts || [];
    this.type = options?.type || '';
    this.size = this.parts.reduce((size, part) => size + (part.length || 0), 0);
  }
  
  slice(start, end, contentType) {
    return new Blob(this.parts.slice(start, end), { type: contentType });
  }
  
  text() {
    return Promise.resolve(this.parts.join(''));
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
};

global.File = class File extends global.Blob {
  constructor(parts, name, options) {
    super(parts, options);
    this.name = name;
    this.lastModified = options?.lastModified || Date.now();
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.onloadstart = null;
    this.onloadend = null;
    this.onprogress = null;
  }
  
  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = file.parts ? file.parts.join('') : '';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = `data:${file.type};base64,${btoa(file.parts ? file.parts.join('') : '')}`;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }
  
  abort() {
    this.readyState = 2;
    if (this.onabort) this.onabort({ target: this });
  }
};

// Mock crypto API
global.crypto = {
  getRandomValues: jest.fn(arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  randomUUID: jest.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  })),
  subtle: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    sign: jest.fn(() => Promise.resolve(new ArrayBuffer(64))),
    verify: jest.fn(() => Promise.resolve(true)),
    generateKey: jest.fn(() => Promise.resolve({})),
    importKey: jest.fn(() => Promise.resolve({})),
    exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
  }
};

// Mock Worker
global.Worker = class Worker {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
  }
  
  postMessage(data) {
    // Simulate async message handling
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { type: 'response', payload: data } });
      }
    }, 0);
  }
  
  terminate() {
    // Mock termination
  }
  
  addEventListener(type, listener) {
    if (type === 'message') this.onmessage = listener;
    if (type === 'error') this.onerror = listener;
    if (type === 'messageerror') this.onmessageerror = listener;
  }
  
  removeEventListener(type, listener) {
    if (type === 'message' && this.onmessage === listener) this.onmessage = null;
    if (type === 'error' && this.onerror === listener) this.onerror = null;
    if (type === 'messageerror' && this.onmessageerror === listener) this.onmessageerror = null;
  }
};

// Mock SharedWorker
global.SharedWorker = class SharedWorker {
  constructor(url) {
    this.port = {
      postMessage: jest.fn(),
      onmessage: null,
      onmessageerror: null,
      start: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  }
};

// Mock ServiceWorker
global.ServiceWorker = class ServiceWorker {
  constructor() {
    this.state = 'activated';
    this.scriptURL = '';
    this.onstatechange = null;
    this.onerror = null;
  }
  
  postMessage(data) {
    // Mock service worker message
  }
  
  addEventListener(type, listener) {
    if (type === 'statechange') this.onstatechange = listener;
    if (type === 'error') this.onerror = listener;
  }
  
  removeEventListener(type, listener) {
    if (type === 'statechange' && this.onstatechange === listener) this.onstatechange = null;
    if (type === 'error' && this.onerror === listener) this.onerror = null;
  }
};

// Mock Notification API
global.Notification = class Notification {
  constructor(title, options) {
    this.title = title;
    this.body = options?.body || '';
    this.icon = options?.icon || '';
    this.tag = options?.tag || '';
    this.onclick = null;
    this.onshow = null;
    this.onerror = null;
    this.onclose = null;
    
    // Simulate notification show
    setTimeout(() => {
      if (this.onshow) this.onshow();
    }, 0);
  }
  
  static requestPermission() {
    return Promise.resolve('granted');
  }
  
  static get permission() {
    return 'granted';
  }
  
  close() {
    if (this.onclose) this.onclose();
  }
  
  addEventListener(type, listener) {
    if (type === 'click') this.onclick = listener;
    if (type === 'show') this.onshow = listener;
    if (type === 'error') this.onerror = listener;
    if (type === 'close') this.onclose = listener;
  }
  
  removeEventListener(type, listener) {
    if (type === 'click' && this.onclick === listener) this.onclick = null;
    if (type === 'show' && this.onshow === listener) this.onshow = null;
    if (type === 'error' && this.onerror === listener) this.onerror = null;
    if (type === 'close' && this.onclose === listener) this.onclose = null;
  }
};

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(() => true),
  writable: true
});

// Mock battery API
Object.defineProperty(navigator, 'getBattery', {
  value: jest.fn(() => Promise.resolve({
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    level: 1,
    onchargingchange: null,
    onchargingtimechange: null,
    ondischargingtimechange: null,
    onlevelchange: null
  })),
  writable: true
});

// Mock Intl.DateTimeFormat for consistent date formatting in tests
global.Intl = {
  ...global.Intl,
  DateTimeFormat: jest.fn(() => ({
    format: jest.fn(date => new Date(date).toLocaleDateString()),
    formatToParts: jest.fn(date => [
      { type: 'month', value: '1' },
      { type: 'literal', value: '/' },
      { type: 'day', value: '1' },
      { type: 'literal', value: '/' },
      { type: 'year', value: '2023' }
    ]),
    resolvedOptions: jest.fn(() => ({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn'
    }))
  }))
};

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

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
  setProperty: jest.fn(),
  removeProperty: jest.fn(),
  cssText: '',
  length: 0,
  parentRule: null
}));

// Mock DOMRect
global.DOMRect = class DOMRect {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
    this.left = x;
  }
  
  static fromRect(other) {
    return new DOMRect(other.x, other.y, other.width, other.height);
  }
  
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left
    };
  }
};

// Mock Element methods
Element.prototype.getBoundingClientRect = jest.fn(() => new DOMRect(0, 0, 100, 100));
Element.prototype.getClientRects = jest.fn(() => [new DOMRect(0, 0, 100, 100)]);
Element.prototype.scrollIntoView = jest.fn();
Element.prototype.scroll = jest.fn();
Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollBy = jest.fn();

// Mock HTMLElement methods
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();
HTMLElement.prototype.click = jest.fn();

// Mock HTMLMediaElement
HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
HTMLMediaElement.prototype.pause = jest.fn();
HTMLMediaElement.prototype.load = jest.fn();

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
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

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,');
HTMLCanvasElement.prototype.toBlob = jest.fn(callback => {
  callback(new Blob([''], { type: 'image/png' }));
});

// Suppress specific warnings in tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (
      args[0].includes('Warning: ReactDOM.render is deprecated') ||
      args[0].includes('Warning: componentWillReceiveProps') ||
      args[0].includes('Warning: componentWillMount') ||
      args[0].includes('Warning: componentWillUpdate')
    )
  ) {
    return;
  }
  originalError.call(console, ...args);
};
