-- Email Security Tables Migration
-- This migration creates tables for email security features including
-- credential storage, security analysis, and audit logging

-- Table for storing encrypted email credentials
CREATE TABLE IF NOT EXISTS email_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    imap_host VARCHAR(255),
    smtp_host VARCHAR(255),
    imap_port INTEGER DEFAULT 993,
    smtp_port INTEGER DEFAULT 587,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, email_address)
);

-- Table for email security analysis results
CREATE TABLE IF NOT EXISTS email_security_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_id UUID NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    spam_indicators JSONB DEFAULT '[]'::jsonb,
    phishing_indicators JSONB DEFAULT '[]'::jsonb,
    recommendation TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX(user_id, email_id),
    INDEX(risk_score)
);

-- Table for email security event logging
CREATE TABLE IF NOT EXISTS email_security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    severity VARCHAR(20) DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX(user_id, timestamp),
    INDEX(action),
    INDEX(severity)
);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE email_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_security_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_security_logs ENABLE ROW LEVEL SECURITY;

-- Policies for email_credentials
CREATE POLICY "Users can only access their own email credentials" ON email_credentials
    FOR ALL USING (auth.uid() = user_id);

-- Policies for email_security_analysis
CREATE POLICY "Users can only access their own security analysis" ON email_security_analysis
    FOR ALL USING (auth.uid() = user_id);

-- Policies for email_security_logs
CREATE POLICY "Users can only access their own security logs" ON email_security_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_credentials_user_id ON email_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_email_credentials_email ON email_credentials(email_address);
CREATE INDEX IF NOT EXISTS idx_email_security_analysis_user_id ON email_security_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_email_security_analysis_email_id ON email_security_analysis(email_id);
CREATE INDEX IF NOT EXISTS idx_email_security_analysis_risk_score ON email_security_analysis(risk_score);
CREATE INDEX IF NOT EXISTS idx_email_security_logs_user_id ON email_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_security_logs_timestamp ON email_security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_email_security_logs_action ON email_security_logs(action);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_email_credentials_updated_at 
    BEFORE UPDATE ON email_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON email_credentials TO authenticated;
GRANT ALL ON email_security_analysis TO authenticated;
GRANT ALL ON email_security_logs TO authenticated;

-- Comments for documentation
COMMENT ON TABLE email_credentials IS 'Stores encrypted email account credentials for users';
COMMENT ON TABLE email_security_analysis IS 'Stores security analysis results for emails including spam and phishing detection';
COMMENT ON TABLE email_security_logs IS 'Audit log for email security events and actions';

COMMENT ON COLUMN email_credentials.encrypted_password IS 'Password encrypted using AES-GCM encryption';
COMMENT ON COLUMN email_security_analysis.risk_score IS 'Risk score from 0-100 based on security analysis';
COMMENT ON COLUMN email_security_analysis.spam_indicators IS 'JSON array of detected spam indicators';
COMMENT ON COLUMN email_security_analysis.phishing_indicators IS 'JSON array of detected phishing indicators';