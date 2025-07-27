# File Naming Conventions

## Overview

This document defines the file naming conventions used throughout the Nexa Manager project to ensure consistency, readability, and maintainability.

## General Principles

1. **Consistency**: Use the same naming pattern for similar file types
2. **Descriptive**: Names should clearly indicate the file's purpose
3. **Searchable**: Names should be easy to find and filter
4. **Case Sensitivity**: Follow established case conventions for each file type

## File Type Conventions

### React Components

#### Component Files
- **Convention**: PascalCase
- **Extension**: `.tsx` for TypeScript, `.jsx` for JavaScript
- **Examples**:
  - `UserProfile.tsx`
  - `ClientModal.tsx`
  - `InvoiceForm.tsx`
  - `EmailComposer.tsx`

#### Component Test Files
- **Convention**: Same as component + `.test`
- **Extension**: `.test.tsx` or `.test.jsx`
- **Examples**:
  - `UserProfile.test.tsx`
  - `ClientModal.test.jsx`
  - `InvoiceForm.test.tsx`

#### Component Story Files (Storybook)
- **Convention**: Same as component + `.stories`
- **Extension**: `.stories.tsx` or `.stories.jsx`
- **Examples**:
  - `UserProfile.stories.tsx`
  - `Button.stories.jsx`

### Custom Hooks

#### Hook Files
- **Convention**: camelCase starting with 'use'
- **Extension**: `.ts` for TypeScript, `.js` for JavaScript
- **Examples**:
  - `useAuth.ts`
  - `useClients.js`
  - `useEmailComposer.ts`
  - `useLocalStorage.js`

#### Hook Test Files
- **Convention**: Same as hook + `.test`
- **Examples**:
  - `useAuth.test.ts`
  - `useClients.test.js`

### Services

#### Service Files
- **Convention**: camelCase ending with 'Service'
- **Extension**: `.ts` for TypeScript, `.js` for JavaScript
- **Examples**:
  - `authService.ts`
  - `clientService.js`
  - `emailService.ts`
  - `invoiceService.js`

#### Alternative Service Naming
- **Convention**: camelCase without 'Service' suffix (for shorter names)
- **Examples**:
  - `api.ts`
  - `storage.js`
  - `validation.ts`

#### Service Test Files
- **Convention**: Same as service + `.test`
- **Examples**:
  - `authService.test.ts`
  - `clientService.test.js`

### Type Definitions

#### Type Files
- **Convention**: PascalCase ending with 'Types' or descriptive name
- **Extension**: `.ts` (TypeScript only)
- **Examples**:
  - `UserTypes.ts`
  - `ClientTypes.ts`
  - `ApiTypes.ts`
  - `CommonTypes.ts`

#### Interface Files
- **Convention**: PascalCase, descriptive name
- **Examples**:
  - `ApiInterfaces.ts`
  - `ComponentProps.ts`
  - `ServiceContracts.ts`

### Utility Functions

#### Utility Files
- **Convention**: camelCase ending with 'Utils' or descriptive name
- **Extension**: `.ts` for TypeScript, `.js` for JavaScript
- **Examples**:
  - `dateUtils.ts`
  - `stringUtils.js`
  - `validationUtils.ts`
  - `formatters.js`

#### Utility Test Files
- **Convention**: Same as utility + `.test`
- **Examples**:
  - `dateUtils.test.ts`
  - `stringUtils.test.js`

### Constants

#### Constant Files
- **Convention**: camelCase or UPPER_CASE
- **Extension**: `.ts` for TypeScript, `.js` for JavaScript
- **Examples**:
  - `apiConstants.ts`
  - `uiConstants.js`
  - `CONFIG.ts`
  - `ROUTES.js`

### Configuration Files

#### Application Config
- **Convention**: camelCase + 'Config'
- **Examples**:
  - `appConfig.ts`
  - `databaseConfig.js`
  - `emailConfig.ts`

#### Tool Configuration
- **Convention**: Tool name + '.config'
- **Examples**:
  - `vite.config.ts`
  - `tailwind.config.js`
  - `jest.config.cjs`
  - `eslint.config.js`

### Pages/Routes

#### Page Components
- **Convention**: PascalCase
- **Extension**: `.tsx` or `.jsx`
- **Examples**:
  - `Dashboard.tsx`
  - `ClientList.jsx`
  - `InvoiceDetail.tsx`
  - `Settings.jsx`

### Styles

#### CSS Files
- **Convention**: kebab-case
- **Extension**: `.css`
- **Examples**:
  - `global-styles.css`
  - `component-styles.css`
  - `theme-variables.css`

#### CSS Module Files
- **Convention**: Component name + '.module.css'
- **Examples**:
  - `UserProfile.module.css`
  - `Button.module.css`

#### Styled Components
- **Convention**: PascalCase + 'Styled'
- **Examples**:
  - `ButtonStyled.ts`
  - `ModalStyled.js`

### Test Files

#### Unit Test Files
- **Convention**: Source file name + `.test`
- **Examples**:
  - `userService.test.ts`
  - `Button.test.tsx`

#### Integration Test Files
- **Convention**: Descriptive name + `.integration.test`
- **Examples**:
  - `userAuth.integration.test.ts`
  - `clientCrud.integration.test.js`

