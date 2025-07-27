# Technology Stack & Build System

## Frontend Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.3+ with HMR and fast refresh
- **Styling**: TailwindCSS 3.0+ with custom design system
- **State Management**: React Context + TanStack Query for server state
- **Routing**: React Router DOM 7.6+
- **Authentication**: Clerk with Supabase integration
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Real-time**: Supabase real-time subscriptions + WebSocket integration

## Key Libraries

- **UI Components**: Headless UI, Heroicons, Lucide React
- **Charts**: Chart.js with React wrapper, Recharts
- **PDF Generation**: jsPDF with autoTable plugin
- **Forms**: React Hook Form with validation
- **Internationalization**: i18next with browser language detection
- **Date Handling**: date-fns
- **Animations**: Framer Motion
- **Error Monitoring**: Sentry with source maps
- **Testing**: Jest + React Testing Library + Playwright

## Development Tools

- **Linting**: ESLint 9+ with TypeScript and React plugins
- **Formatting**: Prettier with consistent configuration
- **Type Checking**: TypeScript with strict mode enabled
- **Git Hooks**: Husky with lint-staged for pre-commit checks
- **Package Manager**: npm with workspaces support

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build           # Production build with TypeScript compilation
npm run preview         # Preview production build locally

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run playwright:test # Run E2E tests

# Project Management
npm run install-all     # Install all dependencies (root + web-app)
npm run clean          # Clean and reinstall dependencies
```

## Build Configuration

- **Vite Config**: Optimized chunks, Sentry integration, path aliases
- **TypeScript**: Strict mode with path mapping for clean imports
- **Tailwind**: Custom design system with extended colors and animations
- **Bundle Optimization**: Manual chunks for vendor libraries and feature modules