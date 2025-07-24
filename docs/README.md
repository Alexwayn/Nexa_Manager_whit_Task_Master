# Nexa Manager Documentation

This directory contains all project documentation organized by category.

## 📁 Directory Structure

```
docs/
├── setup/              # Setup and installation guides
├── database/           # Database documentation
├── deployment/         # Deployment guides
├── development/        # Development guides
├── api/               # API documentation
└── troubleshooting/   # Problem resolution guides
```

## 📚 Quick Links

### 🚀 Project Overview
- [Project Status Summary](PROJECT_STATUS_SUMMARY.md) - Comprehensive project state overview
- [Authentication Status](AUTHENTICATION_STATUS.md) - Current security migration progress

### 🛠️ Setup Guides
- [AWS Setup Guide](setup/AWS_SETUP_GUIDE.md)
- [Supabase Setup](setup/README_SUPABASE.md)
- [Domain Setup](setup/DOMAIN_SETUP_CHECKLIST.md)

### 👨‍💻 Development
- [Authentication Migration Guide](development/AUTHENTICATION_MIGRATION_GUIDE.md) - Step-by-step migration process
- [Translation Management](development/README_TRANSLATE.md)
- [Motiff MCP Setup](development/MOTIFF_MCP_SETUP.md)

### 📧 Email Management System
- [Email System Overview](../web-app/docs/EMAIL_SYSTEM.md)
- [Email API Documentation](../web-app/docs/EMAIL_API.md)
- [TypeScript Types](../web-app/docs/TYPESCRIPT_TYPES.md)

### 📄 Document Scanner System
- [Scanner System Overview](../web-app/docs/SCANNER_SYSTEM.md) - Complete system architecture and features
- [OCR Provider Factory](../web-app/docs/OCR_PROVIDER_FACTORY.md) - Multi-provider OCR architecture and implementation
- [Scanner API Documentation](../web-app/docs/SCANNER_API.md) - Comprehensive API reference for OCR services
- [Database Schema](../web-app/docs/DATABASE_SCANNER_SCHEMA.md) - Complete database schema and storage architecture
- [ScannerPage Implementation Guide](../web-app/docs/SCANNER_PAGE_IMPLEMENTATION.md) - Detailed component implementation
- [Scanner Feature README](../web-app/src/components/scanner/README.md) - Component implementation status
- [Scanner Types Documentation](../web-app/src/types/scanner.ts) - TypeScript interfaces and types
- [Scanner Implementation Tasks](../.kiro/specs/document-scanner/tasks.md) - Development progress tracking

### 🗄️ Database
- [Database Schema](database/README.md)
- [RLS Security](database/RLS_SECURITY_DOCUMENTATION.md)

### 🔧 Troubleshooting
- [Common Issues](troubleshooting/ERRORI_RISOLTI_SUMMARY.md)
- [Settings Fixes](troubleshooting/SETTINGS_FIXES_SUMMARY.md)

## 🔧 Project Status

- ✅ Core functionality implemented
- ✅ Multi-language support (IT/EN)
- ✅ Database schema stable
- 🔄 **Authentication System** - Migrating from bypass hooks to real Clerk authentication
- ✅ Invoice management
- ✅ Client management
- 🆕 **Email Management System** - Comprehensive email client with IMAP/SMTP support
- 🔄 **Document Scanner System** - AI-powered document digitization with advanced multi-provider OCR architecture (UI complete, OCR services complete, document storage complete, remaining components in development)
- 🔄 Ongoing improvements and optimizations

### 🔐 Security Status
- ✅ Authentication bypass system removed from core components
- 🔄 **In Progress**: Updating remaining 20+ components to use real Clerk hooks
- ✅ Row Level Security (RLS) policies implemented
- ✅ Organization-based access control active
