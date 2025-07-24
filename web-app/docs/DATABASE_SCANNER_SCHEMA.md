# Document Scanner Database Schema

## Overview

The Document Scanner system uses Supabase (PostgreSQL) for comprehensive document storage and management. This document outlines the database schema, relationships, and security policies.

## Tables

### scanned_documents

Main table for storing processed documents with full metadata and file references.

```sql
CREATE TABLE scanned_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  client_id TEXT,
  project_id TEXT,
  created_by TEXT NOT NULL,
  original_file_url TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  original_file_size BIGINT NOT NULL,
  original_file_type TEXT NOT NULL,
  enhanced_file_url TEXT NOT NULL,
  enhanced_file_size BIGINT NOT NULL,
  pdf_file_url TEXT,
  pdf_file_size BIGINT,
  text_content TEXT NOT NULL,
  ocr_confidence DECIMAL(3,2) NOT NULL,
  ocr_language TEXT NOT NULL,
  status TEXT NOT NULL,
  processing_errors TEXT[],
  sharing_settings JSONB,
  access_log JSONB[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Unique document identifier (format: `doc_{timestamp}_{random}`) |
| `title` | TEXT | Document title (extracted or user-provided) |
| `description` | TEXT | Optional document description |
| `category` | TEXT | Document category (invoices, receipts, contracts, etc.) |
| `tags` | TEXT[] | Array of tags for categorization |
| `client_id` | TEXT | Associated client ID (foreign key) |
| `project_id` | TEXT | Associated project ID (foreign key) |
| `created_by` | TEXT | User ID who created the document |
| `original_file_url` | TEXT | URL to original uploaded file |
| `original_file_name` | TEXT | Original filename |
| `original_file_size` | BIGINT | Original file size in bytes |
| `original_file_type` | TEXT | MIME type of original file |
| `enhanced_file_url` | TEXT | URL to processed/enhanced image |
| `enhanced_file_size` | BIGINT | Enhanced file size in bytes |
| `pdf_file_url` | TEXT | URL to generated PDF (optional) |
| `pdf_file_size` | BIGINT | PDF file size in bytes (optional) |
| `text_content` | TEXT | Extracted text content from OCR |
| `ocr_confidence` | DECIMAL(3,2) | OCR confidence score (0.00-1.00) |
| `ocr_language` | TEXT | Detected/specified language |
| `status` | TEXT | Processing status (processing, complete, error) |
| `processing_errors` | TEXT[] | Array of error messages if processing failed |
| `sharing_settings` | JSONB | Document sharing configuration |
| `access_log` | JSONB[] | Array of access log entries |
| `created_at` | TIMESTAMPTZ | Document creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX idx_scanned_documents_created_by ON scanned_documents(created_by);
CREATE INDEX idx_scanned_documents_category ON scanned_documents(category);
CREATE INDEX idx_scanned_documents_client_id ON scanned_documents(client_id);
CREATE INDEX idx_scanned_documents_project_id ON scanned_documents(project_id);
CREATE INDEX idx_scanned_documents_created_at ON scanned_documents(created_at DESC);
CREATE INDEX idx_scanned_documents_status ON scanned_documents(status);

-- Full-text search index
CREATE INDEX idx_scanned_documents_text_search ON scanned_documents 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || text_content));

-- Tags array index
CREATE INDEX idx_scanned_documents_tags ON scanned_documents USING gin(tags);
```

## Storage Buckets

### scanner-documents

Permanent storage bucket for processed documents.

```sql
-- Bucket configuration
{
  "public": false,
  "allowedMimeTypes": ["image/*", "application/pdf"],
  "fileSizeLimit": 20971520,  -- 20MB
  "name": "scanner-documents"
}
```

**File Structure:**
```
scanner-documents/
├── {user_id}/
│   ├── originals/
│   │   └── {document_id}_original.{ext}
│   ├── enhanced/
│   │   └── {document_id}_enhanced.jpg
│   └── pdfs/
│       └── {document_id}.pdf
```

### scanner-temp

Temporary storage bucket for files during processing.

```sql
-- Bucket configuration
{
  "public": false,
  "allowedMimeTypes": ["image/*", "application/pdf"],
  "fileSizeLimit": 20971520,  -- 20MB
  "name": "scanner-temp"
}
```

**File Structure:**
```
scanner-temp/
└── {user_id}/
    └── {timestamp}_{filename}
```

**Cleanup Policy:**
- Files older than 1 hour are automatically deleted
- Cleanup runs via scheduled function or manual trigger

## Row Level Security (RLS)

### scanned_documents Policies

```sql
-- Enable RLS
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;

-- Users can only access their own documents
CREATE POLICY "Users can view own documents" ON scanned_documents
  FOR SELECT USING (created_by = auth.uid()::text);

CREATE POLICY "Users can insert own documents" ON scanned_documents
  FOR INSERT WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Users can update own documents" ON scanned_documents
  FOR UPDATE USING (created_by = auth.uid()::text);

CREATE POLICY "Users can delete own documents" ON scanned_documents
  FOR DELETE USING (created_by = auth.uid()::text);
```

### Storage Bucket Policies

```sql
-- scanner-documents bucket policies
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'scanner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'scanner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'scanner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'scanner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- scanner-temp bucket policies (similar structure)
CREATE POLICY "Users can manage temp files" ON storage.objects
  FOR ALL USING (bucket_id = 'scanner-temp' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Data Types

### JSONB Structures

#### sharing_settings

```typescript
interface SharingSettings {
  isPublic: boolean;
  allowedUsers: string[];
  permissions: {
    [userId: string]: 'view' | 'edit' | 'admin';
  };
  publicLink?: {
    enabled: boolean;
    expiresAt?: string;
    password?: string;
  };
}
```

#### access_log entries

```typescript
interface AccessLogEntry {
  userId: string;
  action: 'create' | 'view' | 'edit' | 'delete' | 'share';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}
