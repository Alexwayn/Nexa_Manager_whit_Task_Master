-- Create document tags and categories tables for document scanner feature

-- Document categories table
CREATE TABLE IF NOT EXISTS document_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6B7280',
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document tags table
CREATE TABLE IF NOT EXISTS document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    category TEXT,
    usage_count INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique tag names per user
    UNIQUE(name, created_by)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_tags_created_by ON document_tags(created_by);
CREATE INDEX IF NOT EXISTS idx_document_tags_name ON document_tags(name);
CREATE INDEX IF NOT EXISTS idx_document_tags_usage_count ON document_tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_document_tags_category ON document_tags(category);

CREATE INDEX IF NOT EXISTS idx_document_categories_name ON document_categories(name);
CREATE INDEX IF NOT EXISTS idx_document_categories_usage_count ON document_categories(usage_count DESC);

-- Insert default document categories
INSERT INTO document_categories (id, name, description, icon, color, is_default) VALUES
    ('invoice', 'Invoice', 'Bills and invoices', 'DocumentTextIcon', '#3B82F6', true),
    ('receipt', 'Receipt', 'Purchase receipts and expense documents', 'DocumentTextIcon', '#10B981', true),
    ('contract', 'Contract', 'Legal contracts and agreements', 'DocumentTextIcon', '#8B5CF6', true),
    ('quote', 'Quote', 'Price quotes and estimates', 'DocumentTextIcon', '#F59E0B', true),
    ('business-card', 'Business Card', 'Business cards and contact information', 'UserIcon', '#EC4899', true),
    ('id-document', 'ID Document', 'Identity documents and personal papers', 'UserIcon', '#06B6D4', true),
    ('report', 'Report', 'Reports and analysis documents', 'FolderIcon', '#84CC16', true),
    ('letter', 'Letter', 'Letters and correspondence', 'DocumentTextIcon', '#F97316', true),
    ('form', 'Form', 'Forms and applications', 'DocumentTextIcon', '#6366F1', true),
    ('other', 'Other', 'Other documents', 'DocumentTextIcon', '#6B7280', true)
ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    is_default = EXCLUDED.is_default;

-- Create RLS (Row Level Security) policies
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tags
CREATE POLICY "Users can access their own document tags" ON document_tags
    FOR ALL USING (created_by = auth.uid()::text);

-- Policy: Everyone can read document categories
CREATE POLICY "Everyone can read document categories" ON document_categories
    FOR SELECT USING (true);

-- Policy: Only authenticated users can update category usage
CREATE POLICY "Authenticated users can update category usage" ON document_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_document_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER trigger_update_document_tags_updated_at
    BEFORE UPDATE ON document_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_document_tags_updated_at();

CREATE TRIGGER trigger_update_document_categories_updated_at
    BEFORE UPDATE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_document_categories_updated_at();

-- Function to increment category usage count
CREATE OR REPLACE FUNCTION increment_category_usage(category_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE document_categories 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON document_tags TO authenticated;
GRANT SELECT, UPDATE ON document_categories TO authenticated;
GRANT EXECUTE ON FUNCTION increment_category_usage(TEXT) TO authenticated;