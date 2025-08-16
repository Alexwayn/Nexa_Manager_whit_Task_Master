const babelJest = require('babel-jest').default || require('babel-jest');

// Load Babel config to ensure consistency
const babelConfig = require('./babel.config.cjs');

// Create transformer with consistent configuration
module.exports = babelJest.createTransformer({
  ...babelConfig,
  // Override specific settings for Jest compatibility
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: 'commonjs', // Force CommonJS modules for Jest
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', { regenerator: true }],
    ['@babel/plugin-transform-modules-commonjs'],
    ['@babel/plugin-syntax-import-meta'],
    ['e:/AlexVenturesStudio/Nexa_Manager_whit_Task_Master/.config/jest/import-meta-plugin.js'],
  ],
});