# Project Structure & Organization

## Root Level Structure

```
nexa-manager/
├── web-app/           # Main React application
├── docs/              # Project documentation
├── scripts/           # Utility scripts (i18n audit, fixes)
├── reports/           # Generated audit and analysis reports
├── .kiro/             # Kiro AI assistant configuration
├── .taskmaster/       # Task management integration
└── package.json       # Workspace configuration
```

## Web App Structure (`web-app/src/`)

### Core Directories

- **`components/`** - React components organized by feature
  - `analytics/` - Dashboard and reporting components
  - `auth/` - Authentication related components
  - `clients/` - CRM and client management
  - `financial/` - Invoice, quote, expense components
  - `calendar/` - Event and scheduling components
  - `common/` - Shared UI components
  - `ui/` - Base UI component library

- **`pages/`** - Top-level route components
- **`hooks/`** - Custom React hooks for business logic
- **`lib/`** - Service layer and business logic
- **`context/`** - React Context providers
- **`utils/`** - Pure utility functions
- **`types/`** - TypeScript type definitions

### Configuration & Setup

- **`config/`** - Application configuration (performance, websocket)
- **`providers/`** - React providers (Query, WebSocket)
- **`router/`** - Routing configuration and guards
- **`i18n/`** - Internationalization setup
- **`assets/`** - Static assets (images, logos)

### Testing & Quality

- **`__tests__/`** - Test files organized by type
  - `accessibility/` - A11y tests
  - `e2e/` - End-to-end tests
  - `performance/` - Performance tests
  - `utils/` - Test utilities

## Path Aliases

Use these TypeScript path aliases for clean imports:

```typescript
@/           -> src/
@components/ -> src/components/
@lib/        -> src/lib/
@utils/      -> src/utils/
@pages/      -> src/pages/
@hooks/      -> src/hooks/
@context/    -> src/context/
@types/      -> src/types/
@services/   -> src/services/
@assets/     -> src/assets/
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `ClientModal.jsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useClients.js`)
- **Services**: camelCase ending with `Service` (e.g., `clientService.js`)
- **Utils**: camelCase (e.g., `dateUtils.js`)
- **Types**: PascalCase (e.g., `ClientTypes.ts`)
- **Pages**: PascalCase (e.g., `Dashboard.jsx`)

## Component Organization

- Group related components in feature folders
- Keep shared/reusable components in `common/` or `ui/`
- Co-locate component-specific hooks and utilities
- Use index files for clean exports from feature folders

## Service Layer Pattern

- Business logic lives in `lib/` services
- Services handle API calls, data transformation, and business rules
- Components consume services through custom hooks
- Maintain separation between UI and business logic