-- Create document search history table for search analytics
CREATE TABLE IF NOT EXISTS document_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    search_time_ms INTEGER DEFAULT 0,
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_search_history_user_id ON document_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_document_search_history_query ON document_search_history(query);
CREATE INDEX IF NOT EXISTS idx_document_search_history_created_at ON document_search_history(created_at);

-- Create RLS (Row Level Security) policies
ALTER TABLE document_search_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own search history
CREATE POLICY "Users can access their own search history" ON document_search_history
    FOR ALL USING (user_id = auth.uid()::text);

-- Grant necessary permissions
GRANT ALL ON document_search_history TO authenticated;

-- Function to clean up old search history (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS void AS $$
BEGIN
    DELETE FROM document_search_history 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_search_history() TO authenticated;