-- Migration: Create document sharing tables
-- This migration creates the necessary tables for document sharing functionality

-- Create document_shares table
CREATE TABLE IF NOT EXISTS document_shares (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES scanned_documents(id) ON DELETE CASCADE,
    shared_by TEXT NOT NULL,
    shared_with TEXT, -- User ID if internal user
    shared_with_email TEXT NOT NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('view', 'edit', 'download')),
    share_token TEXT UNIQUE NOT NULL,
    public_link TEXT,
    message TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create document_access_log table for detailed access tracking
CREATE TABLE IF NOT EXISTS document_access_log (
    id SERIAL PRIMARY KEY,
    share_id TEXT NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
    user_id TEXT,
    ip_address INET,
    user_agent TEXT,
    action TEXT NOT NULL CHECK (action IN ('view', 'download', 'edit')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with_email ON document_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_document_shares_share_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_is_active ON document_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON document_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_document_access_log_share_id ON document_access_log(share_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user_id ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_timestamp ON document_access_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_document_access_log_action ON document_access_log(action);

-- Create RLS policies for document_shares
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see shares they created or shares where they are the recipient
CREATE POLICY "Users can view their own shares" ON document_shares
    FOR SELECT USING (
        shared_by = auth.uid()::text OR 
        shared_with = auth.uid()::text OR
        shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Policy: Users can only create shares for documents they own
CREATE POLICY "Users can create shares for their documents" ON document_shares
    FOR INSERT WITH CHECK (
        shared_by = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM scanned_documents 
            WHERE id = document_id AND created_by = auth.uid()::text
        )
    );

-- Policy: Users can only update shares they created
CREATE POLICY "Users can update their own shares" ON document_shares
    FOR UPDATE USING (shared_by = auth.uid()::text);

-- Policy: Users can only delete shares they created
CREATE POLICY "Users can delete their own shares" ON document_shares
    FOR DELETE USING (shared_by = auth.uid()::text);

-- Create RLS policies for document_access_log
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view access logs for shares they created
CREATE POLICY "Users can view access logs for their shares" ON document_access_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_shares 
            WHERE id = share_id AND shared_by = auth.uid()::text
        )
    );

-- Policy: System can insert access logs (no user restriction for logging)
CREATE POLICY "System can insert access logs" ON document_access_log
    FOR INSERT WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for document_shares updated_at
CREATE TRIGGER update_document_shares_updated_at 
    BEFORE UPDATE ON document_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE document_shares 
    SET is_active = FALSE, updated_at = NOW()
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- Create function to get share statistics
CREATE OR REPLACE FUNCTION get_document_share_stats(doc_id TEXT)
RETURNS TABLE(
    total_shares BIGINT,
    active_shares BIGINT,
    total_accesses BIGINT,
    unique_accessors BIGINT,
    last_accessed TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_shares,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_shares,
        COALESCE(SUM(access_count), 0) as total_accesses,
        COUNT(DISTINCT shared_with_email) FILTER (WHERE is_active = TRUE) as unique_accessors,
        MAX(last_accessed_at) as last_accessed
    FROM document_shares
    WHERE document_id = doc_id;
END;
$$ language 'plpgsql';

-- Create document_notification_preferences table
CREATE TABLE IF NOT EXISTS document_notification_preferences (
    user_id TEXT PRIMARY KEY,
    document_access BOOLEAN DEFAULT TRUE,
    document_download BOOLEAN DEFAULT TRUE,
    document_share BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT FALSE,
    weekly_report BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notification preferences
CREATE INDEX IF NOT EXISTS idx_document_notification_preferences_user_id ON document_notification_preferences(user_id);

-- Create RLS policies for document_notification_preferences
ALTER TABLE document_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own notification preferences
CREATE POLICY "Users can manage their own notification preferences" ON document_notification_preferences
    FOR ALL USING (user_id = auth.uid()::text);

-- Create trigger for document_notification_preferences updated_at
CREATE TRIGGER update_document_notification_preferences_updated_at 
    BEFORE UPDATE ON document_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON document_shares TO authenticated;
GRANT SELECT, INSERT ON document_access_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_notification_preferences TO authenticated;
GRANT USAGE ON SEQUENCE document_access_log_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE document_shares IS 'Stores document sharing information including permissions and access tokens';
COMMENT ON TABLE document_access_log IS 'Logs all access attempts to shared documents for audit and analytics';
COMMENT ON FUNCTION cleanup_expired_shares() IS 'Deactivates expired document shares';
COMMENT ON FUNCTION get_document_share_stats(TEXT) IS 'Returns sharing statistics for a specific document';