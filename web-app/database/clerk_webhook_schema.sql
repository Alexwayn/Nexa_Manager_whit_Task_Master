-- Clerk Webhook Data Synchronization Schema
-- This schema supports syncing user and organization data from Clerk webhooks

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with Clerk integration
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table with Clerk integration
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_organization_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    members_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization memberships table
CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_membership_id TEXT UNIQUE NOT NULL,
    clerk_organization_id TEXT NOT NULL,
    clerk_user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_organizations_clerk_id ON organizations(clerk_organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_memberships_clerk_id ON organization_memberships(clerk_membership_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON organization_memberships(clerk_organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON organization_memberships(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON organization_memberships(role);

-- Add foreign key constraints
ALTER TABLE organization_memberships 
ADD CONSTRAINT fk_membership_organization 
FOREIGN KEY (clerk_organization_id) REFERENCES organizations(clerk_organization_id) ON DELETE CASCADE;

ALTER TABLE organization_memberships 
ADD CONSTRAINT fk_membership_user 
FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON organization_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can access their own data" ON users
    FOR ALL USING (clerk_user_id = current_setting('app.current_user_clerk_id', true));

-- Organization access based on membership
CREATE POLICY "Organization members can access org data" ON organizations
    FOR SELECT USING (
        clerk_organization_id IN (
            SELECT clerk_organization_id 
            FROM organization_memberships 
            WHERE clerk_user_id = current_setting('app.current_user_clerk_id', true)
        )
    );

-- Membership access policies
CREATE POLICY "Users can access their own memberships" ON organization_memberships
    FOR SELECT USING (clerk_user_id = current_setting('app.current_user_clerk_id', true));

CREATE POLICY "Org admins can manage memberships" ON organization_memberships
    FOR ALL USING (
        clerk_organization_id IN (
            SELECT clerk_organization_id 
            FROM organization_memberships 
            WHERE clerk_user_id = current_setting('app.current_user_clerk_id', true)
            AND role = 'admin'
        )
    );

-- Grant permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON organization_memberships TO authenticated;

-- Grant permissions for webhook service role
GRANT ALL ON users TO service_role;
GRANT ALL ON organizations TO service_role;
GRANT ALL ON organization_memberships TO service_role;

-- Create webhook logging table for monitoring
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_type TEXT NOT NULL,
    clerk_id TEXT,
    event_data JSONB,
    processed_successfully BOOLEAN DEFAULT false,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_clerk_id ON webhook_logs(clerk_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_success ON webhook_logs(processed_successfully);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Grant permissions for webhook logs
GRANT ALL ON webhook_logs TO service_role;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts synced from Clerk authentication service';
COMMENT ON TABLE organizations IS 'Organizations synced from Clerk with multi-tenant support';
COMMENT ON TABLE organization_memberships IS 'User membership in organizations with role-based access';
COMMENT ON TABLE webhook_logs IS 'Audit log for webhook processing events';

COMMENT ON COLUMN users.clerk_user_id IS 'Unique identifier from Clerk authentication service';
COMMENT ON COLUMN users.metadata IS 'Additional data from Clerk including phone numbers, external accounts, etc.';
COMMENT ON COLUMN organizations.clerk_organization_id IS 'Unique organization identifier from Clerk';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly organization identifier';
COMMENT ON COLUMN organization_memberships.role IS 'User role in organization (admin, basic_member, etc.)';

-- Create views for easier data access
CREATE OR REPLACE VIEW user_organization_roles AS
SELECT 
    u.id as user_id,
    u.clerk_user_id,
    u.email,
    u.first_name,
    u.last_name,
    o.id as organization_id,
    o.clerk_organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    m.role,
    m.created_at as membership_created_at
FROM users u
JOIN organization_memberships m ON u.clerk_user_id = m.clerk_user_id
JOIN organizations o ON m.clerk_organization_id = o.clerk_organization_id
WHERE u.active = true AND o.active = true;

COMMENT ON VIEW user_organization_roles IS 'Combined view of users, their organizations, and roles';

-- Create function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_clerk_id TEXT)
RETURNS TABLE (
    organization_id UUID,
    clerk_organization_id TEXT,
    name TEXT,
    slug TEXT,
    logo_url TEXT,
    role TEXT,
    members_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.clerk_organization_id,
        o.name,
        o.slug,
        o.logo_url,
        m.role,
        o.members_count
    FROM organizations o
    JOIN organization_memberships m ON o.clerk_organization_id = m.clerk_organization_id
    WHERE m.clerk_user_id = user_clerk_id
    AND o.active = true
    ORDER BY o.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is organization admin
CREATE OR REPLACE FUNCTION is_organization_admin(user_clerk_id TEXT, org_clerk_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM organization_memberships 
        WHERE clerk_user_id = user_clerk_id 
        AND clerk_organization_id = org_clerk_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 