-- =====================================================
-- INTEGRATIONS & API KEYS MANAGEMENT SCHEMA
-- =====================================================
-- Comprehensive schema for API key management and third-party integrations
-- with OAuth support, encryption, rate limiting, and audit logging

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- API KEYS TABLE
-- =====================================================
-- Stores encrypted API keys with permissions and rate limiting
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key for secure storage
    key_prefix VARCHAR(20) NOT NULL, -- Visible prefix (e.g., "nxa_live_1234...")
    permissions JSONB DEFAULT '["read"]'::jsonb, -- Array of permissions: read, write, delete, admin
    scopes JSONB DEFAULT '[]'::jsonb, -- API scopes: invoices, clients, payments, etc.
    rate_limit_per_hour INTEGER DEFAULT 1000, -- Hourly rate limit
    rate_limit_per_day INTEGER DEFAULT 10000, -- Daily rate limit
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    usage_count BIGINT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- THIRD-PARTY INTEGRATIONS TABLE
-- =====================================================
-- Stores configuration for external service integrations
CREATE TABLE IF NOT EXISTS third_party_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- stripe, paypal, quickbooks, etc.
    service_category VARCHAR(50) NOT NULL, -- payment, accounting, communication, storage
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
    
    -- OAuth Configuration
    client_id VARCHAR(255),
    client_secret_encrypted TEXT, -- Encrypted client secret
    oauth_token_encrypted TEXT, -- Encrypted access token
    refresh_token_encrypted TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE,
    oauth_scopes JSONB DEFAULT '[]'::jsonb,
    
    -- API Configuration (for non-OAuth integrations)
    api_key_encrypted TEXT, -- Encrypted API key
    api_endpoint VARCHAR(500),
    api_version VARCHAR(50),
    
    -- Sync Configuration
    sync_enabled BOOLEAN DEFAULT false,
    sync_frequency VARCHAR(50) DEFAULT 'daily', -- hourly, daily, weekly, manual
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(20), -- success, error, partial
    last_sync_error TEXT,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Webhook Configuration
    webhook_url VARCHAR(500),
    webhook_secret_encrypted TEXT,
    webhook_events JSONB DEFAULT '[]'::jsonb, -- Array of webhook event types
    webhook_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    configuration JSONB DEFAULT '{}'::jsonb, -- Service-specific settings
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, service_name)
);

-- =====================================================
-- INTEGRATION ACTIVITY LOG TABLE
-- =====================================================
-- Logs all integration activities for audit and monitoring
CREATE TABLE IF NOT EXISTS integration_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES third_party_integrations(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL, -- api_call, sync, oauth_refresh, webhook, error
    activity_status VARCHAR(20) NOT NULL, -- success, error, warning
    
    -- Request/Response Details
    endpoint VARCHAR(500),
    http_method VARCHAR(10),
    request_size BIGINT,
    response_size BIGINT,
    response_time_ms INTEGER,
    status_code INTEGER,
    
    -- Error Details
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WEBHOOK CONFIGURATIONS TABLE
-- =====================================================
-- Stores webhook endpoint configurations for integrations
CREATE TABLE IF NOT EXISTS webhook_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES third_party_integrations(id) ON DELETE CASCADE,
    
    -- Webhook Details
    name VARCHAR(255) NOT NULL,
    endpoint_url VARCHAR(500) NOT NULL,
    secret_encrypted TEXT, -- Encrypted webhook secret
    events JSONB DEFAULT '[]'::jsonb, -- Array of event types to listen for
    
    -- Security & Validation
    verify_ssl BOOLEAN DEFAULT true,
    retry_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Status & Monitoring
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_error_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    success_count BIGINT DEFAULT 0,
    error_count BIGINT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at);

-- Third-party integrations indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON third_party_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_service ON third_party_integrations(service_name);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON third_party_integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_sync ON third_party_integrations(sync_enabled, next_sync_at);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON integration_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_integration_id ON integration_activity(integration_id);
CREATE INDEX IF NOT EXISTS idx_activity_api_key_id ON integration_activity(api_key_id);
CREATE INDEX IF NOT EXISTS idx_activity_type_status ON integration_activity(activity_type, activity_status);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON integration_activity(created_at);

