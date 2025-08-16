const userEvent = {
  click: jest.fn((element) => {
    const { fireEvent } = require('@/shared/__tests__/mocks/testing-library-react');
    fireEvent.click(element);
    return Promise.resolve();
  }),
  type: jest.fn((element, text) => {
    const { fireEvent } = require('@/shared/__tests__/mocks/testing-library-react');
    fireEvent.change(element, { target: { value: text } });
    return Promise.resolve();
  }),
  clear: jest.fn((element) => {
    const { fireEvent } = require('@/shared/__tests__/mocks/testing-library-react');
    fireEvent.clear(element);
    return Promise.resolve();
  }),
  setup: () => {
    return userEvent;
  }
};

module.exports = userEvent;