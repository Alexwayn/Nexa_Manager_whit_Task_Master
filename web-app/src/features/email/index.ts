// Email Feature - Public API

// Components
export { default as AutomationDashboard } from './components/AutomationDashboard';
export { default as AutomationRules } from './components/AutomationRules';
export { default as EmailAttachmentManager } from './components/EmailAttachmentManager';
export { default as EmailCampaignManager } from './components/EmailCampaignManager';
export { default as EmailCampaigns } from './components/EmailCampaigns';
export { default as EmailComposer } from './components/EmailComposer';
export { default as EmailErrorBoundary } from './components/EmailErrorBoundary';
export { default as EmailList } from './components/EmailList';
export { default as EmailListContainer } from './components/EmailListContainer';
export { default as EmailManager } from './components/EmailManager';
export { default as EmailPerformanceMonitor } from './components/EmailPerformanceMonitor';
export { default as EmailProviderSettings } from './components/EmailProviderSettings';
export { default as EmailQueueManager } from './components/EmailQueueManager';
export { default as EmailRecipientInput } from './components/EmailRecipientInput';
export { default as EmailScheduler } from './components/EmailScheduler';
export { default as EmailSearch } from './components/EmailSearch';
export { default as EmailSearchDashboard } from './components/EmailSearchDashboard';
export { default as EmailSearchResults } from './components/EmailSearchResults';
export { default as EmailSettings } from './components/EmailSettings';
export { default as EmailSignatureManager } from './components/EmailSignatureManager';
export { default as EmailTemplateEditor } from './components/EmailTemplateEditor';
export { default as EmailTemplateManager } from './components/EmailTemplateManager';
export { default as EmailTemplateSelector } from './components/EmailTemplateSelector';
export { default as EmailViewer } from './components/EmailViewer';
export { default as EmailViewerContainer } from './components/EmailViewerContainer';
export { default as FollowUpReminders } from './components/FollowUpReminders';
export { default as VirtualEmailList } from './components/VirtualEmailList';

// Hooks
export { useEmails } from './hooks/useEmails.js';
export { useEmailComposer } from './hooks/useEmailComposer.js';
export { useEmailTemplates } from './hooks/useEmailTemplates.js';
export { useEmailList } from './hooks/useEmailList.js';
export { useEmailAutomation, useEmailScheduling, useFollowUpReminders, useEmailCampaigns, useAutomationStats } from './hooks/useEmailAutomation.js';
export { useEmailNotifications } from './hooks/useEmailNotifications.js';
export { useEmailPerformance } from './hooks/useEmailPerformance.js';
export { useEmailSearch } from './hooks/useEmailSearch.js';
export { useEmailSync } from './hooks/useEmailSync.js';
export { useEmailViewer } from './hooks/useEmailViewer.js';

// Services - Updated to use lazy initialization to prevent temporal dead zones
export { emailService, getEmailService } from './services/emailService.js';
export { default as emailManagementService, getEmailManagementService } from './services/emailManagementService.js';
export { emailAnalyticsService, getEmailAnalyticsService } from './services/emailAnalyticsService.js';
export { default as emailAttachmentService, getEmailAttachmentService } from './services/emailAttachmentService.js';
export { default as emailAutomationService, getEmailAutomationService } from './services/emailAutomationService.js';
export { default as emailCacheService, getEmailCacheService } from './services/emailCacheService.js';
export { emailCampaignService, getEmailCampaignService } from './services/emailCampaignService.js';
export { default as emailErrorHandler, getEmailErrorHandler } from './services/emailErrorHandler.js';
export { default as emailNotificationService, getEmailNotificationService } from './services/emailNotificationService.js';
export { default as emailOfflineService, getEmailOfflineService } from './services/emailOfflineService.js';
export { default as emailProviderService, getEmailProviderService } from './services/emailProviderService.js';
export { default as emailQueueService, getEmailQueueService } from './services/emailQueueService.js';
export { default as emailRecoveryService, getEmailRecoveryService } from './services/emailRecoveryService.js';
export { emailSearchService, getEmailSearchService } from './services/emailSearchService.js';
export { default as emailSecurityService, getEmailSecurityService } from './services/emailSecurityService.js';
export { default as emailSettingsService, getEmailSettingsService } from './services/emailSettingsService.js';
export { default as emailSignatureService, getEmailSignatureService } from './services/emailSignatureService.js';
export { default as emailStorageService, getEmailStorageService } from './services/emailStorageService.js';
export { default as emailSyncService, getEmailSyncService } from './services/emailSyncService.js';
export { emailTemplateService, getEmailTemplateService } from './services/emailTemplateService.js';
export { default as emailTrackingService, getEmailTrackingService } from './services/emailTrackingService.js';
export { default as enhancedEmailQueueService, getEnhancedEmailQueueService } from './services/enhancedEmailQueueService.js';
export { default as businessEmailIntegration, getBusinessEmailIntegration } from './services/businessEmailIntegration.js';
export { default as businessEmailLogger, getBusinessEmailLogger } from './services/businessEmailLogger.js';

// Re-export types if any
export type * from './services/emailService.js';
export type * from './services/emailManagementService.js';
export type * from './services/emailAnalyticsService.js';
export type * from './services/emailAttachmentService.js';
export type * from './services/emailAutomationService.js';
export type * from './services/emailCacheService.js';
export type * from './services/emailCampaignService.js';
export type * from './services/emailErrorHandler.js';
export type * from './services/emailNotificationService.js';
export type * from './services/emailOfflineService.js';
export type * from './services/emailProviderService.js';
export type * from './services/emailQueueService.js';
export type * from './services/emailRecoveryService.js';
export type * from './services/emailSearchService.js';
export type * from './services/emailSecurityService.js';
export type * from './services/emailSettingsService.js';
export type * from './services/emailSignatureService.js';
export type * from './services/emailStorageService.js';
export type * from './services/emailSyncService.js';
export type * from './services/emailTemplateService.js';
export type * from './services/emailTrackingService.js';
export type * from './services/enhancedEmailQueueService.js';
export type * from './services/businessEmailIntegration.js';
export type * from './services/businessEmailLogger.js';
