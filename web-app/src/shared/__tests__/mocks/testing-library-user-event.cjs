// Minimal mock for @testing-library/user-event
const { fireEvent } = require('./testing-library-react.cjs');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const userEvent = {
  setup() {
    return this;
  },
  async click(element, options = {}) {
    fireEvent.click(element, options);
    await delay(0);
  },
  async type(element, text, options = {}) {
    if (!element) return;
    for (const char of String(text)) {
      const value = (element.value || '') + char;
      fireEvent.input(element, { target: { value } });
      await delay(0);
    }
  },
  async clear(element) {
    if (!element) return;
    fireEvent.input(element, { target: { value: '' } });
    await delay(0);
  },
  async selectOptions(element, values) { await delay(0); },
  async keyboard() { await delay(0); },
  async hover(element) { await delay(0); },
  async unhover(element) { await delay(0); },
  async tab() { await delay(0); },
  async upload() { await delay(0); },
  async paste(element, text) {
    if (!element) return;
    fireEvent.paste ? fireEvent.paste(element, { clipboardData: { getData: () => text } }) : fireEvent.input(element, { target: { value: (element.value || '') + text } });
    await delay(0);
  },
  async dblClick(element) { fireEvent.doubleClick ? fireEvent.doubleClick(element) : fireEvent.click(element); await delay(0); },
  async tripleClick(element) { fireEvent.doubleClick ? fireEvent.doubleClick(element) : fireEvent.click(element); await delay(0); },
};

module.exports = userEvent;