-- Webhook configurations indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhook_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_integration_id ON webhook_configurations(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhook_configurations(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configurations ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view their own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Third-party integrations policies
CREATE POLICY "Users can view their own integrations" ON third_party_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations" ON third_party_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON third_party_integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON third_party_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Integration activity policies
CREATE POLICY "Users can view their own activity" ON integration_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create activity logs" ON integration_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Webhook configurations policies
CREATE POLICY "Users can view their own webhooks" ON webhook_configurations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks" ON webhook_configurations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks" ON webhook_configurations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks" ON webhook_configurations
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON third_party_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhook_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT SERVICE TEMPLATES
-- =====================================================
-- Insert default service templates for popular integrations

INSERT INTO third_party_integrations (
    id, user_id, service_name, service_category, display_name, description,
    status, api_endpoint, sync_frequency, configuration
) VALUES 
-- Payment Gateways
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'stripe', 'payment', 'Stripe', 'Accept online payments and manage subscriptions', 'inactive', 'https://api.stripe.com/v1', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'paypal', 'payment', 'PayPal', 'PayPal payment processing and merchant services', 'inactive', 'https://api.paypal.com/v1', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'square', 'payment', 'Square', 'Point of sale and payment processing', 'inactive', 'https://connect.squareup.com/v2', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),

-- Accounting Software
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'quickbooks', 'accounting', 'QuickBooks', 'Accounting and bookkeeping software', 'inactive', 'https://sandbox-quickbooks.api.intuit.com/v3', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'xero', 'accounting', 'Xero', 'Cloud-based accounting software', 'inactive', 'https://api.xero.com/api.xro/2.0', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'sage', 'accounting', 'Sage', 'Business management software', 'inactive', 'https://api.sage.com/v3', 'daily', '{"supports_webhooks": false, "supports_oauth": true}'::jsonb),

-- Communication Services
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'sendgrid', 'communication', 'SendGrid', 'Email delivery and marketing platform', 'inactive', 'https://api.sendgrid.com/v3', 'hourly', '{"supports_webhooks": true, "supports_oauth": false}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'mailchimp', 'communication', 'Mailchimp', 'Email marketing and automation', 'inactive', 'https://us1.api.mailchimp.com/3.0', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'twilio', 'communication', 'Twilio', 'SMS and voice communication API', 'inactive', 'https://api.twilio.com/2010-04-01', 'manual', '{"supports_webhooks": true, "supports_oauth": false}'::jsonb),

-- Storage Services
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'google_drive', 'storage', 'Google Drive', 'Cloud storage and document collaboration', 'inactive', 'https://www.googleapis.com/drive/v3', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'dropbox', 'storage', 'Dropbox', 'Cloud storage and file sharing', 'inactive', 'https://api.dropboxapi.com/2', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'onedrive', 'storage', 'OneDrive', 'Microsoft cloud storage service', 'inactive', 'https://graph.microsoft.com/v1.0', 'daily', '{"supports_webhooks": true, "supports_oauth": true}'::jsonb)

ON CONFLICT (user_id, service_name) DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to generate secure API key with prefix
CREATE OR REPLACE FUNCTION generate_api_key_with_prefix(key_prefix TEXT DEFAULT 'nxa')
RETURNS TEXT AS $$
BEGIN
    RETURN key_prefix || '_' || 
           CASE 
               WHEN key_prefix LIKE '%_test%' OR key_prefix LIKE '%_dev%' THEN 'test_'
               ELSE 'live_'
           END ||
           encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to hash API key for secure storage
CREATE OR REPLACE FUNCTION hash_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(api_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get API key usage statistics
CREATE OR REPLACE FUNCTION get_api_key_usage_stats(key_id UUID)
RETURNS TABLE (
    total_calls BIGINT,
    successful_calls BIGINT,
    error_calls BIGINT,
    avg_response_time NUMERIC,
    last_24h_calls BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE activity_status = 'success') as successful_calls,
        COUNT(*) FILTER (WHERE activity_status = 'error') as error_calls,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_calls
    FROM integration_activity 
    WHERE api_key_id = key_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE api_keys IS 'Stores encrypted API keys with permissions and rate limiting';
COMMENT ON TABLE third_party_integrations IS 'Configuration for external service integrations with OAuth support';
COMMENT ON TABLE integration_activity IS 'Audit log for all integration activities and API calls';
COMMENT ON TABLE webhook_configurations IS 'Webhook endpoint configurations for real-time integration updates';

COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key for secure verification';
COMMENT ON COLUMN api_keys.key_prefix IS 'Visible prefix shown to users (e.g., nxa_live_1234...)';
COMMENT ON COLUMN api_keys.permissions IS 'Array of permissions: read, write, delete, admin';
COMMENT ON COLUMN api_keys.scopes IS 'API scopes: invoices, clients, payments, analytics, etc.';

COMMENT ON COLUMN third_party_integrations.client_secret_encrypted IS 'AES encrypted OAuth client secret';
COMMENT ON COLUMN third_party_integrations.oauth_token_encrypted IS 'AES encrypted OAuth access token';
COMMENT ON COLUMN third_party_integrations.api_key_encrypted IS 'AES encrypted API key for non-OAuth services'; 