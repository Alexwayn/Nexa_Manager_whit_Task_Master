# Service Migration Mapping Document

## Overview
This document outlines the migration plan for reorganizing services from the current scattered structure into a feature-based architecture.

## Current Service Distribution

### Services in `web-app/src/lib/`
**Authentication Services:**
- `authService.js` → `features/auth/services/`
- `clerkSupabaseIntegration.js` → `features/auth/services/`
- `securityService.js` → `features/auth/services/`

**Client Management Services:**
- `clientService.js` → `features/clients/services/`
- `clientEmailService.js` → `features/clients/services/`
- `businessService.js` → `features/clients/services/`

**Financial Services:**
- `invoiceService.js` → `features/financial/services/`
- `invoiceAnalyticsService.js` → `features/financial/services/`
- `invoiceLifecycleService.js` → `features/financial/services/`
- `invoiceSettingsService.js` → `features/financial/services/`
- `quoteService.js` → `features/financial/services/`
- `quoteApprovalService.js` → `features/financial/services/`
- `quotePdfService.js` → `features/financial/services/`
- `expenseService.js` → `features/financial/services/`
- `incomeService.js` → `features/financial/services/`
- `financialService.js` → `features/financial/services/`
- `taxCalculationService.js` → `features/financial/services/`

**Email Services:**
- `emailService.js` → `features/email/services/`
- `emailManagementService.js` → `features/email/services/`
- `emailAnalyticsService.js` → `features/email/services/`
- `emailAttachmentService.js` → `features/email/services/`
- `emailAutomationService.js` → `features/email/services/`
- `emailCacheService.js` → `features/email/services/`
- `emailCampaignService.js` → `features/email/services/`
- `emailErrorHandler.js` → `features/email/services/`
- `emailNotificationService.js` → `features/email/services/`
- `emailOfflineService.js` → `features/email/services/`
- `emailProviderService.js` → `features/email/services/`
- `emailQueueService.js` → `features/email/services/`
- `emailRecoveryService.js` → `features/email/services/`
- `emailSearchService.js` → `features/email/services/`
- `emailSecurityService.js` → `features/email/services/`
- `emailSettingsService.js` → `features/email/services/`
- `emailSignatureService.js` → `features/email/services/`
- `emailStorageService.js` → `features/email/services/`
- `emailSyncService.js` → `features/email/services/`
- `emailTemplateService.js` → `features/email/services/`
- `emailTrackingService.js` → `features/email/services/`
- `enhancedEmailQueueService.js` → `features/email/services/`
- `businessEmailIntegration.js` → `features/email/services/`
- `businessEmailLogger.js` → `features/email/services/`

**Document Services:**
- `documentService.js` → `features/documents/services/`
- `pdfGenerationService.js` → `features/documents/services/`
- `receiptUploadService.js` → `features/documents/services/`

**Calendar/Event Services:**
- `eventService.js` → `features/calendar/services/`
- `eventInvitationService.js` → `features/calendar/services/`
- `recurringEventsService.js` → `features/calendar/services/`

**Shared/Cross-cutting Services:**
- `realtimeService.js` → `shared/services/`
- `notificationService.js` → `shared/services/`
- `storageService.ts` → `shared/services/`
- `exportService.js` → `shared/services/`
- `reportingService.js` → `shared/services/`
- `integrationsService.js` → `shared/services/`
- `errorReportingService.js` → `shared/services/`
- `webhookService.js` → `shared/services/`
- `supabaseClient.js` → `shared/services/`
- `supabaseClient.ts` → `shared/services/`
- `supabaseClerkClient.js` → `shared/services/`
- `logger.js` → `shared/services/`
- `sentry.ts` → `shared/services/`
- `uiUtils.ts` → `shared/utils/`

### Services in `web-app/src/services/`
**Scanner Services (already organized):**
- All files in `scanner/` directory → `features/scanner/services/`

**Other Services:**
- `websocketService.js` → `shared/services/`
- `reportingService.ts` → `shared/services/` (duplicate of lib version)

**Massive index.js file:**
- Contains hundreds of service exports that appear to be auto-generated or placeholder
- Needs to be cleaned up and replaced with proper feature-based exports

## Migration Strategy

### Phase 2.1: Analysis Complete ✓
- [x] Audit all services in both directories
- [x] Categorize by business domain
- [x] Create this migration mapping document
- [x] Identify shared services

### Phase 2.2: Create Feature Directory Structure
- [ ] Create `web-app/src/features/` directory
- [ ] Create feature subdirectories with service folders
- [ ] Create `web-app/src/shared/services/` directory

### Phase 2.3-2.8: Service Migration by Domain
- [ ] Migrate authentication services
- [ ] Migrate client management services  
- [ ] Migrate financial services
- [ ] Migrate email services
- [ ] Migrate document and scanner services
- [ ] Consolidate shared services

## Post-Migration Tasks
1. Update all import statements across the application
2. Create feature index.ts files with public API exports
3. Test functionality after each migration step
4. Clean up the massive services/index.js file
5. Update TypeScript path mappings
6. Update build configurations

## Notes
- The `services/index.js` file contains 986+ exports that appear to be auto-generated placeholders
- Many services have corresponding test files that will need to be moved as well
- Some services have mock files in `lib/__mocks__/` that need to be relocated
- Migration files in `lib/migrations/` should be moved to `tools/migrations/`