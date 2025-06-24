-- Performance optimization indexes for Nexa Manager
-- Execute this script in Supabase SQL Editor

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Indexes for clients table
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients(full_name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_user_name ON clients(user_id, full_name); -- Composite index for user's client searches

-- Indexes for appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, start_time); -- Composite for calendar views
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status); -- Composite for status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON invoices(user_id, issue_date); -- Composite for date-based queries
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Indexes for invoice_items table
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_created_at ON invoice_items(created_at);

-- Indexes for quotes table
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_issue_date ON quotes(issue_date);
CREATE INDEX IF NOT EXISTS idx_quotes_due_date ON quotes(due_date);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_user_status ON quotes(user_id, status); -- Composite for status filtering
CREATE INDEX IF NOT EXISTS idx_quotes_user_date ON quotes(user_id, issue_date); -- Composite for date-based queries
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- Indexes for quote_items table
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_created_at ON quote_items(created_at);

-- Indexes for incomes table
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes(category);
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes(user_id, date); -- Composite for date-based queries
CREATE INDEX IF NOT EXISTS idx_incomes_user_category ON incomes(user_id, category); -- Composite for category filtering
CREATE INDEX IF NOT EXISTS idx_incomes_created_at ON incomes(created_at);

-- Indexes for expenses table
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_is_tax_deductible ON expenses(is_tax_deductible);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date); -- Composite for date-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category); -- Composite for category filtering
CREATE INDEX IF NOT EXISTS idx_expenses_user_tax_deductible ON expenses(user_id, is_tax_deductible); -- Composite for tax reporting
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Indexes for events table (if exists)
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, date); -- Composite for calendar queries
CREATE INDEX IF NOT EXISTS idx_events_user_type ON events(user_id, type); -- Composite for type filtering
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Partial indexes for common queries (only index non-null values)
CREATE INDEX IF NOT EXISTS idx_invoices_overdue ON invoices(user_id, due_date) 
WHERE status != 'paid' AND due_date < CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_quotes_active ON quotes(user_id, issue_date) 
WHERE status IN ('draft', 'sent');

CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(user_id, start_time) 
WHERE status = 'scheduled' AND start_time > NOW();

-- Text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_clients_full_name_gin ON clients USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_invoice_items_description_gin ON invoice_items USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_quote_items_description_gin ON quote_items USING gin(to_tsvector('english', description));

-- Performance monitoring views
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Query to check index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT 
  t.tablename,
  indexname,
  c.reltuples AS num_rows,
  pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size,
  pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.indexname))) AS index_size,
  CASE WHEN indisunique THEN 'Y'
       ELSE 'N'
  END AS UNIQUE,
  idx_scan AS number_of_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_tables t
LEFT OUTER JOIN pg_class c ON c.relname=t.tablename
LEFT OUTER JOIN
  ( SELECT c.relname AS ctablename, ipg.relname AS indexname, x.indnatts AS number_of_columns, idx_scan, idx_tup_read, idx_tup_fetch, indisunique FROM pg_index x
           JOIN pg_class c ON c.oid = x.indrelid
           JOIN pg_class ipg ON ipg.oid = x.indexrelid
           JOIN pg_stat_all_indexes psai ON x.indexrelid = psai.indexrelid )
  AS foo
  ON t.tablename = foo.ctablename
WHERE t.schemaname='public'
ORDER BY 1,2;

-- Comments for documentation
COMMENT ON INDEX idx_clients_user_name IS 'Composite index for efficient client searches by user';
COMMENT ON INDEX idx_invoices_user_status IS 'Composite index for filtering invoices by status per user';
COMMENT ON INDEX idx_invoices_user_date IS 'Composite index for date-based invoice queries per user';
COMMENT ON INDEX idx_quotes_user_status IS 'Composite index for filtering quotes by status per user';
COMMENT ON INDEX idx_quotes_user_date IS 'Composite index for date-based quote queries per user';
COMMENT ON INDEX idx_incomes_user_date IS 'Composite index for date-based income queries per user';
COMMENT ON INDEX idx_expenses_user_date IS 'Composite index for date-based expense queries per user';
COMMENT ON INDEX idx_events_user_date IS 'Composite index for calendar queries per user';

-- Analyze tables to update statistics after creating indexes
ANALYZE profiles;
ANALYZE clients;
ANALYZE appointments;
ANALYZE invoices;
ANALYZE invoice_items;
ANALYZE quotes;
ANALYZE quote_items;
ANALYZE incomes;
ANALYZE expenses;
ANALYZE events; 