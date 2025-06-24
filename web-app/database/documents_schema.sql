-- Documents table schema for comprehensive document management
-- Supports invoices, quotes, receipts, reports, contracts, templates

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    -- Primary key
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic document information
    name text NOT NULL CHECK (length(name) > 0),
    type text NOT NULL CHECK (type IN ('invoice', 'quote', 'receipt', 'report', 'contract', 'template')),
    description text,
    
    -- File information
    file_path text, -- Path in Supabase Storage
    file_name text, -- Original file name
    file_size integer, -- File size in bytes
    mime_type text, -- MIME type (application/pdf, image/jpeg, etc.)
    
    -- Document identification
    document_number text, -- Invoice number, quote number, etc.
    
    -- Related entity information
    related_entity_id uuid, -- ID of related client, invoice, etc.
    related_entity_type text, -- Type of related entity (client, invoice, expense, etc.)
    
    -- Organization
    tags text[] DEFAULT '{}', -- Array of tags for categorization
    metadata jsonb DEFAULT '{}', -- Flexible metadata storage
    
    -- Versioning
    version integer DEFAULT 1,
    parent_document_id uuid REFERENCES documents(id), -- For document versions
    
    -- Template and status flags
    is_template boolean DEFAULT false,
    is_active boolean DEFAULT true,
    
    -- Audit fields
    created_by uuid NOT NULL REFERENCES auth.users(id),
    updated_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_related_entity ON documents(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_is_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_is_template ON documents(is_template);
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);

-- Full text search index for document names and descriptions
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(
    to_tsvector('italian', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT
    USING (created_by = auth.uid());

-- Policy: Users can create documents
CREATE POLICY "Users can create documents" ON documents
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own documents (soft delete by setting is_active = false)
CREATE POLICY "Users can delete their own documents" ON documents
    FOR UPDATE
    USING (created_by = auth.uid() AND is_active = true)
    WITH CHECK (created_by = auth.uid() AND is_active = false);

-- Create storage bucket for documents (run this separately in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for document files
-- CREATE POLICY "Users can upload their own documents" ON storage.objects 
--     FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own documents" ON storage.objects 
--     FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update their own documents" ON storage.objects 
--     FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own documents" ON storage.objects 
--     FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create view for document statistics
CREATE OR REPLACE VIEW document_statistics AS
SELECT 
    created_by,
    type,
    COUNT(*) as count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    MIN(created_at) as first_document,
    MAX(created_at) as latest_document
FROM documents 
WHERE is_active = true
GROUP BY created_by, type;

-- Grant access to the view
GRANT SELECT ON document_statistics TO authenticated;

-- Create function to search documents with full text search
CREATE OR REPLACE FUNCTION search_documents(
    search_term text,
    user_id uuid DEFAULT auth.uid(),
    doc_type text DEFAULT NULL,
    limit_count integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    name text,
    type text,
    description text,
    file_name text,
    file_size integer,
    created_at timestamptz,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.type,
        d.description,
        d.file_name,
        d.file_size,
        d.created_at,
        ts_rank(to_tsvector('italian', coalesce(d.name, '') || ' ' || coalesce(d.description, '')), 
                plainto_tsquery('italian', search_term)) as rank
    FROM documents d
    WHERE 
        d.created_by = user_id
        AND d.is_active = true
        AND (doc_type IS NULL OR d.type = doc_type)
        AND (
            to_tsvector('italian', coalesce(d.name, '') || ' ' || coalesce(d.description, '')) 
            @@ plainto_tsquery('italian', search_term)
        )
    ORDER BY rank DESC, d.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_documents TO authenticated;

-- Comments for documentation
COMMENT ON TABLE documents IS 'Comprehensive document management table supporting all document types with versioning, metadata, and file storage integration';
COMMENT ON COLUMN documents.type IS 'Document type: invoice, quote, receipt, report, contract, template';
COMMENT ON COLUMN documents.related_entity_id IS 'ID of related entity (client, invoice, expense, etc.)';
COMMENT ON COLUMN documents.related_entity_type IS 'Type of related entity (client, invoice, expense, etc.)';
COMMENT ON COLUMN documents.metadata IS 'Flexible JSON storage for document-specific metadata';
COMMENT ON COLUMN documents.version IS 'Document version number for version control';
COMMENT ON COLUMN documents.parent_document_id IS 'References parent document for versioning';
COMMENT ON COLUMN documents.is_template IS 'True if this document is a template';
COMMENT ON COLUMN documents.tags IS 'Array of tags for document categorization and filtering'; 