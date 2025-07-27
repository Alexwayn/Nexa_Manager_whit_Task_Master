# Build and Deployment Guide

## Overview

This guide covers the build and deployment process for Nexa Manager, including configuration updates for the new feature-based architecture, build optimization, and deployment validation.

## Build Configuration

### Vite Configuration Updates

The Vite configuration has been updated to support the new feature-based structure:

#### Path Aliases
```typescript
// vite.config.ts
resolve: {
  alias: {
    // Base paths
    '@': path.resolve(__dirname, './src'),
    
    // Feature-based structure
    '@/features': path.resolve(__dirname, './src/features'),
    '@/shared': path.resolve(__dirname, './src/shared'),
    '@/pages': path.resolve(__dirname, './src/pages'),
    
    // Shared module aliases
    '@/shared/components': path.resolve(__dirname, './src/shared/components'),
    '@/shared/hooks': path.resolve(__dirname, './src/shared/hooks'),
    '@/shared/services': path.resolve(__dirname, './src/shared/services'),
    // ... other shared modules
  }
}
```

#### Code Splitting Strategy
The build now uses intelligent code splitting based on features:

```typescript
// Feature-based chunks
manualChunks: (id) => {
  // Vendor chunks
  if (id.includes('node_modules')) {
    if (id.includes('react')) return 'react-vendor';
    if (id.includes('chart.js')) return 'charts';
    // ... other vendor chunks
  }
  
  // Feature-based chunks
  if (id.includes('/src/features/auth/')) return 'feature-auth';
  if (id.includes('/src/features/clients/')) return 'feature-clients';
  if (id.includes('/src/features/financial/')) return 'feature-financial';
  // ... other feature chunks
  
  // Shared chunks
  if (id.includes('/src/shared/components/')) return 'shared-components';
  if (id.includes('/src/shared/services/')) return 'shared-services';
}
```

### TypeScript Configuration

