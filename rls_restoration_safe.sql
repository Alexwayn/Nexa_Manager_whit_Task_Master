-- STEP 1: Backup current state
CREATE TABLE IF NOT EXISTS rls_backup_policies AS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- STEP 2: Re-enable RLS only on tables that exist
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Check and enable RLS for business_profiles
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'business_profiles'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on business_profiles';
    ELSE
        RAISE NOTICE 'Table business_profiles does not exist, skipping';
    END IF;

    -- Check and enable RLS for events
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'events'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE events ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on events';
    ELSE
        RAISE NOTICE 'Table events does not exist, skipping';
    END IF;

    -- Check and enable RLS for user_roles
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on user_roles';
    ELSE
        RAISE NOTICE 'Table user_roles does not exist, skipping';
    END IF;

    -- Check and enable RLS for user_sessions
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_sessions'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on user_sessions';
    ELSE
        RAISE NOTICE 'Table user_sessions does not exist, skipping';
    END IF;

    -- Check and enable RLS for security_audit_logs
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'security_audit_logs'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on security_audit_logs';
    ELSE
        RAISE NOTICE 'Table security_audit_logs does not exist, skipping';
    END IF;

    -- Check and enable RLS for email_settings
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_settings'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on email_settings';
    ELSE
        RAISE NOTICE 'Table email_settings does not exist, skipping';
    END IF;

    -- Check and enable RLS for notification_preferences
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notification_preferences'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on notification_preferences';
    ELSE
        RAISE NOTICE 'Table notification_preferences does not exist, skipping';
    END IF;

    -- Check and enable RLS for email_activity
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_activity'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE email_activity ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on email_activity';
    ELSE
        RAISE NOTICE 'Table email_activity does not exist, skipping';
    END IF;

    -- Check and enable RLS for api_keys
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'api_keys'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on api_keys';
    ELSE
        RAISE NOTICE 'Table api_keys does not exist, skipping';
    END IF;

    -- Check and enable RLS for third_party_integrations
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'third_party_integrations'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE third_party_integrations ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on third_party_integrations';
    ELSE
        RAISE NOTICE 'Table third_party_integrations does not exist, skipping';
    END IF;

    -- Check and enable RLS for integration_activity
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'integration_activity'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE integration_activity ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on integration_activity';
    ELSE
        RAISE NOTICE 'Table integration_activity does not exist, skipping';
    END IF;

    -- Check and enable RLS for invoice_settings
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'invoice_settings'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on invoice_settings';
    ELSE
        RAISE NOTICE 'Table invoice_settings does not exist, skipping';
    END IF;

    -- Check and enable RLS for invoice_templates
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'invoice_templates'
    ) INTO table_exists;
    IF table_exists THEN
        EXECUTE 'ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on invoice_templates';
    ELSE
        RAISE NOTICE 'Table invoice_templates does not exist, skipping';
    END IF;
END $$;

-- STEP 3: Check which tables now have RLS enabled
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;