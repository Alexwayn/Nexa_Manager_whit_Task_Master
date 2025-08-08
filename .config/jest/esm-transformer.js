/**
 * Custom ES Module Transformer for Jest
 * 
 * This transformer handles ES module syntax and ensures proper
 * interop between ES modules and CommonJS in the test environment.
 */

const { createTransformer } = require('babel-jest').default || require('babel-jest');

const transformer = createTransformer({
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: 'commonjs',
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
    '@babel/plugin-syntax-jsx',
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-top-level-await',
    '@babel/plugin-transform-modules-commonjs',
    // Transform import.meta
    [
      'babel-plugin-transform-import-meta',
      {
        module: 'ES6'
      }
    ],
    // Custom plugin to handle import.meta transformations
    function() {
      return {
        visitor: {
          MetaProperty(path) {
            if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
              // Replace import.meta with global.importMeta or fallback object
              path.replaceWithSourceString('(typeof global !== "undefined" && global.importMeta) || { env: process.env, url: "file:///test" }');
            }
          },
          MemberExpression(path) {
            // Handle import.meta.env specifically
            if (
              path.node.object &&
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta' &&
              path.node.property.name === 'env'
            ) {
              path.replaceWithSourceString('(typeof global !== "undefined" && global.importMeta && global.importMeta.env) || process.env');
            }
            // Handle import.meta.url specifically
            else if (
              path.node.object &&
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta' &&
              path.node.property.name === 'url'
            ) {
              path.replaceWithSourceString('"file:///test"');
            }
          }
        }
      };
    },

    // Ensure proper ES module interop
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: false,
        regenerator: true,
      },
    ],
  ],
  babelrc: false,
  configFile: false,
});

module.exports = transformer;