Updated path mappings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/shared/components/*": ["./src/shared/components/*"],
      "@/shared/hooks/*": ["./src/shared/hooks/*"],
      "@/shared/services/*": ["./src/shared/services/*"]
    }
  }
}
```

## Build Process

### Development Build
```bash
# Start development server
npm run dev

# Type checking in watch mode
npm run type-check -- --watch
```

### Production Build
```bash
# Full production build with validation
npm run build

# Build with validation
npm run build:validate

# Preview production build
npm run preview
```

### Build Validation
```bash
# Validate build configuration and output
npm run validate:build

# Run all validations
npm run validate:structure
npm run validate:feature-api
npm run test:architecture
```

## Build Optimization

### Bundle Analysis

The build process now creates optimized chunks:

1. **Vendor Chunks**
   - `react-vendor`: React and React DOM
   - `router`: React Router
   - `ui-vendor`: UI libraries (Heroicons, Lucide)
   - `charts`: Chart.js and related libraries
   - `supabase`: Supabase client
   - `clerk`: Clerk authentication

2. **Feature Chunks**
   - `feature-auth`: Authentication feature
   - `feature-clients`: Client management
   - `feature-financial`: Financial management
   - `feature-email`: Email system
   - `feature-dashboard`: Dashboard
   - `feature-analytics`: Analytics
   - `feature-calendar`: Calendar
   - `feature-documents`: Document management
   - `feature-scanner`: Scanner functionality

3. **Shared Chunks**
   - `shared-components`: Shared UI components
   - `shared-services`: Shared services
   - `shared`: Other shared utilities

### Performance Optimizations

1. **Tree Shaking**: Unused code is automatically removed
2. **Code Splitting**: Features are loaded on demand
3. **Asset Optimization**: Images and assets are optimized
4. **Minification**: JavaScript and CSS are minified
5. **Source Maps**: Generated for debugging (production)

## Deployment Configurations

### Environment Variables

Required environment variables for deployment:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Sentry (Optional)
VITE_SENTRY_DSN=https://...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token

# Application
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Nexa Manager
```

### AWS Amplify Configuration

The `amplify.yml` configuration supports the new structure:

```yaml
version: 1
applications:
  - appRoot: web-app
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
            - npm run validate:structure
            - npm run validate:feature-api
        build:
          commands:
            - npm run build
        postBuild:
          commands:
            - npm run validate:build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

### Netlify Configuration

For Netlify deployment, use `netlify.toml`:

```toml
[build]
  base = "web-app/"
  publish = "dist/"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  command = "npm run build:validate"

[context.deploy-preview]
  command = "npm run build"
```

### Vercel Configuration

For Vercel deployment, use `vercel.json`:

```json
{
  "buildCommand": "cd web-app && npm run build",
  "outputDirectory": "web-app/dist",
  "installCommand": "cd web-app && npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

Updated CI workflow includes architectural validation:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./web-app
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        cache-dependency-path: './web-app/package-lock.json'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run TypeScript type checking
      run: npm run type-check
      
    - name: Run ESLint
      run: npm run lint
      
    - name: Run architectural validation
      run: npm run test:architecture
      
    - name: Validate feature APIs
      run: npm run validate:feature-api
      
    - name: Run tests
      run: npm run test:ci
      
    - name: Build and validate
      run: npm run build:validate
```

### Deployment Validation

The deployment process includes multiple validation steps:

1. **Pre-build Validation**
   - TypeScript type checking
   - ESLint validation
   - Architectural rule compliance
   - Feature API validation

2. **Build Validation**
   - Successful build completion
   - Output file verification
   - Bundle size analysis
   - Chunk validation

3. **Post-build Validation**
   - Asset integrity check
   - Import path validation
   - Performance metrics

## Monitoring and Debugging

### Build Monitoring

Monitor build performance and issues:

```bash
# Analyze bundle size
npm run build -- --analyze

# Check build warnings
npm run build 2>&1 | grep -i warning

# Validate build output
npm run validate:build
```

### Debug Build Issues

Common debugging commands:

```bash
# Clear build cache
rm -rf dist/ node_modules/.vite/

# Rebuild with verbose output
npm run build -- --debug

# Check TypeScript issues
npm run type-check

# Validate project structure
npm run validate:structure
```

### Performance Analysis

Analyze build and runtime performance:

1. **Bundle Analysis**
   ```bash
   # Generate bundle analysis
   npm run build -- --analyze
   
   # Check chunk sizes
   ls -la dist/assets/
   ```

2. **Runtime Performance**
   - Use browser dev tools
   - Monitor Core Web Vitals
   - Check network waterfall

3. **Build Performance**
   ```bash
   # Time the build process
   time npm run build
   
   # Profile build steps
   npm run build -- --profile
   ```

## Troubleshooting

### Common Build Issues

#### Import Path Errors
```
Error: Cannot resolve module '@/features/...'
```
**Solution**: Check Vite and TypeScript path configurations

#### Chunk Loading Errors
```
Error: Loading chunk failed
```
**Solution**: Verify chunk configuration and network connectivity

#### TypeScript Errors
```
Error: Type checking failed
```
**Solution**: Run `npm run type-check` and fix type issues

#### Bundle Size Warnings
```
Warning: Chunk size exceeds recommended limit
```
**Solution**: Review chunk splitting configuration

### Debug Commands

```bash
# Full validation suite
npm run validate:structure
npm run validate:feature-api
npm run test:architecture
npm run validate:build

# Build debugging
npm run build -- --debug
npm run type-check
npm run lint

# Clean and rebuild
rm -rf dist/ node_modules/.vite/
npm run build
```

## Best Practices

### Build Optimization
- Use feature-based code splitting
- Optimize vendor chunks
- Monitor bundle sizes
- Enable tree shaking

### Deployment Safety
- Always validate before deployment
- Use staging environments
- Monitor deployment metrics
- Have rollback procedures

### Performance Monitoring
- Track Core Web Vitals
- Monitor bundle sizes
- Analyze loading performance
- Use performance budgets

### Security
- Validate environment variables
- Use secure build processes
- Monitor for vulnerabilities
- Keep dependencies updated

## Migration Guide

### From Old Structure

If migrating from the old structure:

1. **Update Import Paths**
   ```typescript
   // Old
   import { Button } from '@components/ui/Button';
   
   // New
   import { Button } from '@/shared/components/ui';
   ```

2. **Update Build Configuration**
   - Update Vite path aliases
   - Update TypeScript paths
   - Update chunk configuration

3. **Validate Migration**
   ```bash
   npm run validate:structure
   npm run validate:build
   npm run test:architecture
   ```

### Gradual Migration

For gradual migration:

1. Keep legacy aliases temporarily
2. Update imports incrementally
3. Remove legacy aliases after migration
4. Validate at each step

## Future Enhancements

### Planned Improvements
- Advanced bundle analysis
- Performance budgets
- Automated optimization
- Enhanced monitoring

### Tool Integrations
- Bundle analyzer integration
- Performance monitoring
- Error tracking
- Deployment notifications