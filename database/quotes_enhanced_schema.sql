-- Enhanced Quotes Database Schema for Nexa Manager
-- This script extends the existing quotes functionality with versioning, templates, and digital signatures
-- Task 65.1: Design Quotes Database Schema with Versioning and Expiry

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Quote Templates Table
CREATE TABLE IF NOT EXISTS quote_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Stores template structure and default items
  is_default BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general', -- general, consulting, product, service
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Enhanced Quotes Table (extends existing)
-- Add new columns to existing quotes table
ALTER TABLE quotes 
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES quote_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS auto_expire_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS acceptance_deadline DATE,
  ADD COLUMN IF NOT EXISTS digital_signature JSONB, -- Stores signature data
  ADD COLUMN IF NOT EXISTS signature_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS valid_until DATE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'it',
  ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- Update status enum to include more states
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
  CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted', 'cancelled', 'revision_requested'));

-- 3. Quote Versions History Table
CREATE TABLE IF NOT EXISTS quote_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  quote_data JSONB NOT NULL, -- Complete quote snapshot
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  change_reason TEXT,
  UNIQUE(quote_id, version_number)
);

-- 4. Quote Status History Table
CREATE TABLE IF NOT EXISTS quote_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  notes TEXT,
  automated BOOLEAN DEFAULT FALSE -- Track if change was automated (e.g., expiry)
);

-- 5. Quote Comments/Notes Table
CREATE TABLE IF NOT EXISTS quote_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE, -- Internal notes vs client-visible
  is_system_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Quote Attachments Table
