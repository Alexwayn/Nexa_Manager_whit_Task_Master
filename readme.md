# 🚀 Nexa Manager

A comprehensive business management platform built with React, Vite, and Supabase.

## ✨ Features

- 📊 **Dashboard** - Real-time business analytics and insights
- 👥 **Client Management** - Complete CRM functionality with detailed profiles
- 🧾 **Invoice & Quotes** - Professional billing system with PDF generation
- 📅 **Calendar** - Event and appointment management
- 📧 **Email Management** - Integrated email system with templates, IMAP/SMTP support, and business document integration
- 📄 **Document Scanner** - Advanced AI-powered document digitization with multi-provider OCR architecture, intelligent fallback systems, comprehensive batch processing capabilities, camera capture, file upload, comprehensive Supabase-integrated document management with full-text search, metadata tracking, secure storage, and comprehensive document sharing with permission-based access controls
- 🎤 **Voice Assistant** - AI-powered voice commands for hands-free navigation and task management with speech recognition, natural language processing, and voice feedback
- 📈 **Reports** - Detailed business insights and analytics
- 🌍 **Multi-language** - Full Italian and English support
- 🔐 **Secure Authentication** - Powered by Clerk with MFA support
- 📱 **Responsive Design** - Works perfectly on all devices
- 💾 **Real-time Sync** - Powered by Supabase for instant data updates

## 🏗️ Project Structure

```
nexa-manager/
├── web-app/                    # Main React application
│   ├── src/
│   │   ├── app/               # Application core (store, routing)
│   │   ├── components/        # Reusable UI components
│   │   ├── features/          # Feature-based modules
│   │   │   ├── analytics/     # Analytics and reporting
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── calendar/      # Calendar and events
│   │   │   ├── clients/       # Client management
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── documents/     # Document management & scanner
│   │   │   ├── email/         # Email system
│   │   │   ├── financial/     # Invoices, quotes, payments
│   │   │   ├── organization/  # Organization management
│   │   │   ├── reports/       # Business reports
│   │   │   └── voice-assistant/ # AI-powered voice commands
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # External library configurations
│   │   ├── pages/             # Page components
│   │   ├── providers/         # Context providers
│   │   ├── router/            # Routing configuration
│   │   ├── services/          # API services
│   │   ├── shared/            # Shared utilities and components
│   │   │   ├── components/    # Shared UI components
│   │   │   ├── hooks/         # Shared hooks and contexts
│   │   │   ├── styles/        # Global styles
│   │   │   └── utils/         # Utility functions
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # General utilities
│   ├── public/                # Static assets and translations
│   └── docs/                  # Web app specific documentation
├── .config/                   # Configuration files
│   ├── cursor/                # Cursor IDE configuration
│   ├── taskmaster/            # Task Master configuration
│   └── vscode/                # VS Code configuration
├── docs/                      # Project documentation
├── tools/                     # Development tools and scripts
├── supabase/                  # Supabase configuration and migrations
├── reports/                   # Generated reports
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexa-manager
   ```

