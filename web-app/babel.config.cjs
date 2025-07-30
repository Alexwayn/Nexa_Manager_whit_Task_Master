module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: 'commonjs', // Force CommonJS for Jest
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
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
            modules: 'commonjs', // Ensure CommonJS for Jest
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
      ],
    },
  },
};