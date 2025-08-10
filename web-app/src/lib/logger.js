// Minimal logger used in tests and default runtime
const createLogger = () => {
  const noop = () => {};
  return {
    debug: typeof console !== 'undefined' ? console.debug.bind(console) : noop,
    info: typeof console !== 'undefined' ? console.info.bind(console) : noop,
    warn: typeof console !== 'undefined' ? console.warn.bind(console) : noop,
    error: typeof console !== 'undefined' ? console.error.bind(console) : noop,
    log: typeof console !== 'undefined' ? console.log.bind(console) : noop,
  };
};

export default createLogger();


