const i18n = {
  use: function() {
    return this;
  },
  init: function() {
    return Promise.resolve(this.t);
  },
  t: (key) => key,
  on: () => {},
  off: () => {},
  language: 'en',
  isInitialized: true,
  changeLanguage: () => Promise.resolve(),
};

export default i18n;