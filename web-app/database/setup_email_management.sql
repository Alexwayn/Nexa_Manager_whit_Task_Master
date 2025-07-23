-- Complete Email Management System Setup Script
-- This script sets up the entire email management system database schema
-- Execute this script in your Supabase SQL editor

-- Step 1: Create the main email management schema
\i email_management_schema.sql

-- Step 2: Add performance indexes
\i email_performance_indexes.sql

-- Step 3: Insert default email templates
\i email_default_templates.sql

-- Step 4: Create email analytics and tracking schema
\i email_analytics_schema.sql

-- Verification queries to check if everything was created successfully
DO $$
DECLARE
    table_count INTEGER;
    analytics_table_count INTEGER;
    index_count INTEGER;
    template_count INTEGER;
BEGIN
    -- Check if all main tables were created
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'email_folders', 'email_templates', 'email_accounts', 'emails', 
        'email_attachments', 'email_labels', 'email_rules', 'email_sync_status'
    );
    
    -- Check if analytics tables were created
    SELECT COUNT(*) INTO analytics_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'email_tracking_events', 'email_performance_metrics', 'email_campaign_analytics',
        'client_communication_analytics', 'email_usage_reports', 'email_activity_timeline'
    );
    
    -- Check if indexes were created
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_email%';
    
    -- Check if default templates were inserted
    SELECT COUNT(*) INTO template_count
    FROM email_templates 
    WHERE is_system = TRUE;
    
    RAISE NOTICE 'Email Management Setup Complete:';
    RAISE NOTICE '- Main tables created: %', table_count;
    RAISE NOTICE '- Analytics tables created: %', analytics_table_count;
    RAISE NOTICE '- Indexes created: %', index_count;
    RAISE NOTICE '- Default templates: %', template_count;
    
    IF table_count < 8 THEN
        RAISE WARNING 'Some main tables may not have been created successfully';
    END IF;
    
    IF analytics_table_count < 6 THEN
        RAISE WARNING 'Some analytics tables may not have been created successfully';
    END IF;
    
    IF template_count < 5 THEN
        RAISE WARNING 'Default templates may not have been inserted successfully';
    END IF;
END $$;