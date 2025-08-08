const babel = require('@babel/core');

module.exports = {
  process(src, filename, config, options) {
    // Skip transformation for node_modules unless specifically needed
    if (filename.includes('node_modules') && !filename.includes('@supabase')) {
      return { code: src };
    }

    // More comprehensive replacement of import.meta usage
    let transformedSrc = src
      // Handle import.meta.env.VARIABLE_NAME patterns
      .replace(/import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g, 'process.env.$1')
      // Handle import.meta.env access
      .replace(/import\.meta\.env/g, 'process.env')
      // Handle import.meta.url
      .replace(/import\.meta\.url/g, '"file:///test-file.js"')
      // Handle conditional checks for import.meta - be more specific to avoid transforming 'typeof import'
      .replace(/import\.meta && import\.meta\.env/g, 'process.env')
      // Handle arrow functions with import.meta.env
      .replace(/\(\) => import\.meta\.env\.MODE === /g, '() => process.env.MODE === ')
      .replace(/\(\) => import\.meta\.env\.DEV/g, '() => process.env.DEV')
      .replace(/\(\) => import\.meta\.env\.PROD/g, '() => process.env.PROD')
      // Handle any remaining import.meta
      .replace(/import\.meta/g, '({ env: process.env, url: "file:///test-file.js" })');

    // Then use Babel to transform the rest
    try {
      const result = babel.transformSync(transformedSrc, {
        filename,
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
        // Remove all plugins for now
        plugins: [],
        parserOpts: {
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
        },
      });

      return {
        code: result ? result.code : transformedSrc,
      };
    } catch (error) {
      console.error('Babel transformation error in file:', filename);
      console.error('Error:', error.message);
      
      // Try to return a safe fallback for problematic files
      if (error.message.includes('return') && error.message.includes('outside')) {
        // For files with return outside function errors, try a simpler transformation
        try {
          const simpleResult = babel.transformSync(transformedSrc, {
            filename,
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: { node: 'current' },
                  modules: 'commonjs',
                },
              ],
            ],
            plugins: [],
            parserOpts: {
              allowImportExportEverywhere: true,
              allowReturnOutsideFunction: true,
              strictMode: false,
            },
          });
          return { code: simpleResult ? simpleResult.code : transformedSrc };
        } catch (fallbackError) {
          // Last resort: return a mock module
          return { 
            code: `module.exports = {}; // Mock module due to transformation error: ${error.message}` 
          };
        }
      }
      
      throw error;
    }
  },
};