-- Verification script to check what was created by the email setup
-- Run this to see all the tables, indexes, and policies that were set up

-- 1. Check all email-related tables that were created
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'email_folders', 'email_templates', 'email_accounts', 'emails', 
      'email_attachments', 'email_labels', 'email_rules', 'email_sync_status'
    ) THEN 'Email Management'
    WHEN table_name IN (
      'email_tracking_events', 'email_performance_metrics', 'email_campaign_analytics',
      'client_communication_analytics', 'email_usage_reports', 'email_activity_timeline'
    ) THEN 'Email Analytics'
    ELSE 'Other'
  END as category,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'email_%'
ORDER BY category, table_name;

-- 2. Check RLS status for all email tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename;

-- 3. Check indexes created
SELECT 
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE '%_pkey' THEN 'Primary Key'
    WHEN indexname LIKE '%search%' THEN 'Full-text Search'
    WHEN indexname LIKE '%user_id%' THEN 'User Filter'
    WHEN indexname LIKE '%created_at%' THEN 'Time-based'
    ELSE 'Performance'
  END as index_type
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, indexname;

-- 4. Check functions and triggers
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%email%' OR routine_name LIKE '%engagement%')
ORDER BY routine_name;

-- 5. Sample data check - see if default folders were created
SELECT 
  name,
  type,
  icon,
  color,
  user_id IS NOT NULL as has_user_id
FROM email_folders 
WHERE type = 'system'
ORDER BY name;