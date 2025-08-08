// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import 'regenerator-runtime/runtime';
import '@testing-library/jest-dom';

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

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => null, 
  Line: () => null, 
  Bar: () => null, 
}));
