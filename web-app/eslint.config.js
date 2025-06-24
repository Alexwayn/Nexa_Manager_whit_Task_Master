import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.cjs', '*.config.ts']
  },
  // Special rules for test and debug files
  {
    files: ['**/*test*.{js,jsx,ts,tsx}', '**/*debug*.{js,jsx,ts,tsx}', '**/test-*.{js,jsx,ts,tsx}', '**/debug-*.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Special rules for Logger utility
  {
    files: ['**/utils/Logger.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,
      
      // React specific rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          semi: true,
          trailingComma: 'all',
          singleQuote: true,
          printWidth: 100,
          tabWidth: 2,
        },
      ],
      
      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
    },
  },
  // Logger utility - allow console methods
  {
    files: ['**/Logger.ts', '**/Logger.js'],
    rules: {
      'no-console': 'off',
    },
  },
]