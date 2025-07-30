const babel = require('@babel/core');
const path = require('path');

module.exports = {
  process(src, filename, config, options) {
    // Simple transformation for import.meta
    let transformedSrc = src;
    
    // Replace import.meta.env with process.env
    transformedSrc = transformedSrc.replace(
      /import\.meta\.env/g,
      'process.env'
    );
    
    // Replace import.meta.url with a test URL
    transformedSrc = transformedSrc.replace(
      /import\.meta\.url/g,
      '"file:///test"'
    );
    
    // Replace import.meta with a test object
    transformedSrc = transformedSrc.replace(
      /import\.meta/g,
      '({ env: process.env, url: "file:///test" })'
    );

    // Use Babel for the rest of the transformation
    const result = babel.transformSync(transformedSrc, {
      filename,
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ],
      plugins: [],
      sourceMaps: false,
    });

    return {
      code: result.code,
    };
  },
};