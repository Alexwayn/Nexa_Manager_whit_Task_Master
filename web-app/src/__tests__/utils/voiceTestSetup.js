export const mockSpeechRecognition = {
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
  onstart: jest.fn(),
  onend: jest.fn(),
  onerror: jest.fn(),
  onresult: jest.fn(),
  onnomatch: jest.fn(),
  onsoundstart: jest.fn(),
  onsoundend: jest.fn(),
  onspeechstart: jest.fn(),
  onspeechend: jest.fn(),
  onaudiostart: jest.fn(),
  onaudioend: jest.fn()
};

global.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);