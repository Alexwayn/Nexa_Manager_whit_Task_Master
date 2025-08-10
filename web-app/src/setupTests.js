// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import 'regenerator-runtime/runtime';
import '@testing-library/jest-dom';

// Provide a minimal import.meta env polyfill for tests expecting Vite values
if (typeof global.importMeta === 'undefined') {
  global.importMeta = { env: {} };
}

global.importMeta.env = {
  ...global.importMeta.env,
  NODE_ENV: 'test',
  MODE: 'test',
  VITE_BASE_URL: process.env.VITE_BASE_URL || 'http://localhost:3000',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
};

// Shim import.meta for tests that directly access import.meta.env
if (typeof globalThis.import === 'undefined' || typeof globalThis.import.meta === 'undefined') {
  // eslint-disable-next-line no-undef
  globalThis.import = globalThis.import || {};
}
if (typeof import.meta === 'undefined') {
  // eslint-disable-next-line no-undef
  global.import = global.import || {};
  // eslint-disable-next-line no-undef
  global.import.meta = { env: global.importMeta.env, url: 'file:///test' };
}

// Ensure import.meta.env shim for code accessing import.meta directly
if (typeof global.importMetaEnv === 'undefined') {
  global.importMetaEnv = global.importMeta.env;
}

// AudioContext polyfill for voice components
if (typeof window.AudioContext === 'undefined') {
  // eslint-disable-next-line no-undef
  window.AudioContext = class MockAudioContext {
    constructor() {
      this.state = 'running';
    }
    close() { return Promise.resolve(); }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    createAnalyser() { return {}; }
    createMediaStreamSource() { return {}; }
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
    destination = {};
  };
}
if (typeof window.webkitAudioContext === 'undefined') {
  window.webkitAudioContext = window.AudioContext;
}

// Provide Vitest-compatible global for tests that use `vi`
// This maps `vi` to Jest when running under Jest
// eslint-disable-next-line no-undef
global.vi = global.jest;

jest.mock('@testing-library/dom', () => ({
  ...jest.requireActual('@testing-library/dom'),
  configure: () => {},
}));

// Mock i18next-http-backend to prevent network requests in tests
jest.mock('i18next-http-backend', () => ({
  __esModule: true,
  default: {
    type: 'backend',
    init: jest.fn(),
    read: jest.fn((language, namespace, callback) => {
      callback(null, {});
    }),
  },
}));

// Mock chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: class {
    static register() {}
    constructor() {}
    destroy() {}
    update() {}
  },
  ArcElement: class {},
  LineElement: class {},
  BarElement: class {},
  PointElement: class {},
  CategoryScale: class {},
  LinearScale: class {},
  Title: class {},
  Tooltip: class {},
  Legend: class {},
}));

jest.mock('websocket', () => ({
  w3cwebsocket: function () {},
}));

// Mock Supabase client to prevent ES module issues
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
        download: jest.fn(() => Promise.resolve({ data: null, error: null })),
        remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
  })),
}));

// Mock isows to prevent ES module issues
jest.mock('isows', () => ({
  getNativeWebSocket: jest.fn(() => class MockWebSocket {}),
}));

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => null, 
  Line: () => null, 
  Bar: () => null, 
}));

// Polyfill SpeechRecognition for voice tests
if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
  class MockSpeechRecognition {
    constructor() {
      this.continuous = false;
      this.interimResults = false;
      this.lang = 'en-US';
      this.maxAlternatives = 1;
      this._onstart = null;
      this._onresult = null;
      this._onerror = null;
      this._onend = null;
    }
    set onstart(fn) { this._onstart = fn; }
    set onresult(fn) { this._onresult = fn; }
    set onerror(fn) { this._onerror = fn; }
    set onend(fn) { this._onend = fn; }
    start() { if (this._onstart) this._onstart(); }
    stop() { if (this._onend) this._onend(); }
    __emitResult(text = 'go to dashboard', confidence = 0.95) {
      const event = { results: [[{ transcript: text, confidence }]] };
      if (this._onresult) this._onresult(event);
      if (this._onend) this._onend();
    }
  }
  // Expose as webkitSpeechRecognition to match provider checks
  // eslint-disable-next-line no-undef
  window.webkitSpeechRecognition = MockSpeechRecognition;
}

// Mock navigator.permissions for microphone permission checks
if (!navigator.permissions) {
  navigator.permissions = {
    query: jest.fn(async () => ({
      state: 'granted',
      onchange: null,
    })),
  };
}

// Default mocks for voice analytics and feedback services to render expected UI in tests
jest.mock('@/services/voiceAnalyticsService', () => ({
  __esModule: true,
  default: {
    trackSessionStart: jest.fn(async () => ({})),
    trackSessionEnd: jest.fn(async () => ({})),
    trackCommand: jest.fn(async () => ({})),
    trackFailure: jest.fn(async () => ({})),
    trackError: jest.fn(async () => ({})),
    trackRecognitionFailure: jest.fn(async () => ({})),
    getAnalytics: jest.fn(async () => ({
      averageRating: 4.2,
      totalFeedback: 150,
      ratingDistribution: { 5: 80, 4: 40, 3: 20, 2: 5, 1: 5 },
      commonIssues: [
        { label: 'Recognition accuracy', count: 12 },
        { label: 'Response time', count: 8 },
      ],
    })),
    getAnalyticsSummary: jest.fn(async () => ({})),
    getAnalyticsForPeriod: jest.fn(async () => ({})),
    clearAnalytics: jest.fn(async () => ({})),
  },
}));