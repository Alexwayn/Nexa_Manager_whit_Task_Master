-- Temporary script to disable RLS on Settings-related tables
-- This allows the Settings page to work while we configure proper Clerk-Supabase integration

-- Disable RLS on security tables
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on email settings tables
ALTER TABLE public.email_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates DISABLE ROW LEVEL SECURITY;

-- Disable RLS on integrations tables
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_activity DISABLE ROW LEVEL SECURITY;

-- Disable RLS on invoice settings tables
ALTER TABLE public.invoice_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates DISABLE ROW LEVEL SECURITY;

-- Note: This is for testing only. In production, we need proper Clerk-Supabase JWT integration
-- To re-enable RLS later, run: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add some basic data for testing
INSERT INTO public.user_roles (user_id, role_id) VALUES 
('user_2z9qln96jIEh6P2CJz7ISXk5HXw', 1) 
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.email_settings (user_id, provider, from_email, from_name) VALUES 
('user_2z9qln96jIEh6P2CJz7ISXk5HXw', 'smtp', 'noreply@nexamanager.com', 'Nexa Manager')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.notification_preferences (user_id, email_notifications, push_notifications) VALUES 
('user_2z9qln96jIEh6P2CJz7ISXk5HXw', true, true)
ON CONFLICT (user_id) DO NOTHING;
