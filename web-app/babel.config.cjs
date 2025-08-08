module.exports = {
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
    ['@babel/plugin-transform-runtime', { regenerator: true }],
    ['@babel/plugin-transform-modules-commonjs'],
    ['e:/AlexVenturesStudio/Nexa_Manager_whit_Task_Master/.config/jest/import-meta-plugin.js'],
  ],
};