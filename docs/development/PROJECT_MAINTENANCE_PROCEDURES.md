# Project Maintenance Procedures

## Overview

This document outlines the maintenance procedures for the Nexa Manager project following the feature-based reorganization. These procedures ensure the project structure remains clean, consistent, and maintainable over time.

## Daily Maintenance

### Code Quality Checks
```bash
# Run before committing code
npm run lint:fix
npm run format
npm run type-check
```

### Test Validation
```bash
# Run relevant tests for changed features
npm run test:auth        # For auth changes
npm run test:clients     # For client changes
npm run test:financial   # For financial changes
# etc.
```

### Import Path Validation
- Use path aliases instead of relative imports
- Follow the established patterns:
  - `@/` for src root
  - `@features/` for feature modules
  - `@shared/` for shared resources
  - `@lib/` for library code
  - `@utils/` for utilities

## Weekly Maintenance

### Architecture Validation
```bash
# Run architectural tests
npm run test:architecture

# Validate feature APIs
npm run validate:feature-api

# Check for circular dependencies
npm run lint:architecture
```

### Performance Monitoring
```bash
# Check bundle sizes
npm run build
npm run monitor:performance

# Validate build output
npm run validate:build
```

### Dependency Cleanup
```bash
# Check for unused dependencies
npx depcheck

# Update dependencies (carefully)
npm audit
npm update
```

## Monthly Maintenance

### Comprehensive Health Check
```bash
# Full test suite
npm run test:coverage

# Full build validation
npm run audit:full

# Performance and accessibility audit
npm run audit:reports
```

### Documentation Review
- Update README files for modified features
- Review and update API documentation
- Check that new features have proper documentation
- Validate code examples in documentation

### Structure Validation
- Review new files for proper placement
- Check that feature boundaries are maintained
- Validate that shared resources are properly organized
- Ensure no feature-to-feature direct dependencies

## Adding New Features

### 1. Feature Planning
Before creating a new feature:
- Determine if it belongs in an existing feature or needs a new one
- Plan the feature's public API
- Identify shared dependencies
- Consider impact on existing features

### 2. Feature Structure Creation
```bash
# Create feature directory structure
mkdir -p src/features/new-feature/{components,hooks,services,types,utils,styles,__tests__}

# Create feature index file
touch src/features/new-feature/index.ts
touch src/features/new-feature/README.md
```

### 3. Feature Implementation Guidelines

#### Directory Structure
```
src/features/new-feature/
├── components/           # Feature-specific components
│   ├── ComponentName.tsx
│   └── __tests__/
├── hooks/               # Feature-specific hooks
│   ├── useFeatureHook.ts
│   └── __tests__/
├── services/            # Feature business logic
│   ├── featureService.ts
│   └── __tests__/
├── types/               # Feature type definitions
│   └── index.ts
├── utils/               # Feature utilities
│   └── featureUtils.ts
├── styles/              # Feature-specific styles
│   └── feature.module.css
├── __tests__/           # Integration tests
├── index.ts             # Public API exports
└── README.md            # Feature documentation
```

#### Public API Export Pattern
```typescript
// src/features/new-feature/index.ts
export { default as MainComponent } from './components/MainComponent';
export { useFeatureHook } from './hooks/useFeatureHook';
export { featureService } from './services/featureService';
export type { FeatureType } from './types';
```

#### Component Guidelines
- Use PascalCase for component names
- Co-locate tests with components
- Use TypeScript for new components
- Follow existing styling patterns

#### Service Guidelines
- Use camelCase with Service suffix
- Implement consistent error handling
- Use TypeScript interfaces
- Include comprehensive tests

### 4. Integration Steps
1. Add feature to main feature index if needed
2. Update routing configuration
3. Add feature-specific tests
4. Update documentation
5. Add to CI/CD pipeline if needed

## Monitoring Architectural Rules

### Automated Checks

#### ESLint Rules for Architecture
```javascript
// .config/eslint/eslint.config.js
rules: {
  'import/no-restricted-paths': [
    'error',
    {
      zones: [
        // Prevent direct feature-to-feature imports
        {
          target: './src/features/*/!(index.ts)',
          from: './src/features/*/!(components|hooks|services|types|utils)/**',
          message: 'Use feature public API through index.ts'
        },
        // Prevent deep imports into shared modules
        {
          target: './src/shared/*/!(index.ts)',
          from: './src/features/**',
          message: 'Use shared module public API'
        }
      ]
    }
  ]
}
```

