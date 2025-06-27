-- SECURITY TABLES SCHEMA
-- =====================================================
-- Missing security tables for user sessions and audit logs
-- Compatible with Clerk authentication system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================
-- Tracks user login sessions for security monitoring
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk user ID (string format)
    session_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB, -- Country, city, etc.
    login_method VARCHAR(50) DEFAULT 'password', -- password, oauth, sso, etc.
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECURITY AUDIT LOGS TABLE
-- =====================================================
-- Comprehensive audit logging for security events
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT, -- Clerk user ID (can be null for system events)
    target_user_id TEXT, -- Target user for admin actions
    action VARCHAR(100) NOT NULL, -- LOGIN, LOGOUT, ROLE_CHANGE, etc.
    resource_type VARCHAR(50), -- user, role, permission, etc.
    resource_id TEXT,
    details JSONB, -- Additional event details
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE', 'PENDING')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, last_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_target_user_id ON security_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_timestamp ON security_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON security_audit_logs(severity);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================
-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_sessions
CREATE TRIGGER set_timestamp_user_sessions
BEFORE UPDATE ON user_sessions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for user_sessions - users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Policy for security_audit_logs - users can view their own logs
CREATE POLICY "Users can view own audit logs" ON security_audit_logs
    FOR SELECT USING (
        user_id = auth.jwt() ->> 'sub' OR 
        target_user_id = auth.jwt() ->> 'sub'
    );

-- Admin policy for full access (requires admin role check)
CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.jwt() ->> 'sub'
            AND r.name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can view all audit logs" ON security_audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.jwt() ->> 'sub'
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE user_sessions IS 'Tracks user login sessions for security monitoring and management';
COMMENT ON COLUMN user_sessions.user_id IS 'Clerk user ID in string format';
COMMENT ON COLUMN user_sessions.session_token IS 'Unique session identifier';
COMMENT ON COLUMN user_sessions.login_method IS 'Method used for authentication (password, oauth, sso, etc.)';

COMMENT ON TABLE security_audit_logs IS 'Comprehensive audit trail for security-related events';
COMMENT ON COLUMN security_audit_logs.user_id IS 'User who performed the action (Clerk user ID)';
COMMENT ON COLUMN security_audit_logs.target_user_id IS 'Target user for admin actions (Clerk user ID)';
COMMENT ON COLUMN security_audit_logs.action IS 'Type of action performed (LOGIN, LOGOUT, ROLE_CHANGE, etc.)';
COMMENT ON COLUMN security_audit_logs.severity IS 'Security severity level of the event';