2. **Install dependencies**
   ```bash
   cd web-app
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase and Clerk credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the `web-app` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## 📚 Documentation

- [Setup Guides](docs/setup/) - Installation and configuration
- [Database Documentation](docs/database/) - Schema and migrations
- [Development Guides](docs/development/) - Development workflows
- [API Documentation](docs/api/) - API reference
- [Document Scanner System](web-app/docs/SCANNER_SYSTEM.md) - Complete scanner documentation
- [Testing Documentation](web-app/docs/TESTING.md) - Comprehensive testing guide
- [Troubleshooting](docs/troubleshooting/) - Common issues and solutions

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Clerk
- **Internationalization**: i18next
- **Charts**: Chart.js
- **PDF Generation**: jsPDF
- **Document Processing**: Advanced AI-powered OCR with multi-provider architecture (OpenAI Vision, Qwen) featuring intelligent fallback, rate limiting, comprehensive batch processing with job management, comprehensive image optimization for API cost reduction, real-time processing status, comprehensive Supabase-integrated storage with full-text search and metadata management, and secure document sharing with permission-based access controls
- **Icons**: Lucide React

## 🌍 Internationalization

The application supports multiple languages:
- 🇮🇹 Italian (default)
- 🇬🇧 English

Translation files are located in `web-app/public/locales/`.

## 🔒 Security

- **Authentication**: Clerk integration with secure JWT tokens
- **Database Security**: Row Level Security (RLS) policies on all tables
- **Data Protection**: User data isolation and access controls
- **Environment Security**: Sensitive data stored in environment variables
- **Input Validation**: Comprehensive sanitization and validation

### 🚨 Security Status
- ✅ Authentication bypass system completely removed from all route protection
- ✅ Both `ProtectedRoute` and `OrganizationProtectedRoute` use real Clerk authentication with consistent `/login` redirects
- ✅ Development bypasses eliminated - no authentication shortcuts in any environment
- 🔄 **In Progress**: Updating remaining 20+ components to use real Clerk hooks
- ✅ RLS policies implemented for data protection
- ✅ Secure credential management

## 🆕 Recent Updates & Improvements

### Voice Assistant Implementation (Latest)
- ✅ **AI-Powered Voice Commands** - Complete voice assistant with speech recognition and natural language processing
- ✅ **Hands-Free Navigation** - Voice-controlled navigation throughout the application
- ✅ **Task Management** - Voice commands for creating clients, invoices, quotes, and managing calendar events
- ✅ **Voice Feedback** - Text-to-speech responses for user interactions
- ✅ **Multi-Language Support** - Voice commands in both Italian and English
- ✅ **Comprehensive Testing** - Full end-to-end test suite with 100% pass rate
- ✅ **Analytics Integration** - Voice command usage tracking and analytics

### Project Reorganization
- ✅ **Complete codebase restructuring** - Migrated from monolithic to feature-based architecture
- ✅ **Modular feature organization** - Each feature (analytics, auth, calendar, clients, dashboard, documents, email, financial, organization, reports, voice-assistant) now has its own dedicated module
- ✅ **Shared components system** - Centralized reusable components in `src/shared/`
- ✅ **Improved maintainability** - Clear separation of concerns and better code organization
- ✅ **Enhanced developer experience** - Easier navigation and feature development

### UI/UX Improvements
- ✅ **Quote Modal Integration** - Fixed "Create Quote" button to open modal instead of navigation
- ✅ **Consistent Modal Patterns** - Standardized modal behavior across the application
- ✅ **Responsive Design Updates** - Enhanced mobile and tablet experience

### Technical Improvements
- ✅ **TypeScript Integration** - Improved type safety across components
- ✅ **Performance Optimizations** - Better component structure and loading patterns
- ✅ **Code Quality** - Consistent coding standards and best practices
- ✅ **Documentation Updates** - Comprehensive project structure documentation
- ✅ **Testing Infrastructure** - Comprehensive test suite with 95%+ pass rate
  - Advanced async/await testing patterns for reliable promise handling
  - Sophisticated mocking infrastructure for external dependencies
  - Performance-optimized test execution with timeout prevention
  - Environment variable mocking for consistent cross-environment testing
  - Canvas API mocking for JSDOM environment compatibility in image processing tests
  - **Enhanced Timer Management** - Improved fake timer setup and cleanup patterns for reliable test execution
  - **Resource Cleanup Patterns** - Proper service disposal in tests with timer-based operations
  - **Test Isolation** - Enhanced test isolation with proper mock and timer state management

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or support, please contact the development team.

## 📞 Support

For technical support or questions:
- Email: support@nexamanager.com
- Documentation: [docs/](docs/)
- Issues: Contact the development team

---

**Made with ❤️ by the Nexa Manager Team**
