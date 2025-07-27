# Architectural Enforcement

## Overview

This document describes the architectural enforcement mechanisms implemented in Nexa Manager to maintain code quality, consistency, and adherence to the established feature-based architecture.

## Enforcement Mechanisms

### 1. ESLint Rules

#### Import Restrictions
We use `eslint-plugin-import` to enforce architectural boundaries:

```javascript
'import/no-restricted-paths': [
  'error',
  {
    zones: [
      // Prevent direct imports between features
      {
        target: './src/features/*/!(index.ts|index.js)',
        from: './src/features/*/!(components|hooks|services|types|utils|__tests__)/**',
        message: 'Features should only import from other features through their public API (index.ts)'
      },
      // Prevent shared modules from importing features
      {
        target: './src/shared/**',
        from: './src/features/**',
        message: 'Shared modules should not depend on specific features'
      }
    ]
  }
]
```

#### Import Organization
Enforces consistent import ordering and grouping:

```javascript
'import/order': [
  'error',
  {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    pathGroups: [
      { pattern: '@/**', group: 'internal', position: 'before' },
      { pattern: '@/features/**', group: 'internal', position: 'before' },
      { pattern: '@/shared/**', group: 'internal', position: 'before' }
    ],
    'newlines-between': 'always',
    alphabetize: { order: 'asc', caseInsensitive: true }
  }
]
```

#### Circular Dependency Prevention
```javascript
'import/no-cycle': ['error', { maxDepth: 10 }]
```

### 2. Automated Structure Validation

#### Structure Validation Tests
Located at `web-app/src/__tests__/architecture/structure-validation.test.js`

These tests validate:
- Feature directory structure
- Required files (index.ts, README.md)
- Shared module organization
- File naming conventions
- Configuration structure

#### Feature API Validation Script
Located at `web-app/scripts/validate-feature-api.js`

This script validates:
- Feature public API exports
- Index file organization
- Naming conventions
- Documentation presence

### 3. Pre-commit Hooks

#### Husky Configuration
Pre-commit hooks run automatically before each commit:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix --config ../.config/eslint/eslint.config.js",
      "prettier --write --config ../.config/prettier/.prettierrc",
      "npm run test:architecture --passWithNoTests"
    ],
    "src/features/*/index.ts": [
      "npm run validate:feature-api --passWithNoTests"
    ]
  }
}
```

### 4. TypeScript Configuration

#### Path Mapping
Enforces clean import paths through TypeScript path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

## Architectural Rules

### Feature Isolation Rules

1. **Public API Only**: Features can only import from other features through their `index.ts` files
2. **No Cross-Feature Internal Access**: Direct imports to internal feature files are prohibited
3. **Shared Module Independence**: Shared modules cannot import from features
4. **Unidirectional Dependencies**: Features can depend on shared modules, but not vice versa

### File Organization Rules

1. **Required Directories**: Each feature must have `components/`, `hooks/`, and `services/` directories
2. **Public API Export**: Each feature must have an `index.ts` file exporting its public API
3. **Documentation**: Each feature must have a `README.md` file
4. **Test Co-location**: Tests should be co-located with their source files

### Naming Convention Rules

1. **Components**: PascalCase (e.g., `UserProfile.tsx`)
2. **Hooks**: camelCase starting with 'use' (e.g., `useUserData.ts`)
3. **Services**: camelCase ending with 'Service' (e.g., `userService.ts`)
4. **Types**: PascalCase (e.g., `UserType.ts`)
5. **Utils**: camelCase (e.g., `dateUtils.ts`)

## Validation Commands

### Manual Validation
```bash
# Run architectural tests
npm run test:architecture

# Validate feature APIs
npm run validate:feature-api

# Run architectural linting
npm run lint:architecture

# Full structure validation
npm run validate:structure
```

### Continuous Integration
These validations run automatically:
- On every commit (pre-commit hooks)
- In CI/CD pipelines
- During build processes

## Violation Handling

### Error Types

#### Critical Errors (Build Fails)
- Circular dependencies
- Invalid import paths
- Missing required files
- Architectural boundary violations

#### Warnings (Build Continues)
- Missing documentation
- Naming convention violations
- Missing type exports
- Suboptimal organization

### Resolution Strategies

#### Import Violations
```typescript
// ❌ Wrong: Direct feature import
import { UserService } from '@/features/users/services/userService';

// ✅ Correct: Public API import
import { UserService } from '@/features/users';
```

#### Circular Dependencies
```typescript
// ❌ Wrong: Circular dependency
// fileA.ts imports fileB.ts
// fileB.ts imports fileA.ts

// ✅ Correct: Extract shared logic
// Create shared utility or move logic to appropriate layer
```

#### Missing Public API
```typescript
// ✅ Feature index.ts should export public API
export { UserProfile } from './components/UserProfile';
export { useUserData } from './hooks/useUserData';
export { userService } from './services/userService';
export type { User, UserPreferences } from './types';
```

## Monitoring and Maintenance

### Regular Audits
- Weekly architectural health checks
- Monthly dependency analysis
- Quarterly architecture reviews

### Metrics Tracking
- Import violation frequency
- Circular dependency detection
- Code organization compliance
- Documentation coverage

### Tool Updates
- ESLint rule refinements
- New validation patterns
- Performance optimizations
- Developer experience improvements

## Developer Guidelines

### Adding New Features
1. Create feature directory structure
2. Implement public API in `index.ts`
3. Add comprehensive `README.md`
4. Follow naming conventions
5. Run validation before committing

### Modifying Existing Features
1. Maintain public API compatibility
2. Update documentation
3. Run architectural tests
4. Validate import paths

### Working with Shared Modules
1. Keep shared modules feature-agnostic
2. Export through `index.ts` files
3. Document usage patterns
4. Avoid feature-specific dependencies

## Troubleshooting

### Common Issues

#### "Import path restricted" Error
- **Cause**: Attempting to import internal feature files directly
- **Solution**: Use feature's public API through `index.ts`

#### "Circular dependency detected" Error
- **Cause**: Two or more files importing each other
- **Solution**: Extract shared logic or restructure dependencies

#### "Missing index.ts" Error
- **Cause**: Feature directory without public API file
- **Solution**: Create `index.ts` with proper exports

### Debug Commands
```bash
# Check import paths
npx eslint src/ --ext .ts,.tsx --rule 'import/no-restricted-paths: error'

# Analyze dependencies
npm run analyze:deps

# Validate structure
npm run test:architecture -- --verbose
```

## Future Enhancements

### Planned Improvements
- Automated dependency graph visualization
- Performance impact analysis
- Advanced circular dependency detection
- Integration with IDE extensions

### Tool Integrations
- VS Code extension for real-time validation
- GitHub Actions for automated checks
- Dependency analysis dashboards
- Architecture decision tracking