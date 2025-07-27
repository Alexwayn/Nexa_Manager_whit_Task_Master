/**
 * Architectural Enforcement Rules for Nexa Manager
 * 
 * These rules enforce the feature-based architecture and prevent
 * violations of the established patterns.
 */

export const architecturalRules = {
  // Feature isolation rules
  'import/no-restricted-paths': [
    'error',
    {
      zones: [
        // Rule 1: Prevent direct imports between features (must use public API)
        {
          target: './src/features/*/!(index.ts|index.js)',
          from: './src/features/*/!(components|hooks|services|types|utils|__tests__)/**',
          message: 'Features should only import from other features through their public API (index.ts). Use import from "@/features/[feature-name]" instead.'
        },
        
        // Rule 2: Prevent features from importing internal parts of other features
        {
          target: './src/features/**',
          from: './src/features/*/!(index.ts|index.js)',
          except: ['./src/features/*/!(index.ts|index.js)'],
          message: 'Features should only import from other features through their public API (index.ts). Use import from "@/features/[feature-name]" instead.'
        },
        
        // Rule 3: Prevent shared modules from importing feature-specific code
        {
          target: './src/shared/**',
          from: './src/features/**',
          message: 'Shared modules should not depend on specific features. Consider moving the functionality to shared or creating a proper abstraction.'
        },
        
        // Rule 4: Prevent deep imports into shared modules
        {
          target: './src/**',
          from: './src/shared/*/!(index.ts|index.js)',
          except: ['./src/shared/**'],
          message: 'Use shared module public APIs through index.ts files. Import from "@/shared/[module-name]" instead.'
        },
        
        // Rule 5: Prevent imports from pages into features (should be the other way around)
        {
          target: './src/features/**',
          from: './src/pages/**',
          message: 'Features should not import from pages. Pages should import from features, not vice versa.'
        },
        
        // Rule 6: Prevent utils from importing components or hooks
        {
          target: './src/**/utils/**',
          from: './src/**/components/**',
          message: 'Utility functions should not import components. Keep utilities pure and framework-agnostic.'
        },
        {
          target: './src/**/utils/**',
          from: './src/**/hooks/**',
          message: 'Utility functions should not import hooks. Keep utilities pure and framework-agnostic.'
        },
        
        // Rule 7: Prevent services from importing components or hooks
        {
          target: './src/**/services/**',
          from: './src/**/components/**',
          message: 'Services should not import components. Keep business logic separate from UI components.'
        },
        {
          target: './src/**/services/**',
          from: './src/**/hooks/**',
          message: 'Services should not import hooks. Keep business logic separate from React-specific code.'
        }
      ]
    }
  ],
  
  // Import organization rules
  'import/order': [
    'error',
    {
      groups: [
        'builtin',      // Node.js built-in modules
        'external',     // npm packages
        'internal',     // Internal modules (with @/ prefix)
        'parent',       // ../
        'sibling',      // ./
        'index'         // ./index
      ],
      pathGroups: [
        // Prioritize internal imports
        {
          pattern: '@/**',
          group: 'internal',
          position: 'before'
        },
        // Feature imports
        {
          pattern: '@/features/**',
          group: 'internal',
          position: 'before'
        },
        // Shared imports
        {
          pattern: '@/shared/**',
          group: 'internal',
          position: 'before'
        }
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }
  ],
  
  // Dependency management rules
  'import/no-cycle': ['error', { maxDepth: 10 }],
  'import/no-unresolved': 'error',
  'import/no-self-import': 'error',
  
  // Export consistency rules
  'import/prefer-default-export': 'off',
  'import/no-default-export': ['warn', { 
    // Allow default exports for specific file types
    'allow': ['*.config.js', '*.config.ts', 'vite.config.*', 'tailwind.config.*']
  }],
  
  // Naming convention enforcement
  '@typescript-eslint/naming-convention': [
    'error',
    // Interfaces should start with 'I' or be descriptive
    {
      selector: 'interface',
      format: ['PascalCase'],
      custom: {
        regex: '^[A-Z][a-zA-Z0-9]*$',
        match: true
      }
    },
    // Types should be PascalCase
    {
      selector: 'typeAlias',
      format: ['PascalCase']
    },
    // Enums should be PascalCase
    {
      selector: 'enum',
      format: ['PascalCase']
    },
    // Variables should be camelCase or UPPER_CASE for constants
    {
      selector: 'variable',
      format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      leadingUnderscore: 'allow'
    },
    // Functions should be camelCase
    {
      selector: 'function',
      format: ['camelCase', 'PascalCase']
    },
    // Methods should be camelCase
    {
      selector: 'method',
      format: ['camelCase']
    }
  ]
};

export const architecturalSettings = {
  'import/resolver': {
    typescript: {
      alwaysTryTypes: true,
      project: './tsconfig.json'
    },
    node: {
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }
  },
  'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
  'import/parsers': {
    '@typescript-eslint/parser': ['.ts', '.tsx']
  }
};