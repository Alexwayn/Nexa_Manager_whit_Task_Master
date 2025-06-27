-- Fix for policy conflicts
-- Run this script before running the schema files to avoid policy conflicts

-- Drop existing policies that are causing conflicts

-- Invoice settings policies
DROP POLICY IF EXISTS "Users can view active templates" ON invoice_templates;

-- Documents policies
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Recurring events policies
DROP POLICY IF EXISTS "Users can view their own recurrence rules" ON recurrence_rules;
DROP POLICY IF EXISTS "Users can insert their own recurrence rules" ON recurrence_rules;
DROP POLICY IF EXISTS "Users can update their own recurrence rules" ON recurrence_rules;
DROP POLICY IF EXISTS "Users can delete their own recurrence rules" ON recurrence_rules;

-- Notification queue policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_queue;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notification_queue;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notification_queue;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notification_queue;

-- User notification preferences policies
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON user_notification_preferences;

-- Note: After running this script, you can safely run the schema files
-- The policies will be recreated by the schema files