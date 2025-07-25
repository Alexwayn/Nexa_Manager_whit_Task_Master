-- Create scanned_documents table for document scanner feature
-- This table stores metadata and references to scanned documents

CREATE TABLE IF NOT EXISTS scanned_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    client_id TEXT,
    project_id TEXT,
    created_by TEXT NOT NULL,
    
    -- Original file information
    original_file_url TEXT NOT NULL,
    original_file_name TEXT NOT NULL,
    original_file_size INTEGER NOT NULL,
    original_file_type TEXT NOT NULL,
    
    -- Enhanced file information
    enhanced_file_url TEXT NOT NULL,
    enhanced_file_size INTEGER NOT NULL,
    
    -- PDF file information (optional)
    pdf_file_url TEXT,
    pdf_file_size INTEGER,
    
    -- OCR results
    text_content TEXT NOT NULL DEFAULT '',
    ocr_confidence DECIMAL(5,2) DEFAULT 0.0,
    ocr_language TEXT DEFAULT 'en',
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'error')),
    processing_errors TEXT[],
    
    -- Sharing and access
    sharing_settings JSONB DEFAULT '{"isShared": false, "accessLevel": "view", "sharedWith": [], "publicLink": null, "expiresAt": null}',
    access_log JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scanned_documents_created_by ON scanned_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_category ON scanned_documents(category);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_client_id ON scanned_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_project_id ON scanned_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_status ON scanned_documents(status);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_created_at ON scanned_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_tags ON scanned_documents USING GIN(tags);

-- Full-text search index for text content
CREATE INDEX IF NOT EXISTS idx_scanned_documents_text_search ON scanned_documents USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || text_content)
);

-- Create RLS (Row Level Security) policies
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own documents
CREATE POLICY "Users can access their own scanned documents" ON scanned_documents
    FOR ALL USING (created_by = auth.uid()::text);

-- Policy: Users can access documents shared with them
CREATE POLICY "Users can access shared scanned documents" ON scanned_documents
    FOR SELECT USING (
        sharing_settings->>'isShared' = 'true' AND
        (
            sharing_settings->'sharedWith' @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text)) OR
            sharing_settings->>'publicLink' IS NOT NULL
        )
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_scanned_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_scanned_documents_updated_at
    BEFORE UPDATE ON scanned_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_scanned_documents_updated_at();

-- Grant necessary permissions
GRANT ALL ON scanned_documents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;