#### Pre-commit Hooks
```json
// package.json
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
```

### Manual Review Checklist

#### Code Review Checklist
- [ ] New code follows feature-based organization
- [ ] Imports use proper path aliases
- [ ] No direct feature-to-feature dependencies
- [ ] Shared code is properly placed
- [ ] Tests are co-located with code
- [ ] Public APIs are properly exported
- [ ] Documentation is updated

#### Architecture Review (Monthly)
- [ ] Feature boundaries are maintained
- [ ] Shared resources are not duplicated
- [ ] No circular dependencies exist
- [ ] Bundle sizes are reasonable
- [ ] Performance metrics are acceptable

## Periodic Structure Health Checks

### Automated Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

echo "🏥 Running Project Structure Health Check..."

# Check for architectural violations
echo "📐 Checking architecture..."
npm run test:architecture

# Validate feature APIs
echo "🔌 Validating feature APIs..."
npm run validate:feature-api

# Check for unused files
echo "🗑️  Checking for unused files..."
npx unimported

# Check bundle sizes
echo "📦 Checking bundle sizes..."
npm run build
npm run monitor:performance

# Check for security vulnerabilities
echo "🔒 Security audit..."
npm audit

# Check for outdated dependencies
echo "📅 Checking dependencies..."
npm outdated

echo "✅ Health check complete!"
```

### Health Check Schedule
- **Daily**: Automated via CI/CD on commits
- **Weekly**: Manual run by team lead
- **Monthly**: Comprehensive review with team

### Health Metrics to Monitor

#### Code Quality Metrics
- Test coverage percentage
- ESLint violations count
- TypeScript errors count
- Bundle size trends

#### Architecture Metrics
- Feature coupling score
- Circular dependency count
- Import path compliance
- API surface area

#### Performance Metrics
- Build time trends
- Bundle size by feature
- Development server startup time
- Hot reload performance

## Troubleshooting Common Issues

### Import Resolution Issues
```bash
# Clear module cache
rm -rf node_modules/.cache
npm run dev
```

### Build Failures
```bash
# Clean build
rm -rf dist
npm run build

# Check for missing dependencies
npm run validate:build
```

### Test Failures
```bash
# Clear Jest cache
npm run test:clear-cache

# Run specific feature tests
npm run test:feature-name
```

### Performance Issues
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist

# Check for large dependencies
npx webpack-bundle-analyzer dist/assets/*.js
```

## Emergency Procedures

### Rollback Process
1. Identify the problematic commit
2. Create a rollback branch
3. Revert the changes
4. Run full test suite
5. Deploy if tests pass

### Critical Issue Response
1. **Immediate**: Stop deployments
2. **Assessment**: Identify scope of impact
3. **Communication**: Notify team and stakeholders
4. **Resolution**: Apply fix or rollback
5. **Validation**: Run comprehensive tests
6. **Post-mortem**: Document lessons learned

## Documentation Maintenance

### Feature Documentation
- Each feature must have a README.md
- API documentation must be kept current
- Examples should be tested and working
- Migration guides for breaking changes

### Architecture Documentation
- Keep architecture diagrams updated
- Document architectural decisions (ADRs)
- Maintain dependency graphs
- Update onboarding documentation

## Team Responsibilities

### Developers
- Follow established patterns
- Run pre-commit checks
- Write tests for new code
- Update documentation

### Team Leads
- Review architectural changes
- Monitor health metrics
- Conduct periodic reviews
- Enforce standards

### DevOps
- Maintain CI/CD pipelines
- Monitor build performance
- Manage dependency updates
- Ensure security compliance

## Tools and Scripts

### Available Scripts
```bash
# Development
npm run dev                    # Start development server
npm run build                  # Production build
npm run preview               # Preview production build

# Quality
npm run lint                  # Run ESLint
npm run lint:fix             # Fix ESLint issues
npm run format               # Format with Prettier
npm run type-check           # TypeScript checking

# Testing
npm run test                 # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:feature-name   # Feature-specific tests

# Validation
npm run validate:build      # Validate build process
npm run validate:feature-api # Validate feature APIs
npm run test:architecture   # Architecture tests

# Monitoring
npm run monitor:performance # Performance monitoring
npm run monitor:errors     # Error monitoring
npm run audit:full         # Full audit
```

### Custom Tools
- Feature API validator
- Bundle size monitor
- Import path checker
- Architecture validator

This maintenance framework ensures the project structure remains healthy and continues to support efficient development as the codebase grows.