CREATE TABLE IF NOT EXISTS quote_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Quote Approval Workflow Table
CREATE TABLE IF NOT EXISTS quote_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_level INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. Quote Analytics/Tracking Table
CREATE TABLE IF NOT EXISTS quote_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- viewed, downloaded, shared, etc.
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  client_location JSONB, -- Store geolocation data
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. Enhanced Quote Items Table (extends existing)
-- Add new columns to existing quote_items table
ALTER TABLE quote_items 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'each',
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- 10. Quote Item Alternatives Table
CREATE TABLE IF NOT EXISTS quote_item_alternatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_item_id UUID REFERENCES quote_items(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_parent_quote_id ON quotes(parent_quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_template_id ON quotes(template_id);
CREATE INDEX IF NOT EXISTS idx_quotes_expiry_date ON quotes(expiry_date);
CREATE INDEX IF NOT EXISTS idx_quotes_status_user ON quotes(status, user_id);
CREATE INDEX IF NOT EXISTS idx_quote_versions_quote_id ON quote_versions(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_status_history_quote_id ON quote_status_history(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_comments_quote_id ON quote_comments(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_attachments_quote_id ON quote_attachments(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_approvals_quote_id ON quote_approvals(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_analytics_quote_id ON quote_analytics(quote_id);

-- Enable RLS on new tables
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_item_alternatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Quote Templates
CREATE POLICY "Users can view their own quote templates" ON quote_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quote templates" ON quote_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quote templates" ON quote_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quote templates" ON quote_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Quote Versions
CREATE POLICY "Users can view versions of their own quotes" ON quote_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_versions.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert versions of their own quotes" ON quote_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_versions.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- RLS Policies for Quote Status History
CREATE POLICY "Users can view status history of their own quotes" ON quote_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_status_history.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert status history of their own quotes" ON quote_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_status_history.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- RLS Policies for Quote Comments
CREATE POLICY "Users can view comments on their own quotes" ON quote_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_comments.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert comments on their own quotes" ON quote_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_comments.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own comments" ON quote_comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON quote_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Quote Attachments
CREATE POLICY "Users can view attachments on their own quotes" ON quote_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_attachments.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert attachments on their own quotes" ON quote_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_attachments.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete attachments on their own quotes" ON quote_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_attachments.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- RLS Policies for Quote Approvals
CREATE POLICY "Users can view approvals on their own quotes" ON quote_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_approvals.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert approvals on their own quotes" ON quote_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_approvals.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update approvals on their own quotes" ON quote_approvals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_approvals.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- RLS Policies for Quote Analytics
CREATE POLICY "Users can view analytics on their own quotes" ON quote_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_analytics.quote_id
      AND quotes.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert analytics on their own quotes" ON quote_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_analytics.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- RLS Policies for Quote Item Alternatives
CREATE POLICY "Users can view alternatives for their own quote items" ON quote_item_alternatives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_items qi
      JOIN quotes q ON q.id = qi.quote_id
      WHERE qi.id = quote_item_alternatives.quote_item_id
      AND q.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert alternatives for their own quote items" ON quote_item_alternatives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quote_items qi
      JOIN quotes q ON q.id = qi.quote_id
      WHERE qi.id = quote_item_alternatives.quote_item_id
      AND q.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update alternatives for their own quote items" ON quote_item_alternatives
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quote_items qi
      JOIN quotes q ON q.id = qi.quote_id
      WHERE qi.id = quote_item_alternatives.quote_item_id
      AND q.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete alternatives for their own quote items" ON quote_item_alternatives
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quote_items qi
      JOIN quotes q ON q.id = qi.quote_id
      WHERE qi.id = quote_item_alternatives.quote_item_id
      AND q.user_id = auth.uid()
    )
  );

-- Functions for quote versioning and automation

-- Function to create a new version when quote is updated
CREATE OR REPLACE FUNCTION create_quote_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if significant fields changed
  IF (OLD.status != NEW.status OR 
      OLD.subtotal != NEW.subtotal OR 
      OLD.tax_amount != NEW.tax_amount OR 
      OLD.total_amount != NEW.total_amount OR
      OLD.due_date != NEW.due_date) THEN
    
    -- Increment version number
    NEW.version_number = OLD.version_number + 1;
    
    -- Save previous version to history
    INSERT INTO quote_versions (quote_id, version_number, quote_data, created_by, change_reason)
    VALUES (
      OLD.id,
      OLD.version_number,
      row_to_json(OLD),
      auth.uid(),
      'Automatic version created on update'
    );
    
    -- Log status change if status changed
    IF OLD.status != NEW.status THEN
      INSERT INTO quote_status_history (quote_id, old_status, new_status, changed_by, automated)
      VALUES (OLD.id, OLD.status, NEW.status, auth.uid(), FALSE);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for quote versioning
CREATE OR REPLACE TRIGGER quote_versioning_trigger
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_quote_version();

-- Function to automatically expire quotes
CREATE OR REPLACE FUNCTION expire_quotes()
RETURNS void AS $$
BEGIN
  -- Update expired quotes
  UPDATE quotes 
  SET status = 'expired', updated_at = now()
  WHERE status IN ('draft', 'sent', 'viewed') 
    AND expiry_date IS NOT NULL 
    AND expiry_date < CURRENT_DATE
    AND auto_expire_enabled = TRUE;
    
  -- Log the expiry in status history
  INSERT INTO quote_status_history (quote_id, old_status, new_status, automated, notes)
  SELECT id, status, 'expired', TRUE, 'Automatically expired due to expiry date'
  FROM quotes 
  WHERE status = 'expired' 
    AND updated_at::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send expiry reminders
CREATE OR REPLACE FUNCTION check_quote_expiry_reminders()
RETURNS void AS $$
BEGIN
  -- Mark quotes that need expiry reminders
  UPDATE quotes 
  SET reminder_sent = TRUE
  WHERE status IN ('sent', 'viewed') 
    AND expiry_date IS NOT NULL 
    AND expiry_date - CURRENT_DATE <= 3 -- 3 days before expiry
    AND reminder_sent = FALSE
    AND auto_expire_enabled = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views for common queries

-- View for quote summary with latest version info
CREATE OR REPLACE VIEW quote_summary AS
SELECT 
  q.*,
  c.full_name as client_name,
  c.email as client_email,
  COUNT(qi.id) as item_count,
  CASE 
    WHEN q.expiry_date IS NOT NULL AND q.expiry_date < CURRENT_DATE THEN TRUE 
    ELSE FALSE 
  END as is_expired,
  CASE 
    WHEN q.expiry_date IS NOT NULL AND q.expiry_date - CURRENT_DATE <= 3 THEN TRUE 
    ELSE FALSE 
  END as expires_soon
FROM quotes q
LEFT JOIN clients c ON c.id = q.client_id
LEFT JOIN quote_items qi ON qi.quote_id = q.id
GROUP BY q.id, c.full_name, c.email;

-- View for quote analytics summary
CREATE OR REPLACE VIEW quote_analytics_summary AS
SELECT 
  qa.quote_id,
  COUNT(*) as total_views,
  COUNT(DISTINCT qa.ip_address) as unique_views,
  MAX(qa.tracked_at) as last_viewed,
  COUNT(CASE WHEN qa.event_type = 'downloaded' THEN 1 END) as download_count
FROM quote_analytics qa
GROUP BY qa.quote_id;

-- Add helpful comments
COMMENT ON TABLE quote_templates IS 'Templates for creating standardized quotes with predefined items and structure';
COMMENT ON TABLE quote_versions IS 'Historical versions of quotes for change tracking and audit trail';
COMMENT ON TABLE quote_status_history IS 'Complete history of status changes for quotes with timestamps and reasons';
COMMENT ON TABLE quote_comments IS 'Internal and client-visible comments/notes on quotes';
COMMENT ON TABLE quote_attachments IS 'File attachments linked to quotes (contracts, specifications, etc.)';
COMMENT ON TABLE quote_approvals IS 'Multi-level approval workflow for quotes before sending to clients';
COMMENT ON TABLE quote_analytics IS 'Tracking of quote interactions (views, downloads, shares) for analytics';
COMMENT ON TABLE quote_item_alternatives IS 'Alternative options for quote items to provide choice to clients';

COMMENT ON COLUMN quotes.version_number IS 'Incremental version number for tracking quote revisions';
COMMENT ON COLUMN quotes.parent_quote_id IS 'Reference to original quote if this is a revision';
COMMENT ON COLUMN quotes.template_id IS 'Template used to create this quote';
COMMENT ON COLUMN quotes.expiry_date IS 'Date when quote expires and becomes invalid';
COMMENT ON COLUMN quotes.auto_expire_enabled IS 'Whether to automatically expire this quote';
COMMENT ON COLUMN quotes.digital_signature IS 'JSON data for digital signature when quote is accepted';
COMMENT ON COLUMN quotes.custom_fields IS 'Additional custom fields as JSON for extensibility'; 