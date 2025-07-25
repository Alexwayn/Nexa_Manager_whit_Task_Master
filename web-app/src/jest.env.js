// Jest environment setup for tests
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_APP_ENV = 'test';
process.env.VITE_BASE_URL = 'http://localhost:3000';
process.env.VITE_OPENAI_API_KEY = 'test-openai-key';
process.env.VITE_QWEN_API_KEY = 'test-qwen-key';

// Mock import.meta for Jest
global.importMeta = {
  env: {
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_APP_ENV: 'test',
    VITE_BASE_URL: 'http://localhost:3000',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_QWEN_API_KEY: 'test-qwen-key',
  }
};