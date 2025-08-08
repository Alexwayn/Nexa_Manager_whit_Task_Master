# Nexa Manager Documentation

This directory contains comprehensive documentation for the Nexa Manager project, organized by category for easy navigation.

## 📁 Directory Structure

```
docs/
├── api/                # API documentation and integration guides
├── architecture/       # System architecture and design documentation
├── development/        # Development guides, setup, and workflows
├── deployment/         # Deployment procedures and configurations
├── user-guides/        # End-user documentation and tutorials
├── decisions/          # Architecture Decision Records (ADRs)
└── templates/          # Documentation templates and standards
```

## 📚 Quick Links

### 🚀 Project Overview
- [Project Status Summary](development/PROJECT_STATUS_SUMMARY.md) - Comprehensive project state overview
- [Authentication Status](development/AUTHENTICATION_STATUS.md) - Current security migration progress

### 🛠️ Setup & Development
- [Development Setup](development/README.md) - Complete development environment setup
- [Documentation Update Summary](development/DOCUMENTATION_UPDATE_SUMMARY.md) - Recent documentation improvements and changes
- [AWS Setup Guide](development/setup/AWS_SETUP_GUIDE.md)
- [OAuth Setup Guide](development/setup/OAUTH_SETUP_GUIDE.md)
- [MFA Implementation Guide](development/setup/MFA_IMPLEMENTATION_GUIDE.md)
- [Sentry Setup](development/setup/SENTRY_SETUP.md)

### 📧 API Documentation
- [Email System API](api/EMAIL_SYSTEM.md) - Complete email system documentation
- [Email API Reference](api/EMAIL_API.md) - Detailed API endpoints
- [Scanner API](api/SCANNER_API.md) - Document scanner API reference
- [Reporting Framework](api/REPORTING_FRAMEWORK.md) - Reporting system API

### 🏗️ Architecture & Implementation
- [System Architecture](architecture/README.md) - Overall system design
- [TypeScript Types](architecture/TYPESCRIPT_TYPES.md) - Type definitions and interfaces
- [Database Schema](architecture/database/DATABASE_SCANNER_SCHEMA.md) - Database design
- [Document Sharing](architecture/implementations/DOCUMENT_SHARING.md) - Document sharing system
- [Scanner System](architecture/implementations/SCANNER_SYSTEM.md) - Scanner architecture
- [OCR Provider Factory](architecture/implementations/OCR_PROVIDER_FACTORY.md) - OCR system design

### 🚀 Deployment & Monitoring
- [Deployment Guide](deployment/README.md) - Deployment procedures
- [Monitoring Setup](deployment/monitoring/monitoring-setup.md) - System monitoring
- [SSL/Domain Troubleshooting](deployment/troubleshooting/SSL_CLERK_DOMAIN_FIX.md)

### 🧪 Testing & Quality
- [Testing Guide](development/testing/TESTING.md) - Testing strategies and setup
- [Async Testing Patterns](development/testing/ASYNC_TESTING_PATTERNS.md) - Advanced async/await testing patterns and best practices
- [Testing Status Update](development/testing/TESTING_STATUS_UPDATE.md) - Recent testing infrastructure improvements and achievements
- [Code Review Process](development/workflows/code-review-process.md)

## 🔧 Project Status

- ✅ Core functionality implemented
- ✅ Multi-language support (IT/EN)
- ✅ Database schema stable
- 🔄 **Authentication System** - Migrating from bypass hooks to real Clerk authentication
- ✅ Invoice management
- ✅ Client management
- 🆕 **Email Management System** - Comprehensive email client with IMAP/SMTP support
- ✅ **Document Scanner System** - AI-powered document digitization with advanced multi-provider OCR architecture, comprehensive image optimization, document storage, and secure document sharing (complete implementation)
- 🔄 Ongoing improvements and optimizations

### 🔐 Security Status
- ✅ Authentication bypass system removed from core components
- 🔄 **In Progress**: Updating remaining 20+ components to use real Clerk hooks
- ✅ Row Level Security (RLS) policies implemented
- ✅ Organization-based access control active
