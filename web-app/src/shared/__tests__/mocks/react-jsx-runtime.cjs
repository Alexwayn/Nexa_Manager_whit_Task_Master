// Mock for react/jsx-runtime
const jsx = jest.fn((type, props = {}, key) => {
  const { children, ...restProps } = props;
  return {
    type,
    props: {
      ...restProps,
      children: children !== undefined ? children : undefined,
    },
    key,
  };
});

const jsxs = jsx;
const Fragment = 'Fragment';

module.exports = {
  jsx,
  jsxs,
  Fragment,
};