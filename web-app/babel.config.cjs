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
        module: 'ES6',
        env: {
          VITE_BASE_URL: 'http://localhost:3000',
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key',
          VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
          VITE_APP_ENV: 'test',
          VITE_OPENAI_API_KEY: 'test-openai-key',
          VITE_QWEN_API_KEY: 'test-qwen-key',
          VITE_WS_URL: 'ws://localhost:8080',
          VITE_CLERK_PUBLISHABLE_KEY: 'test-clerk-key',
          VITE_ENABLE_DEMO_MODE: 'false',
          DEV: false,
          PROD: false,
          MODE: 'test'
        }
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
            module: 'ES6',
            env: {
              VITE_BASE_URL: 'http://localhost:3000',
              VITE_SUPABASE_URL: 'https://test.supabase.co',
              VITE_SUPABASE_ANON_KEY: 'test-key',
              VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
              VITE_APP_ENV: 'test',
              VITE_OPENAI_API_KEY: 'test-openai-key',
              VITE_QWEN_API_KEY: 'test-qwen-key',
              VITE_WS_URL: 'ws://localhost:8080',
              VITE_CLERK_PUBLISHABLE_KEY: 'test-clerk-key',
              VITE_ENABLE_DEMO_MODE: 'false',
              DEV: false,
              PROD: false,
              MODE: 'test'
            }
          }
        ],
      ],
    },
  },
};