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
- 🔄 Ongoing improvements and optimizations

### 🔐 Security Status
- ✅ Authentication bypass system removed from core components
- 🔄 **In Progress**: Updating remaining 20+ components to use real Clerk hooks
- ✅ Row Level Security (RLS) policies implemented
- ✅ Organization-based access control active