#### End-to-End Test Files
- **Convention**: Descriptive name + `.e2e.test`
- **Examples**:
  - `userLogin.e2e.test.ts`
  - `invoiceCreation.e2e.test.js`

#### Test Utility Files
- **Convention**: Descriptive name + 'TestUtils'
- **Examples**:
  - `renderTestUtils.ts`
  - `mockTestUtils.js`
  - `apiTestUtils.ts`

### Documentation

#### README Files
- **Convention**: UPPERCASE
- **Examples**:
  - `README.md`
  - `README.txt`

#### Documentation Files
- **Convention**: kebab-case
- **Examples**:
  - `api-documentation.md`
  - `deployment-guide.md`
  - `architecture-decisions.md`

### Assets

#### Images
- **Convention**: kebab-case
- **Examples**:
  - `company-logo.png`
  - `user-avatar-placeholder.jpg`
  - `invoice-template-preview.svg`

#### Icons
- **Convention**: kebab-case
- **Examples**:
  - `chevron-down.svg`
  - `user-circle.svg`
  - `email-icon.png`

## Directory-Specific Conventions

### Feature Directories
- **Convention**: kebab-case
- **Examples**:
  - `user-management/`
  - `email-campaigns/`
  - `financial-reports/`

### Component Directories
- **Convention**: PascalCase (matching component name)
- **Examples**:
  - `UserProfile/`
  - `EmailComposer/`
  - `InvoiceModal/`

### Shared Directories
- **Convention**: camelCase or kebab-case
- **Examples**:
  - `components/`
  - `utils/`
  - `shared-services/`

## Special Cases

### Index Files
- **Convention**: Always lowercase 'index'
- **Extension**: `.ts`, `.js`, `.tsx`, `.jsx`
- **Examples**:
  - `index.ts` (for public API exports)
  - `index.tsx` (for component re-exports)

### Environment Files
- **Convention**: Dot prefix + environment name
- **Examples**:
  - `.env`
  - `.env.development`
  - `.env.production`
  - `.env.local`

### Configuration Dot Files
- **Convention**: Dot prefix + tool name
- **Examples**:
  - `.eslintrc.js`
  - `.prettierrc`
  - `.gitignore`
  - `.nvmrc`

### Barrel Exports
- **Convention**: 'index' files for re-exporting
- **Purpose**: Create clean public APIs
- **Examples**:
  ```typescript
  // features/auth/index.ts
  export { LoginForm } from './components/LoginForm';
  export { useAuth } from './hooks/useAuth';
  export { authService } from './services/authService';
  ```

## Validation

### Automated Checks

#### ESLint Rules
```javascript
// File naming validation through custom ESLint rules
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'interface',
    format: ['PascalCase']
  },
  {
    selector: 'typeAlias',
    format: ['PascalCase']
  }
]
```

#### File Structure Tests
```javascript
// Automated tests validate naming conventions
describe('File Naming Conventions', () => {
  test('component files should use PascalCase', () => {
    // Test implementation
  });
  
  test('hook files should start with "use"', () => {
    // Test implementation
  });
});
```

### Manual Review Checklist

Before committing code, verify:

- [ ] Component files use PascalCase
- [ ] Hook files start with 'use' and use camelCase
- [ ] Service files use camelCase (with or without 'Service' suffix)
- [ ] Type files use PascalCase
- [ ] Utility files use camelCase
- [ ] Test files follow source file naming + '.test'
- [ ] Constants use appropriate case (camelCase or UPPER_CASE)

## Migration Guidelines

### Renaming Existing Files

1. **Update file name** following conventions
2. **Update all imports** referencing the file
3. **Update test files** to match new naming
4. **Update documentation** mentioning the file
5. **Run tests** to ensure nothing is broken

### Batch Renaming Script
```bash
# Example script for renaming files
#!/bin/bash
find src/ -name "*.tsx" -exec rename 's/([a-z])([A-Z])/$1$2/g' {} \;
```

## Examples by Feature

### Authentication Feature
```
features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── LoginForm.test.tsx
│   ├── SignupModal.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   └── useAuthGuard.ts
├── services/
│   ├── authService.ts
│   ├── authService.test.ts
│   └── securityService.ts
├── types/
│   ├── AuthTypes.ts
│   └── UserTypes.ts
├── utils/
│   ├── authUtils.ts
│   └── tokenUtils.ts
└── index.ts
```

### Shared Components
```
shared/components/
├── ui/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.stories.tsx
│   ├── Modal.tsx
│   └── Input.tsx
├── forms/
│   ├── FormField.tsx
│   ├── FormValidation.tsx
│   └── FormUtils.ts
└── index.ts
```

## Best Practices

### Do's
- ✅ Use consistent casing for each file type
- ✅ Make names descriptive and searchable
- ✅ Follow established patterns in the codebase
- ✅ Use appropriate file extensions
- ✅ Group related files in directories

### Don'ts
- ❌ Mix naming conventions within the same file type
- ❌ Use abbreviations unless they're widely understood
- ❌ Create overly long file names
- ❌ Use special characters except hyphens and underscores
- ❌ Ignore existing patterns in the codebase

### Tips
- Use your IDE's file search to check for similar files
- Consider how files will be sorted alphabetically
- Think about how files will appear in import statements
- Use descriptive names that indicate the file's purpose
- Be consistent with team conventions