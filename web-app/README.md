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
- 📄 **Document Scanner** - Advanced AI-powered document digitization with multi-provider OCR architecture, intelligent fallback systems, and comprehensive Supabase-integrated document management
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
│   ├── scanner/       # Document scanner components
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
│   ├── email.ts       # Email system types
│   └── scanner.ts     # Document scanner types
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

# OCR Provider Configuration (Optional)
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_QWEN_API_KEY=your_qwen_api_key

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

### Authentication & Authorization
- **Clerk Integration**: Secure authentication with JWT tokens
- **Organization-based Access**: Multi-tenant security with organization isolation
- **Role-based Permissions**: Admin, basic member, and custom role support
- **Protected Routes**: Comprehensive route protection with fallback handling

### Database Security
- **Row Level Security (RLS)**: Enabled on all database tables
- **User Data Isolation**: Users can only access their own data
- **Encrypted Storage**: Sensitive data encrypted at rest
- **Secure Connections**: All database connections use SSL/TLS

### Application Security
- **Input Validation**: Comprehensive sanitization and validation
- **HTTPS Enforcement**: Secure connections in production
- **Content Security Policy**: CSP headers for XSS protection
- **Environment Variables**: Sensitive configuration stored securely

## 📄 Document Scanner System

### Overview
The document scanner system provides AI-powered document digitization capabilities with a complete user interface and advanced OCR architecture:

- **Camera Capture**: Real-time camera access with document edge detection guides and capture preview
- **File Upload**: Drag-and-drop interface supporting JPG, PNG, and PDF files (up to 10MB)
- **Advanced AI-Powered OCR**: Multi-provider architecture with intelligent fallback systems
  - **OpenAI Vision API**: GPT-4 Vision with high accuracy and table detection
  - **Qwen OCR API**: Cost-effective alternative with competitive performance
  - **Intelligent Fallback**: Automatic provider switching and degradation strategies
  - **Rate Limiting**: Per-provider quota management and request throttling
  - **Error Recovery**: Comprehensive retry logic with exponential backoff
- **Image Processing**: Automatic enhancement, edge detection, and document optimization
- **Comprehensive Document Storage**: Full Supabase integration with PostgreSQL backend
  - **Multi-file Management**: Original, enhanced, and PDF versions with automatic bucket management
  - **Advanced Search**: Full-text search across document content with metadata filtering
  - **Access Control**: Row Level Security (RLS) with complete user data isolation
  - **Audit Trails**: Complete access logging and activity tracking
  - **Statistics & Analytics**: Document usage metrics and storage analytics
  - **Temporary Storage**: Secure temporary file handling with automatic cleanup
- **Real-time Processing**: Live status updates during image processing, OCR, and document saving
- **Error Handling**: Comprehensive error management with user-friendly feedback and recovery
- **Business Integration**: Direct integration with client records and project management

### TypeScript Interfaces

The scanner system uses comprehensive TypeScript interfaces located in `src/types/scanner.ts`:

#### Core Types
- `ProcessedDocument` - Main document entity with metadata and processing results
- `OCRResult` - OCR processing results with confidence scores and structured data
- `OCRProvider` - Enumeration of available OCR service providers
- `SharingSettings` - Document sharing configuration and access control
- `DocumentStatus` - Processing status tracking

#### Services
- `CameraService` - Camera access and image capture functionality
- `FileUploadService` - File validation and processing
- `ImageProcessingService` - Image enhancement and document optimization
- `AIOCRService` - AI-powered text extraction with multiple providers
- `DocumentStorageService` - Document persistence and retrieval

#### Configuration
- `ScannerConfig` - Feature configuration and provider settings
- `OCRProviderConfig` - Provider-specific API configuration
- `ImageProcessingConfig` - Image processing parameters

### Implementation Status

✅ **Project Structure** - Complete
- Directory structure and component exports
- TypeScript interfaces and service definitions
- Configuration scaffolding

✅ **Scanner UI Components** - Complete
- ScannerPage with tabbed interface (camera/upload)
- Real-time processing status indicators
- Comprehensive error handling with user feedback
- Document preview and review workflow
- Integration with useScanner hook for state management

✅ **AI OCR Service Architecture** - Complete
- Multi-provider OCR factory with OpenAI Vision and Qwen integration
- Intelligent fallback service with degradation strategies
- Comprehensive error handling and retry mechanisms
- Real-time provider status monitoring and health checks

✅ **Document Storage & Management** - Complete
- Full Supabase integration with PostgreSQL backend
- Multi-bucket storage for permanent and temporary files
- Advanced search and filtering with full-text capabilities
- Access logging and audit trails with RLS security
- Statistics and analytics with storage optimization

🔄 **In Development**
- CameraCapture, FileUpload, and DocumentPreview component implementations
- Image processing service implementation
- Error handling and optimization

### 🚨 Current Security Status
- ✅ Authentication bypass system completely removed from all route protection
- ✅ Both `ProtectedRoute` and `OrganizationProtectedRoute` use real Clerk authentication with consistent `/login` redirects
- ✅ Development bypasses eliminated - no authentication shortcuts in any environment
- 🔄 **In Progress**: Updating remaining 20+ components to use real Clerk hooks
- ✅ RLS policies implemented and tested
- ✅ Organization-based access control active
- ✅ Secure credential management for email accounts
- ✅ Document scanner storage with comprehensive Supabase integration

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