```

## Relationships

### Foreign Key Relationships

```sql
-- Client relationship (if clients table exists)
ALTER TABLE scanned_documents 
ADD CONSTRAINT fk_scanned_documents_client 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Project relationship (if projects table exists)
ALTER TABLE scanned_documents 
ADD CONSTRAINT fk_scanned_documents_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- User relationship (Supabase auth)
-- Note: created_by references auth.users.id but foreign key not enforced due to auth schema
```

## Triggers and Functions

### Update Timestamp Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger on scanned_documents
CREATE TRIGGER update_scanned_documents_updated_at 
    BEFORE UPDATE ON scanned_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Temporary File Cleanup Function

```sql
-- Function to clean up old temporary files
CREATE OR REPLACE FUNCTION cleanup_temp_scanner_files()
RETURNS void AS $$
BEGIN
    -- Delete files older than 1 hour from scanner-temp bucket
    DELETE FROM storage.objects 
    WHERE bucket_id = 'scanner-temp' 
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (if using pg_cron extension)
SELECT cron.schedule('cleanup-scanner-temp', '0 * * * *', 'SELECT cleanup_temp_scanner_files();');
```

## Query Examples

### Common Queries

#### List User Documents with Pagination

```sql
SELECT 
  id, title, category, tags, client_id, project_id,
  ocr_confidence, status, created_at, updated_at
FROM scanned_documents 
WHERE created_by = $1
ORDER BY created_at DESC 
LIMIT $2 OFFSET $3;
```

#### Full-Text Search

```sql
SELECT 
  id, title, category, text_content,
  ts_rank(to_tsvector('english', title || ' ' || text_content), plainto_tsquery('english', $2)) as rank
FROM scanned_documents 
WHERE created_by = $1
  AND to_tsvector('english', title || ' ' || text_content) @@ plainto_tsquery('english', $2)
ORDER BY rank DESC, created_at DESC;
```

#### Filter by Category and Tags

```sql
SELECT * FROM scanned_documents 
WHERE created_by = $1
  AND category = $2
  AND tags && $3  -- Array overlap operator
ORDER BY created_at DESC;
```

#### Document Statistics

```sql
SELECT 
  COUNT(*) as total_documents,
  SUM(original_file_size + enhanced_file_size + COALESCE(pdf_file_size, 0)) as total_size,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_documents,
  jsonb_object_agg(category, category_count) as by_category
FROM (
  SELECT 
    category,
    COUNT(*) as category_count,
    original_file_size,
    enhanced_file_size,
    pdf_file_size,
    created_at
  FROM scanned_documents 
  WHERE created_by = $1
  GROUP BY category, original_file_size, enhanced_file_size, pdf_file_size, created_at
) stats;
```

## Migration Scripts

### Initial Schema Creation

```sql
-- Create scanned_documents table
CREATE TABLE scanned_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  client_id TEXT,
  project_id TEXT,
  created_by TEXT NOT NULL,
  original_file_url TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  original_file_size BIGINT NOT NULL,
  original_file_type TEXT NOT NULL,
  enhanced_file_url TEXT NOT NULL,
  enhanced_file_size BIGINT NOT NULL,
  pdf_file_url TEXT,
  pdf_file_size BIGINT,
  text_content TEXT NOT NULL DEFAULT '',
  ocr_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  ocr_language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'processing',
  processing_errors TEXT[] DEFAULT '{}',
  sharing_settings JSONB DEFAULT '{"isPublic": false, "allowedUsers": [], "permissions": {}}',
  access_log JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_scanned_documents_created_by ON scanned_documents(created_by);
CREATE INDEX idx_scanned_documents_category ON scanned_documents(category);
CREATE INDEX idx_scanned_documents_created_at ON scanned_documents(created_at DESC);
CREATE INDEX idx_scanned_documents_text_search ON scanned_documents 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || text_content));
CREATE INDEX idx_scanned_documents_tags ON scanned_documents USING gin(tags);

-- Enable RLS
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own documents" ON scanned_documents
  FOR ALL USING (created_by = auth.uid()::text);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('scanner-documents', 'scanner-documents', false, 20971520, '{"image/*","application/pdf"}'),
  ('scanner-temp', 'scanner-temp', false, 20971520, '{"image/*","application/pdf"}');

-- Create storage policies
CREATE POLICY "Users can manage own scanner files" ON storage.objects
  FOR ALL USING (
    bucket_id IN ('scanner-documents', 'scanner-temp') 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Performance Considerations

### Optimization Strategies

1. **Indexing**: Comprehensive indexes on frequently queried columns
2. **Partitioning**: Consider partitioning by date for large datasets
3. **Archiving**: Move old documents to archive tables
4. **File Storage**: Use CDN for frequently accessed files
5. **Caching**: Implement Redis caching for search results

### Monitoring Queries

```sql
-- Monitor table size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename = 'scanned_documents';

-- Monitor index usage
SELECT 
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE relname = 'scanned_documents';
```

## Backup and Recovery

### Backup Strategy

1. **Database Backup**: Regular PostgreSQL dumps
2. **File Storage Backup**: Supabase storage replication
3. **Point-in-Time Recovery**: Supabase PITR capabilities
4. **Cross-Region Replication**: For disaster recovery

### Recovery Procedures

1. **Data Recovery**: Restore from PostgreSQL backup
2. **File Recovery**: Restore from storage backup
3. **Consistency Checks**: Verify file URLs match storage
4. **Reprocessing**: Re-run OCR if needed

---

This schema provides a robust foundation for the Document Scanner system with comprehensive security, performance optimization, and scalability considerations.