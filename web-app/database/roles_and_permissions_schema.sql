-- roles_and_permissions_schema.sql

-- Create a table for roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a table for permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., 'create:invoice', 'delete:client'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a join table for roles and permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Create a table to assign roles to users (many-to-many)
-- This uses the existing 'profiles' table which should have a user_id from Clerk
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL, -- Corresponds to Clerk user ID
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Add comments to tables and columns for clarity
COMMENT ON TABLE roles IS 'Stores user roles for role-based access control.';
COMMENT ON COLUMN roles.name IS 'The unique name of the role (e.g., admin, editor, viewer).';

COMMENT ON TABLE permissions IS 'Stores individual permissions that can be assigned to roles.';
COMMENT ON COLUMN permissions.name IS 'The unique name of the permission (e.g., invoices.create, clients.delete).';

COMMENT ON TABLE role_permissions IS 'Maps which permissions are granted to which roles.';

COMMENT ON TABLE user_roles IS 'Assigns roles to users.';
COMMENT ON COLUMN user_roles.user_id IS 'The ID of the user from the authentication provider (Clerk).';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update the updated_at timestamp on roles and permissions tables
CREATE TRIGGER set_timestamp_roles
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_permissions
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert some default roles and permissions
INSERT INTO roles (name, description) VALUES
('super_admin', 'Has all permissions and can manage roles and permissions.'),
('admin', 'Manages users and content within their organization.'),
('editor', 'Can create and edit content.'),
('viewer', 'Can only view content.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description) VALUES
-- User management
('users.create', 'Can create new users.'),
('users.read', 'Can view user profiles.'),
('users.update', 'Can update user profiles.'),
('users.delete', 'Can delete users.'),
('users.manage_roles', 'Can assign and unassign roles to users.'),

-- Client management
('clients.create', 'Can create new clients.'),
('clients.read', 'Can view client details.'),
('clients.update', 'Can update client details.'),
('clients.delete', 'Can delete clients.'),

-- Invoice management
('invoices.create', 'Can create new invoices.'),
('invoices.read', 'Can view invoices.'),
('invoices.update', 'Can update invoices.'),
('invoices.delete', 'Can delete invoices.'),
('invoices.send', 'Can send invoices to clients.'),
-- Settings management
('settings.update', 'Can update company settings.')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to the super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'super_admin'),
    p.id
FROM permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign a subset of permissions to the admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
WHERE p.name IN (
    'users.create', 'users.read', 'users.update',
    'clients.create', 'clients.read', 'clients.update', 'clients.delete',
    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete', 'invoices.send',
    'settings.update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign content-related permissions to the editor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'editor'),
    p.id
FROM permissions p
WHERE p.name IN (
    'clients.create', 'clients.read', 'clients.update',
   'invoices.create', 'invoices.read', 'invoices.update', 'invoices.send'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign read-only permissions to the viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
WHERE p.name IN ('clients.read', 'invoices.read')
ON CONFLICT (role_id, permission_id) DO NOTHING;