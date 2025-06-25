-- Invoice Settings Schema for Advanced Invoice Customization
-- This schema supports comprehensive invoice configuration and billing defaults
-- Fixed version with correct table creation order

-- Create invoice templates table first (referenced by invoice_settings)
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_type VARCHAR(20) NOT NULL, -- professional, minimal, creative, classic, detailed
    config JSONB NOT NULL DEFAULT '{}', -- Template-specific configuration
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice settings table for user-specific configurations
CREATE TABLE IF NOT EXISTS invoice_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Settings
    prefix VARCHAR(10) DEFAULT 'INV',
    next_number INTEGER DEFAULT 1,
    numbering_format VARCHAR(20) DEFAULT 'sequential', -- sequential, date_based, yearly_reset, custom
    
    -- Template and Layout
    template_id UUID REFERENCES invoice_templates(id),
    layout_style VARCHAR(20) DEFAULT 'professional', -- professional, minimal, creative, classic
    logo_position VARCHAR(10) DEFAULT 'left', -- left, center, right
    
    -- Payment and Terms
    payment_terms INTEGER DEFAULT 30, -- days
    tax_rate DECIMAL(5,2) DEFAULT 22.00,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Branding
    brand_color VARCHAR(7) DEFAULT '#2563eb',
    footer_text TEXT DEFAULT 'Thank you for your business!',
    
    -- Features
    include_notes BOOLEAN DEFAULT true,
    include_tax_breakdown BOOLEAN DEFAULT true,
    auto_reminders BOOLEAN DEFAULT true,
    reminder_days TEXT DEFAULT '7,14,30', -- comma-separated values
    
    -- Advanced Settings
    language VARCHAR(5) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    number_format VARCHAR(20) DEFAULT 'european', -- european, american
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Create invoice numbering table for tracking sequential numbers
CREATE TABLE IF NOT EXISTS invoice_numbering (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    current_number INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, year, prefix)
);

-- Add RLS policies for security
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_numbering ENABLE ROW LEVEL SECURITY;

-- Invoice templates policies (read-only for users, admin-managed)
CREATE POLICY "Users can view active templates" ON invoice_templates
    FOR SELECT USING (is_active = true);

-- Invoice settings policies
CREATE POLICY "Users can view own invoice settings" ON invoice_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoice settings" ON invoice_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoice settings" ON invoice_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoice settings" ON invoice_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Invoice numbering policies
CREATE POLICY "Users can view own numbering" ON invoice_numbering
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own numbering" ON invoice_numbering
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own numbering" ON invoice_numbering
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert default invoice templates
INSERT INTO invoice_templates (name, description, template_type, config, is_default) VALUES
('Professional', 'Clean and modern template suitable for most businesses', 'professional', '{"colors": {"primary": "#2563eb", "secondary": "#64748b"}, "fonts": {"header": "Inter", "body": "Inter"}, "layout": {"margins": "normal", "spacing": "comfortable"}}', true),
('Minimal', 'Simple and clean design with minimal styling', 'minimal', '{"colors": {"primary": "#000000", "secondary": "#6b7280"}, "fonts": {"header": "Inter", "body": "Inter"}, "layout": {"margins": "tight", "spacing": "compact"}}', false),
('Creative', 'Modern template with creative design elements', 'creative', '{"colors": {"primary": "#7c3aed", "secondary": "#a855f7"}, "fonts": {"header": "Inter", "body": "Inter"}, "layout": {"margins": "normal", "spacing": "spacious"}}', false),
('Classic', 'Traditional business template with serif fonts', 'classic', '{"colors": {"primary": "#1f2937", "secondary": "#4b5563"}, "fonts": {"header": "Times", "body": "Times"}, "layout": {"margins": "wide", "spacing": "traditional"}}', false),
('Detailed', 'Comprehensive template with all available fields', 'detailed', '{"colors": {"primary": "#059669", "secondary": "#10b981"}, "fonts": {"header": "Inter", "body": "Inter"}, "layout": {"margins": "normal", "spacing": "detailed"}}', false);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_invoice_templates_updated_at 
    BEFORE UPDATE ON invoice_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_invoice_settings_updated_at 
    BEFORE UPDATE ON invoice_settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_invoice_numbering_updated_at 
    BEFORE UPDATE ON invoice_numbering 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_invoice_templates_type ON invoice_templates(template_type);
CREATE INDEX idx_invoice_templates_active ON invoice_templates(is_active);
CREATE INDEX idx_invoice_settings_user_id ON invoice_settings(user_id);
CREATE INDEX idx_invoice_numbering_user_year ON invoice_numbering(user_id, year); 