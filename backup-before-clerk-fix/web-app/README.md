# Nexa Manager Web Application

A comprehensive business management platform built with React 19, TypeScript, and Vite.

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.3+ with HMR and fast refresh
- **Styling**: TailwindCSS 3.0+ with custom design system
- **State Management**: React Context + TanStack Query for server state
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Clerk with Supabase integration
- **Real-time**: Supabase real-time subscriptions + WebSocket integration

### Key Features
- 📊 Real-time dashboard with analytics
- 👥 Complete CRM with client management
- 🧾 Invoice and quote generation with PDF export
- 📅 Calendar and event management
- 📧 **Email Management System** - Full-featured email client with IMAP/SMTP support
- 📈 Advanced reporting and analytics
- 🌍 Multi-language support (Italian/English)
- 🔐 Secure authentication with MFA

## 📧 Email Management System

### Overview
The email management system provides a complete email client integrated with business operations:

- **Email Accounts**: Support for multiple IMAP/SMTP accounts
- **Folders & Labels**: Organize emails with custom folders and labels
- **Templates**: Business email templates with variable substitution
- **Search & Filtering**: Advanced search across email content and metadata
- **Business Integration**: Direct integration with invoices, quotes, and client communications
- **Real-time Sync**: Background synchronization with email providers
- **Security**: Encrypted storage and secure credential management

### TypeScript Interfaces

The email system uses comprehensive TypeScript interfaces located in `src/types/email.ts`:

#### Core Types
- `Email` - Main email entity with full metadata
- `EmailFolder` - Folder organization structure
- `EmailTemplate` - Template system with variables
- `EmailAccount` - IMAP/SMTP account configuration
- `EmailAttachment` - File attachment handling

#### Composition & Search
- `EmailComposition` - Email creation and sending
- `EmailSearchFilters` - Advanced filtering options
- `EmailThread` - Conversation threading
- `EmailStatistics` - Analytics and reporting

#### Configuration
- `EmailProviderConfig` - Provider-specific settings
- `EmailNotificationSettings` - User notification preferences
- `EmailRule` - Automated email organization rules

### Database Schema

Email data is stored in Supabase with the following tables:
- `emails` - Email messages and metadata
- `email_folders` - Folder organization
- `email_templates` - Template management
- `email_accounts` - Account configurations
- `email_attachments` - File attachments
- `email_labels` - Labeling system
- `email_rules` - Automation rules
- `email_sync_status` - Synchronization tracking

All tables include Row Level Security (RLS) policies for data protection.

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account

### Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev              # Start dev server (port 3000)
npm run build           # Production build with TypeScript compilation
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run playwright:test # Run E2E tests
```

### Project Structure
```
src/
├── components/         # React components by feature
│   ├── email/         # Email management components
│   ├── analytics/     # Dashboard and reporting
│   ├── clients/       # CRM components
│   ├── financial/     # Invoice/quote components
│   └── common/        # Shared UI components
├── pages/             # Route components
├── hooks/             # Custom React hooks
├── lib/               # Service layer and business logic
├── context/           # React Context providers
├── types/             # TypeScript definitions
│   ├── api.ts         # Base API types
│   └── email.ts       # Email system types
├── utils/             # Utility functions
└── config/            # Application configuration
```

### Path Aliases
```typescript
@/           -> src/
@components/ -> src/components/
@lib/        -> src/lib/
@utils/      -> src/utils/
@types/      -> src/types/
@hooks/      -> src/hooks/
```

## 🔧 Configuration

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Email Configuration (Optional)
VITE_EMAIL_ENCRYPTION_KEY=your_encryption_key
VITE_EMAIL_STORAGE_BUCKET=email-attachments
```

### Build Configuration
- **Vite**: Optimized chunks, Sentry integration, path aliases
- **TypeScript**: Strict mode with path mapping
- **Tailwind**: Custom design system with extended colors
- **Bundle Optimization**: Manual chunks for vendor libraries

## 📚 Documentation

- [Email System Documentation](docs/EMAIL_SYSTEM.md)
- [API Documentation](docs/reports/API.md)
- [Architecture Decision Records](docs/adr/)
- [Setup Guides](docs/)

## 🧪 Testing

### Test Structure
```
__tests__/
├── components/        # Component tests
├── hooks/            # Hook tests
├── services/         # Service layer tests
├── utils/            # Utility tests
└── e2e/              # End-to-end tests
```

### Testing Libraries
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Jest coverage reports
- **Accessibility**: @testing-library/jest-dom

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Encrypted email credential storage
- Secure authentication with Clerk
- Input validation and sanitization
- HTTPS enforcement in production
- Content Security Policy (CSP) headers

## 🌍 Internationalization

Supported languages:
- 🇮🇹 Italian (default)
- 🇬🇧 English

Translation files: `public/locales/{lang}/`

## 📈 Performance

- Virtual scrolling for large email lists
- Lazy loading of email content
- Background email synchronization
- Optimized bundle splitting
- Service worker for offline support
- Real-time updates with minimal re-renders

---

For detailed documentation, see the [docs/](docs/) directory.
