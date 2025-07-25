# 🚀 Nexa Manager

A comprehensive business management platform built with React, Vite, and Supabase.

## ✨ Features

- 📊 **Dashboard** - Real-time business analytics and insights
- 👥 **Client Management** - Complete CRM functionality with detailed profiles
- 🧾 **Invoice & Quotes** - Professional billing system with PDF generation
- 📅 **Calendar** - Event and appointment management
- 📧 **Email Management** - Integrated email system with templates, IMAP/SMTP support, and business document integration
- 📄 **Document Scanner** - Advanced AI-powered document digitization with multi-provider OCR architecture, intelligent fallback systems, camera capture, file upload, and comprehensive Supabase-integrated document management with full-text search, metadata tracking, and secure storage
- 📈 **Reports** - Detailed business insights and analytics
- 🌍 **Multi-language** - Full Italian and English support
- 🔐 **Secure Authentication** - Powered by Clerk with MFA support
- 📱 **Responsive Design** - Works perfectly on all devices
- 💾 **Real-time Sync** - Powered by Supabase for instant data updates

## 🏗️ Project Structure

```
nexa-manager/
├── web-app/           # Main React application
│   ├── src/           # Source code
│   ├── public/        # Static assets and translations
│   └── docs/          # Web app specific documentation
├── docs/              # Project documentation
├── scripts/           # Utility scripts (i18n, etc.)
├── reports/           # Generated reports
└── README.md          # This file
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
- **Document Processing**: Advanced AI-powered OCR with multi-provider architecture (OpenAI Vision, Qwen) featuring intelligent fallback, rate limiting, comprehensive image optimization for API cost reduction, real-time processing status, and comprehensive Supabase-integrated storage with full-text search and metadata management
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
