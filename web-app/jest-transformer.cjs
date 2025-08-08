const { createTransformer } = require('babel-jest').default || require('babel-jest');

const babelOptions = require('./babel.config.cjs');
module.exports = createTransformer({ ...babelOptions });