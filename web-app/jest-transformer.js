const { createTransformer } = require('babel-jest').default || require('babel-jest');

// Custom transformer that handles import.meta
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
    '@babel/plugin-syntax-import-meta',
    [
      'babel-plugin-transform-import-meta',
      {
        module: 'ES6'
      }
    ],
    // Custom plugin to replace import.meta with global references
    function() {
      return {
        visitor: {
          MemberExpression(path) {
            // Replace import.meta.env with global.importMeta.env
            if (
              path.node.object &&
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta'
            ) {
              if (path.node.property.name === 'env') {
                path.replaceWithSourceString('global.importMeta.env');
              } else {
                path.replaceWithSourceString('global.importMeta');
              }
            }
          },
          MetaProperty(path) {
            // Replace standalone import.meta with global.importMeta
            if (
              path.node.meta.name === 'import' &&
              path.node.property.name === 'meta'
            ) {
              path.replaceWithSourceString('global.importMeta');
            }
          }
        }
      };
    }
  ],
});

module.exports = transformer;